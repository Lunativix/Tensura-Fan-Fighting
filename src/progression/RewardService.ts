import type { ProgressData } from './Progression.ts'
import { matchEventCreditBonus } from '../live/events.ts'

export function matchCreditPayout(
  won: boolean,
  ranked: boolean,
  lastWinDay: string,
  now = Date.now(),
): { credits: number, lastWinDay: string } {
  const base = won ? 50 : 15
  const rankedBonus = ranked ? 20 : 0
  const eventBonus = matchEventCreditBonus(now)
  const today = new Date(now).toISOString().slice(0, 10)
  const firstWin = won && lastWinDay !== today ? 40 : 0
  return {
    credits: base + rankedBonus + eventBonus + firstWin,
    lastWinDay: won ? today : lastWinDay,
  }
}

export function grantMatchRewards(progress: ProgressData, won: boolean, ranked = false): ProgressData {
  const payout = matchCreditPayout(won, ranked, progress.lastWinDay)
  return {
    ...progress,
    coins: progress.coins + payout.credits,
    lastWinDay: payout.lastWinDay,
  }
}
