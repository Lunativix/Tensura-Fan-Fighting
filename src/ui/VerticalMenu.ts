import Phaser from 'phaser'
import { audio } from '../audio/AudioManager.ts'
import { MenuInput } from '../input/MenuInput.ts'
import { MenuButton } from './MenuButton.ts'

export interface MenuItem {
  label: string
  run: () => void
}

export class VerticalMenu {
  private readonly buttons: MenuButton[]
  private index = 0
  readonly input = new MenuInput()

  constructor(scene: Phaser.Scene, startY: number, items: MenuItem[], gap = 72) {
    this.buttons = items.map((item, i) => new MenuButton(scene, 960, startY + i * gap, item.label, item.run))
    this.input.attach()
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.input.detach())
    this.select(0)
  }

  update(): void {
    if (this.input.justUp) {
      this.select(this.index - 1)
      audio.playSfx('move')
    }
    if (this.input.justDown) {
      this.select(this.index + 1)
      audio.playSfx('move')
    }
    if (this.input.justConfirm) {
      audio.playSfx('confirm')
      this.buttons[this.index]?.activate()
    }
  }

  get justBack(): boolean {
    return this.input.justBack
  }

  private select(next: number): void {
    const count = this.buttons.length
    this.index = ((next % count) + count) % count
    this.buttons.forEach((button, i) => button.setSelected(i === this.index))
  }
}
