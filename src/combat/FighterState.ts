export const FighterState = {
  IDLE: 'IDLE',
  WALK: 'WALK',
  RUN: 'RUN',
  JUMP: 'JUMP',
  FALL: 'FALL',
  DASH: 'DASH',
  ATTACK: 'ATTACK',
  BLOCK: 'BLOCK',
  HIT: 'HIT',
  STUN: 'STUN',
  KNOCKDOWN: 'KNOCKDOWN',
  GETUP: 'GETUP',
  SKILL: 'SKILL',
  ULTIMATE: 'ULTIMATE',
  TRANSFORM: 'TRANSFORM',
  DEAD: 'DEAD',
} as const

export type FighterStateId = (typeof FighterState)[keyof typeof FighterState]
