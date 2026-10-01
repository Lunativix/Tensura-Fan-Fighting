import Phaser from 'phaser'
import { AiDifficulty } from '../ai/AiDifficulty.ts'
import { audio } from '../audio/AudioManager.ts'
import { FighterId } from '../types/game.ts'
import { PlayMode, session } from '../game/GameState.ts'
import { cycleMode } from '../combat/variants/index.ts'
import { SceneKeys } from '../game/SceneKeys.ts'
import { drawMenuBackdrop } from '../ui/Backdrop.ts'
import { VerticalMenu } from '../ui/VerticalMenu.ts'
import { saveManager } from '../save/SaveManager.ts'
import { MatchMode } from '../types/game.ts'

export class ModeSelectScene extends Phaser.Scene {
  private menu!: VerticalMenu

  constructor() {
    super(SceneKeys.ModeSelect)
  }

  create(): void {
    drawMenuBackdrop(this)
    this.add.text(960, 90, 'SELECT MODE', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '46px',
      color: '#eaf6ff',
    }).setOrigin(0.5)
    this.add.text(960, 140, `CPU ${session.aiDifficulty}  •  ${session.ranked ? 'RANKED' : 'UNRANKED'}  •  P2 arrows+numpad`, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '20px',
      color: '#8fb4d9',
    }).setOrigin(0.5)
    this.menu = new VerticalMenu(this, 168, [
      { label: 'CYCLE CPU DIFFICULTY', run: () => this.cycleDiff() },
      { label: 'TOGGLE RANKED', run: () => {
        session.ranked = !session.ranked
        this.scene.restart()
      } },
      { label: `VARIANTES  ${session.variantMode.toUpperCase()}`, run: () => {
        session.variantMode = cycleMode(session.variantMode, 1)
        this.scene.restart()
      } },
      { label: 'VERSUS CPU', run: () => this.go(PlayMode.VERSUS_CPU, SceneKeys.CharacterSelect) },
      { label: 'VERSUS LOCAL', run: () => this.go(PlayMode.VERSUS_LOCAL, SceneKeys.CharacterSelect) },
      { label: 'ARCADE', run: () => this.startArcade() },
      { label: 'SURVIVAL', run: () => this.startSurvival() },
      { label: 'STORY', run: () => this.scene.start(SceneKeys.Story) },
      { label: 'TRAINING', run: () => this.scene.start(SceneKeys.Training) },
      { label: 'ONLINE', run: () => this.scene.start(SceneKeys.Online) },
      { label: 'EVENTS / ROADMAP', run: () => this.scene.start(SceneKeys.Events) },
      { label: 'SHOP', run: () => this.scene.start(SceneKeys.Shop) },
    ], 70)
  }

  update(): void {
    this.menu.update()
    if (this.menu.justBack) {
      audio.playSfx('back')
      this.scene.start(SceneKeys.Hub)
    }
  }

  private cycleDiff(): void {
    const order = [AiDifficulty.EASY, AiDifficulty.NORMAL, AiDifficulty.HARD, AiDifficulty.EXPERT] as const
    const i = order.indexOf(session.aiDifficulty)
    session.aiDifficulty = order[(i + 1) % order.length] ?? AiDifficulty.NORMAL
    const data = saveManager.load()
    data.settings.aiDifficulty = session.aiDifficulty
    saveManager.save(data)
    this.scene.restart()
  }

  private go(mode: typeof PlayMode[keyof typeof PlayMode], scene: string): void {
    session.playMode = mode
    session.matchMode = mode === PlayMode.VERSUS_LOCAL ? MatchMode.PVP : MatchMode.PVE
    session.trainingMode = false
    this.scene.start(scene)
  }

  private startArcade(): void {
    session.playMode = PlayMode.ARCADE
    session.arcadeQueue = [FighterId.benimaru, FighterId.shion, FighterId.veldora, FighterId.milim]
    session.arcadeIndex = 0
    session.aiDifficulty = AiDifficulty.NORMAL
    this.scene.start(SceneKeys.CharacterSelect)
  }

  private startSurvival(): void {
    session.playMode = PlayMode.SURVIVAL
    session.survivalRound = 1
    session.survivalHp = 1000
    this.scene.start(SceneKeys.CharacterSelect)
  }
}
