import Phaser from 'phaser'
import { audio } from '../audio/AudioManager.ts'
import { PATCH_NOTES } from '../config/patchNotes.ts'
import { GAME_CODENAME, GAME_VERSION } from '../game/version.ts'
import { SceneKeys } from '../game/SceneKeys.ts'
import { MenuInput } from '../input/MenuInput.ts'
import { drawMenuBackdrop } from '../ui/Backdrop.ts'

export class PatchNotesScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.PatchNotes)
  }

  create(): void {
    drawMenuBackdrop(this)
    const input = new MenuInput()
    input.attach()
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => input.detach())
    this.add.text(960, 80, `PATCH NOTES  ${GAME_VERSION}  ${GAME_CODENAME}`, {
      fontFamily: 'Segoe UI, sans-serif', fontSize: '36px', color: '#eaf6ff',
    }).setOrigin(0.5)
    let y = 160
    for (const note of PATCH_NOTES) {
      this.add.text(200, y, `v${note.version}`, { fontFamily: 'Segoe UI, sans-serif', fontSize: '28px', color: '#ffe082' })
      y += 44
      this.add.text(200, y, `NEW  ${note.new.join('  |  ')}`, { fontFamily: 'Segoe UI, sans-serif', fontSize: '20px', color: '#c8e6c9', wordWrap: { width: 1500 } })
      y += 50
      this.add.text(200, y, `BALANCE  ${note.balance.join('  |  ')}`, { fontFamily: 'Segoe UI, sans-serif', fontSize: '20px', color: '#b3e5fc', wordWrap: { width: 1500 } })
      y += 50
      this.add.text(200, y, `FIXES  ${note.fixes.join('  |  ')}`, { fontFamily: 'Segoe UI, sans-serif', fontSize: '20px', color: '#ffcdd2', wordWrap: { width: 1500 } })
      y += 50
      this.add.text(200, y, `IMPROVEMENTS  ${note.improvements.join('  |  ')}`, { fontFamily: 'Segoe UI, sans-serif', fontSize: '20px', color: '#d1c4e9', wordWrap: { width: 1500 } })
      y += 80
    }
    this.add.text(960, 1000, 'Esc back', { fontFamily: 'Segoe UI, sans-serif', fontSize: '18px', color: '#6d88a8' }).setOrigin(0.5)
    this.events.on('update', () => {
      if (input.justBack) {
        audio.playSfx('back')
        this.scene.start(SceneKeys.Settings)
      }
    })
  }
}
