import Phaser from 'phaser'
import { audio } from '../audio/AudioManager.ts'
import { CONTENT_ROADMAP } from '../config/roadmap.ts'
import { SceneKeys } from '../game/SceneKeys.ts'
import { MenuInput } from '../input/MenuInput.ts'
import { drawMenuBackdrop } from '../ui/Backdrop.ts'
import { activeEvents, formatCountdown, matchEventCreditBonus, remainingMs } from '../live/events.ts'

export class EventsScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Events)
  }

  create(): void {
    drawMenuBackdrop(this)
    const input = new MenuInput()
    input.attach()
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => input.detach())
    this.add.text(960, 80, 'EVENTS / ROADMAP', {
      fontFamily: 'Segoe UI, sans-serif', fontSize: '40px', color: '#eaf6ff',
    }).setOrigin(0.5)
    const live = activeEvents()[0]
    const bonus = matchEventCreditBonus()
    this.add.text(960, 150, live
      ? `${live.title}  —  encore ${formatCountdown(remainingMs(live.endDate))}${bonus > 0 ? `  •  +${bonus} cr / combat` : ''}`
      : 'Pas d\'evenement live', {
      fontFamily: 'Segoe UI, sans-serif', fontSize: '22px', color: '#ffe082',
    }).setOrigin(0.5)
    CONTENT_ROADMAP.slice(0, 14).forEach((slot, i) => {
      const x = 280 + (i % 2) * 900
      const y = 230 + Math.floor(i / 2) * 52
      this.add.text(x, y, `${slot.name}  [${slot.status}]  ${slot.priority}  ${slot.free ? 'FREE' : 'unlock later'}`, {
        fontFamily: 'Segoe UI, sans-serif', fontSize: '20px', color: slot.status === 'available' ? '#c8e6c9' : '#90a4ae',
      })
    })
    this.add.text(960, 1000, 'Esc back', { fontFamily: 'Segoe UI, sans-serif', fontSize: '18px', color: '#6d88a8' }).setOrigin(0.5)
    this.events.on('update', () => {
      if (input.justBack) {
        audio.playSfx('back')
        this.scene.start(SceneKeys.Hub)
      }
    })
  }
}
