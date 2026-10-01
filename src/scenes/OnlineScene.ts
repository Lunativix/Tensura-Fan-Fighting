import Phaser from 'phaser'
import { audio } from '../audio/AudioManager.ts'
import { network } from '../network/NetworkClient.ts'
import { SceneKeys } from '../game/SceneKeys.ts'
import { drawMenuBackdrop } from '../ui/Backdrop.ts'
import { VerticalMenu } from '../ui/VerticalMenu.ts'
import { openDiscord } from '../config/community.ts'

export class OnlineScene extends Phaser.Scene {
  private menu!: VerticalMenu
  private status!: Phaser.GameObjects.Text

  constructor() {
    super(SceneKeys.Online)
  }

  create(): void {
    drawMenuBackdrop(this)
    this.add.text(960, 140, 'ONLINE', { fontFamily: 'Segoe UI, sans-serif', fontSize: '48px', color: '#eaf6ff' }).setOrigin(0.5)
    this.status = this.add.text(960, 230, 'Server unavailable — offline play remains fully working.', {
      fontFamily: 'Segoe UI, sans-serif', fontSize: '22px', color: '#ffcc80', align: 'center',
    }).setOrigin(0.5)
    this.menu = new VerticalMenu(this, 360, [
      { label: 'QUICK MATCH', run: () => void this.tryMatch() },
      { label: 'CREATE ROOM', run: () => {
        const code = network.createRoom()
        this.status.setText(`Room ${code} — server still unavailable.`)
      } },
      { label: 'DISCORD', run: () => {
        audio.playSfx('confirm')
        openDiscord()
      } },
      { label: 'BACK', run: () => this.scene.start(SceneKeys.Hub) },
    ])
  }

  update(): void {
    this.menu.update()
    if (this.menu.justBack) {
      audio.playSfx('back')
      this.scene.start(SceneKeys.Hub)
    }
  }

  private async tryMatch(): Promise<void> {
    const ok = await network.quickMatch()
    this.status.setText(ok ? 'Match found' : `Online ${network.state}. Returning to CPU versus is available from Mode Select.`)
  }
}
