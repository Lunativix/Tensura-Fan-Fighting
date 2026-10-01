import Phaser from 'phaser'
import { audio } from '../audio/AudioManager.ts'
import { musicManager } from '../audio/music/MusicManager.ts'
import { MusicEvent } from '../audio/music/types.ts'
import { PlayMode, session } from '../game/GameState.ts'
import { SceneKeys } from '../game/SceneKeys.ts'
import { applyFightToSave } from '../account/ops.ts'
import { saveManager } from '../save/SaveManager.ts'
import { GameFlow } from '../types/game.ts'
import { MenuInput } from '../input/MenuInput.ts'
import { drawMenuBackdrop } from '../ui/Backdrop.ts'
import { MenuButton } from '../ui/MenuButton.ts'
import { CHARACTERS, PLAYABLE_FIGHTERS } from '../config/characters.ts'
import { defeatLine, victoryLine } from '../dialogue/combatBanter.ts'
import { AiDifficulty } from '../ai/AiDifficulty.ts'

export class ResultScene extends Phaser.Scene {
  private inputMenu!: MenuInput

  constructor() {
    super(SceneKeys.Result)
  }

  create(): void {
    const win = session.flow === GameFlow.VICTORY
    const data = saveManager.load()
    applyFightToSave(data, win)
    saveManager.save(data)

    audio.playSfx(win ? 'victory' : 'defeat')
    musicManager.event(win ? MusicEvent.Victory : MusicEvent.Defeat)
    drawMenuBackdrop(this)
    this.add.text(960, 220, win ? 'VICTORY' : 'DEFEAT', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '72px',
      color: win ? '#b9f6ca' : '#ff8a80',
      fontStyle: 'bold',
    }).setOrigin(0.5)
    this.add.text(960, 310, `XP ${data.profile.xp}  Nv ${data.profile.level}  Crédits ${data.inventory.credits}`, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '22px',
      color: '#c9def5',
    }).setOrigin(0.5)
    const speaker = CHARACTERS[session.playerFighter]?.name ?? 'Rimuru'
    const quote = win ? victoryLine(session.playerFighter) : defeatLine(session.playerFighter)
    this.add.text(960, 360, `${speaker} : ${quote}`, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '26px',
      color: '#eaf6ff',
      fontStyle: 'italic',
    }).setOrigin(0.5)

    const items: { label: string; run: () => void }[] = []
    if (win && session.playMode === PlayMode.ARCADE && session.arcadeIndex < session.arcadeQueue.length - 1) {
      items.push({
        label: 'NEXT ARCADE FIGHT',
        run: () => {
          session.arcadeIndex += 1
          session.cpuFighter = session.arcadeQueue[session.arcadeIndex] ?? session.cpuFighter
          if (session.arcadeIndex >= 2) {
            session.aiDifficulty = AiDifficulty.HARD
          }
          this.scene.start(SceneKeys.Fight)
        },
      })
    }
    if (win && session.playMode === PlayMode.SURVIVAL) {
      items.push({
        label: 'NEXT SURVIVAL',
        run: () => {
          session.survivalRound += 1
          session.cpuFighter = PLAYABLE_FIGHTERS[session.survivalRound % PLAYABLE_FIGHTERS.length] ?? session.cpuFighter
          this.scene.start(SceneKeys.Fight)
        },
      })
    }
    items.push({
      label: 'RESTART',
      run: () => this.scene.start(SceneKeys.Fight),
    })
    items.push({
      label: 'MENU',
      run: () => {
        session.playMode = PlayMode.VERSUS_CPU
        this.scene.start(SceneKeys.Hub)
      },
    })

    const buttons = items.map((item, i) => new MenuButton(this, 960, 470 + i * 90, item.label, () => {
      audio.playSfx('confirm')
      item.run()
    }))
    buttons[0]?.setSelected(true)
    let index = 0
    this.inputMenu = new MenuInput()
    this.inputMenu.attach()
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.inputMenu.detach())
    this.events.on('update', () => {
      if (this.inputMenu.justUp || this.inputMenu.justDown) {
        index = (index + (this.inputMenu.justDown ? 1 : -1) + buttons.length) % buttons.length
        buttons.forEach((b, i) => b.setSelected(i === index))
        audio.playSfx('move')
      }
      if (this.inputMenu.justConfirm) {
        buttons[index]?.activate()
      }
      if (this.inputMenu.justBack) {
        buttons[buttons.length - 1]?.activate()
      }
    })
  }
}
