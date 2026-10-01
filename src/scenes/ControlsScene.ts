import Phaser from 'phaser'
import { audio } from '../audio/AudioManager.ts'
import { GameFlow } from '../types/game.ts'
import { session } from '../game/GameState.ts'
import { SceneKeys } from '../game/SceneKeys.ts'
import { BINDABLE_ACTIONS } from '../input/Actions.ts'
import { KeyboardPreset, prettyCode } from '../input/bindings.ts'
import {
  applyPreset,
  BINDING_LABELS,
  getKeyboardBindings,
  getPadIndex,
  getPreset,
  setKeyboardBinding,
} from '../input/BindingStore.ts'
import { listGamepads } from '../input/InputDeviceManager.ts'
import { nextPhysicalCode } from '../input/InputManager.ts'
import { MenuInput } from '../input/MenuInput.ts'
import { saveManager } from '../save/SaveManager.ts'
import { drawMenuBackdrop } from '../ui/Backdrop.ts'

export class ControlsScene extends Phaser.Scene {
  private inputMenu = new MenuInput()
  private index = 0
  private listening = false
  private status!: Phaser.GameObjects.Text
  private rows: Phaser.GameObjects.Text[] = []
  private conflict: { actionIndex: number; code: string } | null = null

  constructor() {
    super(SceneKeys.Controls)
  }

  create(): void {
    session.flow = GameFlow.SETTINGS
    drawMenuBackdrop(this)
    this.inputMenu.attach()
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.inputMenu.detach())

    this.add.text(960, 56, 'CONTROLS', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '42px',
      color: '#eaf6ff',
    }).setOrigin(0.5)

    this.status = this.add.text(960, 104, '', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '20px',
      color: '#9ec4e8',
      align: 'center',
    }).setOrigin(0.5)

    this.rows = []
    BINDABLE_ACTIONS.forEach((_action, i) => {
      const row = this.add.text(280, 150 + i * 42, '', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '22px',
        color: '#d7ebff',
      })
      this.rows.push(row)
    })

    this.add.text(960, 1040, 'Enter remap   Left/Right preset   Esc back   Y/N conflict', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '18px',
      color: '#6d88a8',
    }).setOrigin(0.5)

    this.refresh()
  }

  update(): void {
    if (this.listening) {
      return
    }
    if (this.conflict) {
      if (this.inputMenu.justConfirm) {
        this.resolveConflict(true)
      }
      if (this.inputMenu.justBack) {
        this.resolveConflict(false)
      }
      return
    }
    if (this.inputMenu.justBack) {
      audio.playSfx('back')
      this.persist()
      this.scene.start(SceneKeys.Settings)
      return
    }
    if (this.inputMenu.justUp) {
      this.index = (this.index - 1 + BINDABLE_ACTIONS.length) % BINDABLE_ACTIONS.length
      audio.playSfx('move')
      this.refresh()
    }
    if (this.inputMenu.justDown) {
      this.index = (this.index + 1) % BINDABLE_ACTIONS.length
      audio.playSfx('move')
      this.refresh()
    }
    if (this.inputMenu.justLeft) {
      this.cyclePreset(-1)
    }
    if (this.inputMenu.justRight) {
      this.cyclePreset(1)
    }
    if (this.inputMenu.justConfirm) {
      void this.capture()
    }
  }

  private cyclePreset(dir: number): void {
    const order = [KeyboardPreset.CLASSIC, KeyboardPreset.DEFAULT, KeyboardPreset.MODERN] as const
    const cur = getPreset()
    let i = order.indexOf(cur === KeyboardPreset.CUSTOM ? KeyboardPreset.CLASSIC : cur)
    if (i < 0) {
      i = 0
    }
    const next = order[(i + dir + order.length) % order.length]
    applyPreset(next)
    audio.playSfx('confirm')
    this.persist()
    this.refresh()
  }

  private async capture(): Promise<void> {
    this.listening = true
    this.status.setText('PRESS NEW BUTTON')
    const code = await nextPhysicalCode()
    this.listening = false
    const action = BINDABLE_ACTIONS[this.index]
    if (!action) {
      this.refresh()
      return
    }
    const conflict = setKeyboardBinding(action, code, false)
    if (conflict) {
      this.conflict = { actionIndex: this.index, code }
      this.status.setText(`CONTROL CONFLICT with ${BINDING_LABELS[conflict]}. Enter = replace, Esc = cancel.`)
      return
    }
    audio.playSfx('confirm')
    this.persist()
    this.refresh()
  }

  private resolveConflict(replace: boolean): void {
    if (!this.conflict) {
      return
    }
    const action = BINDABLE_ACTIONS[this.conflict.actionIndex]
    if (replace && action) {
      setKeyboardBinding(action, this.conflict.code, true)
      audio.playSfx('confirm')
      this.persist()
    } else {
      audio.playSfx('back')
    }
    this.conflict = null
    this.refresh()
  }

  private persist(): void {
    const data = saveManager.load()
    saveManager.save(data)
  }

  private refresh(): void {
    const pads = listGamepads()
    const pad = pads.find((p) => p.index === getPadIndex())
    this.status.setText(
      `Preset ${getPreset()}   Device ${pad ? pad.id.slice(0, 42) : 'Keyboard'}   Pads ${pads.length}`,
    )
    const map = getKeyboardBindings()
    BINDABLE_ACTIONS.forEach((action, i) => {
      const row = this.rows[i]
      if (!row) {
        return
      }
      const mark = i === this.index ? '>' : ' '
      row.setText(`${mark} ${BINDING_LABELS[action].padEnd(18)}  ${prettyCode(map[action])}`)
      row.setColor(i === this.index ? '#ffffff' : '#9ec4e8')
    })
  }
}
