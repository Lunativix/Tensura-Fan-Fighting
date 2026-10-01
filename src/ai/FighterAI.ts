export const AiState = {
  IDLE: 'IDLE',
  APPROACH: 'APPROACH',
  ATTACK: 'ATTACK',
  DEFEND: 'DEFEND',
  RETREAT: 'RETREAT',
  USE_SKILL: 'USE_SKILL',
  CHASE: 'CHASE',
} as const

export type AiStateId = (typeof AiState)[keyof typeof AiState]
