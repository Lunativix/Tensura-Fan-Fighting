import { type ActionIdValue } from './Actions.ts'

export type KeyboardBindings = Record<ActionIdValue, string>

export const KeyboardPreset = {
  DEFAULT: 'DEFAULT',
  CLASSIC: 'CLASSIC',
  MODERN: 'MODERN',
  CUSTOM: 'CUSTOM',
} as const

export type KeyboardPresetId = (typeof KeyboardPreset)[keyof typeof KeyboardPreset]

/** Physical WASD (ZQSD on AZERTY). V1 layout: J/K/L + Space ult. */
export const PRESET_CLASSIC: KeyboardBindings = {
  LEFT: 'KeyA',
  RIGHT: 'KeyD',
  DOWN: 'KeyS',
  JUMP: 'KeyW',
  GUARD: 'KeyS',
  LIGHT: 'KeyJ',
  MEDIUM: 'KeyH',
  HEAVY: 'KeyK',
  DASH: 'KeyL',
  SKILL_1: 'KeyU',
  SKILL_2: 'KeyI',
  SKILL_3: 'KeyO',
  SKILL_4: 'KeyP',
  ULTIMATE: 'Space',
  RESTART: 'KeyR',
  PAUSE: 'Escape',
}

export const PRESET_DEFAULT: KeyboardBindings = {
  LEFT: 'KeyA',
  RIGHT: 'KeyD',
  DOWN: 'KeyS',
  JUMP: 'KeyW',
  GUARD: 'ShiftLeft',
  LIGHT: 'KeyJ',
  MEDIUM: 'KeyK',
  HEAVY: 'KeyL',
  DASH: 'Space',
  SKILL_1: 'KeyU',
  SKILL_2: 'KeyI',
  SKILL_3: 'KeyO',
  SKILL_4: 'KeyP',
  ULTIMATE: 'KeyH',
  RESTART: 'KeyR',
  PAUSE: 'Escape',
}

export const PRESET_PLAYER2: KeyboardBindings = {
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
  DOWN: 'ArrowDown',
  JUMP: 'ArrowUp',
  GUARD: 'ArrowDown',
  LIGHT: 'Numpad1',
  MEDIUM: 'Numpad2',
  HEAVY: 'Numpad3',
  DASH: 'Numpad0',
  SKILL_1: 'Numpad4',
  SKILL_2: 'Numpad5',
  SKILL_3: 'Numpad6',
  SKILL_4: 'Numpad7',
  ULTIMATE: 'NumpadEnter',
  RESTART: 'KeyR',
  PAUSE: 'Escape',
}

export const PRESET_MODERN: KeyboardBindings = {
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
  DOWN: 'ArrowDown',
  JUMP: 'ArrowUp',
  GUARD: 'ShiftLeft',
  LIGHT: 'KeyJ',
  MEDIUM: 'KeyK',
  HEAVY: 'KeyL',
  DASH: 'Space',
  SKILL_1: 'Digit1',
  SKILL_2: 'Digit2',
  SKILL_3: 'Digit3',
  SKILL_4: 'Digit4',
  ULTIMATE: 'KeyH',
  RESTART: 'KeyR',
  PAUSE: 'Escape',
}

const PRESETS: Record<'DEFAULT' | 'CLASSIC' | 'MODERN', KeyboardBindings> = {
  DEFAULT: PRESET_DEFAULT,
  CLASSIC: PRESET_CLASSIC,
  MODERN: PRESET_MODERN,
}

export function cloneBindings(source: KeyboardBindings): KeyboardBindings {
  return { ...source }
}

export function presetBindings(id: KeyboardPresetId): KeyboardBindings {
  if (id === KeyboardPreset.CUSTOM) {
    return cloneBindings(PRESET_CLASSIC)
  }
  return cloneBindings(PRESETS[id])
}

export function findConflict(bindings: KeyboardBindings, action: ActionIdValue, code: string): ActionIdValue | null {
  const keys = Object.keys(bindings) as ActionIdValue[]
  for (const other of keys) {
    if (other !== action && bindings[other] === code) {
      return other
    }
  }
  return null
}

export function prettyCode(code: string): string {
  return code.replace(/^Key/, '').replace(/^Digit/, '').replace('ShiftLeft', 'LSHIFT').replace('Space', 'SPACE').replace('Arrow', '')
}
