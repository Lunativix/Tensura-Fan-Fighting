export const ActionId = {
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  DOWN: 'DOWN',
  JUMP: 'JUMP',
  GUARD: 'GUARD',
  LIGHT: 'LIGHT',
  MEDIUM: 'MEDIUM',
  HEAVY: 'HEAVY',
  DASH: 'DASH',
  SKILL_1: 'SKILL_1',
  SKILL_2: 'SKILL_2',
  SKILL_3: 'SKILL_3',
  SKILL_4: 'SKILL_4',
  ULTIMATE: 'ULTIMATE',
  RESTART: 'RESTART',
  PAUSE: 'PAUSE',
} as const

export type ActionIdValue = (typeof ActionId)[keyof typeof ActionId]

export interface FighterActions {
  left: boolean
  right: boolean
  down: boolean
  jump: boolean
  guard: boolean
  light: boolean
  medium: boolean
  heavy: boolean
  dash: boolean
  skill1: boolean
  skill2: boolean
  skill3: boolean
  skill4: boolean
  ultimate: boolean
}

export function emptyActions(): FighterActions {
  return {
    left: false,
    right: false,
    down: false,
    jump: false,
    guard: false,
    light: false,
    medium: false,
    heavy: false,
    dash: false,
    skill1: false,
    skill2: false,
    skill3: false,
    skill4: false,
    ultimate: false,
  }
}

export const BINDABLE_ACTIONS = [
  ActionId.LEFT,
  ActionId.RIGHT,
  ActionId.DOWN,
  ActionId.JUMP,
  ActionId.GUARD,
  ActionId.LIGHT,
  ActionId.MEDIUM,
  ActionId.HEAVY,
  ActionId.DASH,
  ActionId.SKILL_1,
  ActionId.SKILL_2,
  ActionId.SKILL_3,
  ActionId.SKILL_4,
  ActionId.ULTIMATE,
  ActionId.RESTART,
  ActionId.PAUSE,
] as const
