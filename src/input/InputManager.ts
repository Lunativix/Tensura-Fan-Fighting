import { emptyActions, type FighterActions } from './Actions.ts'
import { getKeyboardBindings, getPadIndex } from './BindingStore.ts'
import type { KeyboardBindings } from './bindings.ts'

const DEADZONE = 0.28
const BUFFER_FRAMES = 8

const heldCodes = new Set<string>()
let codeListenerBound = false

function bindCodeListeners(): void {
  if (codeListenerBound) {
    return
  }
  codeListenerBound = true
  window.addEventListener('keydown', (event) => {
    heldCodes.add(event.code)
  })
  window.addEventListener('keyup', (event) => {
    heldCodes.delete(event.code)
  })
  window.addEventListener('blur', () => heldCodes.clear())
}

export class InputManager {
  private readonly held = emptyActions()
  private readonly buffer = {
    jump: 0, light: 0, medium: 0, heavy: 0, dash: 0,
    skill1: 0, skill2: 0, skill3: 0, skill4: 0, ultimate: 0,
  }
  private prevPad: Record<string, boolean> = {}
  private capturing = false
  private readonly mapOverride: KeyboardBindings | undefined
  private readonly padOverride: number | undefined

  constructor(options?: { map?: KeyboardBindings, padIndex?: number }) {
    bindCodeListeners()
    this.mapOverride = options?.map
    this.padOverride = options?.padIndex
  }

  setCapturing(value: boolean): void {
    this.capturing = value
  }

  isPressed(code: string): boolean {
    return heldCodes.has(code)
  }

  read(): FighterActions {
    if (this.capturing) {
      return emptyActions()
    }
    const map = this.mapOverride ?? getKeyboardBindings()
    const pad = navigator.getGamepads ? navigator.getGamepads()[this.padOverride ?? getPadIndex()] : null

    this.pulse('jump', this.edgeCode(map.JUMP) || this.pressed(pad, 0))
    this.pulse('light', this.edgeCode(map.LIGHT) || this.pressed(pad, 2))
    this.pulse('medium', this.edgeCode(map.MEDIUM) || this.pressed(pad, 3))
    this.pulse('heavy', this.edgeCode(map.HEAVY) || this.pressed(pad, 1))
    this.pulse('dash', this.edgeCode(map.DASH) || this.pressed(pad, 5))
    this.pulse('skill1', this.edgeCode(map.SKILL_1) || this.pressed(pad, 4))
    this.pulse('skill2', this.edgeCode(map.SKILL_2) || this.axisButton(pad, 'l2', pad ? pad.buttons[6]?.value ?? 0 : 0))
    this.pulse('skill3', this.edgeCode(map.SKILL_3) || this.axisButton(pad, 'r2', pad ? pad.buttons[7]?.value ?? 0 : 0))
    this.pulse('skill4', this.edgeCode(map.SKILL_4) || this.pressed(pad, 10))
    this.pulse('ultimate', this.edgeCode(map.ULTIMATE) || this.pressed(pad, 11))

    const axisX = pad ? this.axis(pad.axes[0] ?? 0, pad.buttons[14]?.value ?? 0, pad.buttons[15]?.value ?? 0) : 0
    const axisY = pad ? this.axis(pad.axes[1] ?? 0, pad.buttons[12]?.value ?? 0, pad.buttons[13]?.value ?? 0) : 0

    this.held.left = heldCodes.has(map.LEFT) || axisX < 0
    this.held.right = heldCodes.has(map.RIGHT) || axisX > 0
    this.held.down = heldCodes.has(map.DOWN) || axisY > 0
    this.held.jump = this.consume('jump')
    this.held.guard = heldCodes.has(map.GUARD) || (pad ? (pad.buttons[4]?.value ?? 0) > 0.4 : false)
    this.held.light = this.consume('light')
    this.held.medium = this.consume('medium')
    this.held.heavy = this.consume('heavy')
    this.held.dash = this.consume('dash')
    this.held.skill1 = this.consume('skill1')
    this.held.skill2 = this.consume('skill2')
    this.held.skill3 = this.consume('skill3')
    this.held.skill4 = this.consume('skill4')
    this.held.ultimate = this.consume('ultimate')
    return this.held
  }

  justRestart(): boolean {
    const map = getKeyboardBindings()
    const pad = navigator.getGamepads ? navigator.getGamepads()[getPadIndex()] : null
    return this.edgeCode(map.RESTART) || this.pressed(pad, 8)
  }

  justPause(): boolean {
    const map = getKeyboardBindings()
    const pad = navigator.getGamepads ? navigator.getGamepads()[getPadIndex()] : null
    return this.edgeCode(map.PAUSE) || this.pressed(pad, 9)
  }

  private prevCodes = new Set<string>()

  private edgeCode(code: string): boolean {
    const down = heldCodes.has(code)
    const was = this.prevCodes.has(code)
    if (down) {
      this.prevCodes.add(code)
    } else {
      this.prevCodes.delete(code)
    }
    return down && !was
  }

  private axis(stick: number, neg: number, pos: number): number {
    if (neg > 0.4) {
      return -1
    }
    if (pos > 0.4) {
      return 1
    }
    if (Math.abs(stick) < DEADZONE) {
      return 0
    }
    return stick > 0 ? 1 : -1
  }

  private axisButton(pad: Gamepad | null, key: string, value: number): boolean {
    if (!pad) {
      return false
    }
    const down = value > 0.45
    const was = this.prevPad[key] === true
    this.prevPad[key] = down
    return down && !was
  }

  private pressed(pad: Gamepad | null, index: number): boolean {
    if (!pad) {
      return false
    }
    const down = (pad.buttons[index]?.value ?? 0) > 0.45
    const key = `b${index}`
    const was = this.prevPad[key] === true
    this.prevPad[key] = down
    return down && !was
  }

  private pulse(name: keyof InputManager['buffer'], on: boolean): void {
    if (on) {
      this.buffer[name] = BUFFER_FRAMES
    } else if (this.buffer[name] > 0) {
      this.buffer[name] -= 1
    }
  }

  private consume(name: keyof InputManager['buffer']): boolean {
    if (this.buffer[name] > 0) {
      this.buffer[name] = 0
      return true
    }
    return false
  }
}

export function nextPhysicalCode(): Promise<string> {
  return new Promise((resolve) => {
    const onKey = (event: KeyboardEvent) => {
      event.preventDefault()
      window.removeEventListener('keydown', onKey, true)
      resolve(event.code)
    }
    window.addEventListener('keydown', onKey, true)
  })
}
