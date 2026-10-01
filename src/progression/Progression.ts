import { grantMatchRewards } from './RewardService.ts'
import { session } from '../game/GameState.ts'

export interface ProgressData {
  xp: number
  level: number
  coins: number
  wins: number
  losses: number
  titles: string[]
  ownedItems: string[]
  equippedTitle: string
  lastWinDay: string
}

export function defaultProgress(): ProgressData {
  return {
    xp: 0,
    level: 1,
    coins: 0,
    wins: 0,
    losses: 0,
    titles: [],
    ownedItems: [],
    equippedTitle: '',
    lastWinDay: '',
  }
}

export function addFightResult(progress: ProgressData, won: boolean): ProgressData {
  const xpGain = won ? 80 : 30
  let xp = progress.xp + xpGain
  let level = progress.level
  while (xp >= level * 100) {
    xp -= level * 100
    level += 1
  }
  return grantMatchRewards({
    ...progress,
    xp,
    level,
    wins: progress.wins + (won ? 1 : 0),
    losses: progress.losses + (won ? 0 : 1),
  }, won, session.ranked)
}

/** Shop must use purchaseOffer + ledger. Direct coin debit is forbidden. */
export function buyItem(_progress: ProgressData, _id: string, _cost: number): ProgressData | null {
  return null
}
