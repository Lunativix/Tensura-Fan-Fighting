import Phaser from 'phaser'
import { GameFlow } from '../types/game.ts'
import { PlayMode, session } from '../game/GameState.ts'
import { SceneKeys } from '../game/SceneKeys.ts'
import { strings } from '../i18n/strings.ts'
import { audio } from '../audio/AudioManager.ts'
import { MenuInput } from '../input/MenuInput.ts'
import { drawMenuBackdrop } from '../ui/Backdrop.ts'
import { MenuButton } from '../ui/MenuButton.ts'

export class TrainingScene extends Phaser.Scene {
  private inputMenu = new MenuInput()

  constructor() {
    super(SceneKeys.Training)
  }

  create(): void {
    session.flow = GameFlow.TRAINING
    drawMenuBackdrop(this)
    this.add.text(960, 220, strings.training, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '54px',
      color: '#eaf6ff',
    }).setOrigin(0.5)
    this.add.text(960, 300, 'Dummy CPU   hitboxes   infinite resources', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '22px',
      color: '#9ec4e8',
    }).setOrigin(0.5)

    const start = new MenuButton(this, 960, 480, 'START TRAINING', () => this.launch())
    start.setSelected(true)
    const back = new MenuButton(this, 960, 570, strings.back, () => {
      audio.playSfx('back')
      this.scene.start(SceneKeys.Hub)
    })
    this.inputMenu.attach()
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.inputMenu.detach())

    let index = 0
    this.events.on('update', () => {
      if (this.inputMenu.justUp || this.inputMenu.justDown) {
        index = index === 0 ? 1 : 0
        start.setSelected(index === 0)
        back.setSelected(index === 1)
        audio.playSfx('move')
      }
      if (this.inputMenu.justConfirm) {
        if (index === 0) {
          start.activate()
        } else {
          back.activate()
        }
      }
      if (this.inputMenu.justBack) {
        back.activate()
      }
    })
  }

  private launch(): void {
    audio.playSfx('confirm')
    session.trainingMode = true
    session.infiniteResources = true
    session.showHitboxes = true
    session.playMode = PlayMode.TRAINING
    this.scene.start(SceneKeys.CharacterSelect)
  }
}
