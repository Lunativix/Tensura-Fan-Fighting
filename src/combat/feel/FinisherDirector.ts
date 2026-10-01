import type { FighterIdValue } from '../../types/game.ts'
import { AttackKind } from '../Attack.ts'

export interface FinisherHit {
  kind: string
  power: number
  killing: boolean
  attackerId: string
}

/** Ultimate (or killing blow from ult) on a wounded foe. No invented techniques. */
export function isFinisherHit(hit: FinisherHit, defenderHpRatio: number): boolean {
  if (hit.kind !== AttackKind.ULTIMATE && !hit.killing) {
    return false
  }
  if (hit.kind !== AttackKind.ULTIMATE) {
    return false
  }
  return hit.killing || defenderHpRatio <= 0.18
}

/**
 * Contextual signature from established story pairs only.
 * Rimuru–Veldora (cave), Rimuru–Hinata (holy war), Rimuru–Diablo (naming), Hakurou iai.
 */
export function finisherTheme(attacker: FighterIdValue, defender: FighterIdValue): string {
  if (attacker === 'hakurou') {
    return 'moon-fang'
  }
  if (attacker === 'rimuru' && defender === 'veldora') {
    return 'beelzebuth-storm'
  }
  if (attacker === 'rimuru' && defender === 'hinata') {
    return 'chrono'
  }
  if (attacker === 'rimuru' && defender === 'diablo') {
    return 'tempter-bow'
  }
  if (attacker === 'hinata') {
    return 'chrono'
  }
  if (attacker === 'diablo') {
    return 'azazel'
  }
  if (attacker === 'milim') {
    return 'drago-buster'
  }
  if (attacker === 'veldora') {
    return 'storm-dragon'
  }
  return 'signature'
}
