import type { FighterIdValue } from '../../types/game.ts'
import { idleVariant, motionOf } from './MotionProfile.ts'

function hashId(value: string): number {
  let n = 0
  for (let i = 0; i < value.length; i += 1) {
    n = (n * 33 + value.charCodeAt(i)) >>> 0
  }
  return n
}

/** Situation-aware picks. Never randomise into an incoherent clip. */
export const AnimationVariationManager = {
  idle(id: FighterIdValue, timeMs: number): 0 | 1 | 2 {
    return idleVariant(timeMs, motionOf(id).idleCycleMs)
  },

  /** Stable per matchup — not a new pose every frame. */
  victory(winner: FighterIdValue, loser?: FighterIdValue): 0 | 1 | 2 {
    return (hashId(`${winner}:${loser ?? ''}`) % 3) as 0 | 1 | 2
  },

  intro(_a: FighterIdValue, _b: FighterIdValue, interactionId: string | null): string {
    return interactionId ?? 'battle_intro'
  },
}
