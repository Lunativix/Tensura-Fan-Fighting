import { ActionId, type ActionIdValue } from './Actions.ts'
import { cloneBindings, KeyboardPreset, presetBindings, type KeyboardBindings, type KeyboardPresetId } from './bindings.ts'

export interface InputSaveSlice {
  preset: KeyboardPresetId
  keyboard: KeyboardBindings
  padIndex: number
}

let preset: KeyboardPresetId = KeyboardPreset.CLASSIC
let keyboard = cloneBindings(presetBindings(KeyboardPreset.CLASSIC))
let padIndex = 0
let p1UsesPad = false

export function getKeyboardBindings(): KeyboardBindings {
  return keyboard
}

export function getPreset(): KeyboardPresetId {
  return preset
}

export function getPadIndex(): number {
  return padIndex
}

export function setPadIndex(index: number): void {
  padIndex = Math.max(0, index)
}

export function setP1UsesPad(value: boolean): void {
  p1UsesPad = value
}

export function playerUsesPad(): boolean {
  return p1UsesPad
}

export function applyPreset(id: Exclude<KeyboardPresetId, 'CUSTOM'>): void {
  preset = id
  keyboard = cloneBindings(presetBindings(id))
}

export function setKeyboardBinding(action: ActionIdValue, code: string, replaceConflict: boolean): ActionIdValue | null {
  const keys = Object.keys(keyboard) as ActionIdValue[]
  let conflict: ActionIdValue | null = null
  for (const other of keys) {
    if (other !== action && keyboard[other] === code) {
      conflict = other
      break
    }
  }
  if (conflict && !replaceConflict) {
    return conflict
  }
  if (conflict) {
    keyboard[conflict] = keyboard[action]
  }
  keyboard[action] = code
  preset = KeyboardPreset.CUSTOM
  return conflict
}

export function snapshotInputSave(): InputSaveSlice {
  return { preset, keyboard: cloneBindings(keyboard), padIndex }
}

export function restoreInputSave(slice: InputSaveSlice | undefined): void {
  if (!slice) {
    applyPreset(KeyboardPreset.CLASSIC)
    padIndex = 0
    return
  }
  keyboard = { ...presetBindings(KeyboardPreset.CLASSIC), ...slice.keyboard }
  preset = slice.preset
  padIndex = slice.padIndex ?? 0
}

export const BINDING_LABELS: Record<ActionIdValue, string> = {
  [ActionId.LEFT]: 'Move Left',
  [ActionId.RIGHT]: 'Move Right',
  [ActionId.DOWN]: 'Crouch / Down',
  [ActionId.JUMP]: 'Jump',
  [ActionId.GUARD]: 'Block',
  [ActionId.LIGHT]: 'Light Attack',
  [ActionId.MEDIUM]: 'Medium Attack',
  [ActionId.HEAVY]: 'Heavy Attack',
  [ActionId.DASH]: 'Dash',
  [ActionId.SKILL_1]: 'Skill 1',
  [ActionId.SKILL_2]: 'Skill 2',
  [ActionId.SKILL_3]: 'Skill 3',
  [ActionId.SKILL_4]: 'Skill 4',
  [ActionId.ULTIMATE]: 'Ultimate',
  [ActionId.RESTART]: 'Restart',
  [ActionId.PAUSE]: 'Pause',
}
