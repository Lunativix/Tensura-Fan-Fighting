export const AiDifficulty = {
  EASY: 'EASY',
  NORMAL: 'NORMAL',
  HARD: 'HARD',
  EXPERT: 'EXPERT',
} as const

export type AiDifficultyId = (typeof AiDifficulty)[keyof typeof AiDifficulty]

export interface AiProfile {
  reaction: number
  aggression: number
  defense: number
  skillRate: number
  mistake: number
}

export function profileFor(level: AiDifficultyId): AiProfile {
  if (level === AiDifficulty.EASY) {
    return { reaction: 420, aggression: 0.28, defense: 0.12, skillRate: 0.12, mistake: 0.35 }
  }
  if (level === AiDifficulty.HARD) {
    return { reaction: 140, aggression: 0.62, defense: 0.38, skillRate: 0.38, mistake: 0.08 }
  }
  if (level === AiDifficulty.EXPERT) {
    return { reaction: 80, aggression: 0.78, defense: 0.5, skillRate: 0.5, mistake: 0.03 }
  }
  return { reaction: 240, aggression: 0.45, defense: 0.25, skillRate: 0.25, mistake: 0.18 }
}
