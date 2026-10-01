import { FighterState, type FighterStateId } from '../FighterState.ts'
import { STATE_TO_CLIP } from '../../sprites/SpriteManifest.ts'
import { ANIM_PRIORITY } from './MotionProfile.ts'

export type AnimLayer =
  | 'FINISHER'
  | 'ULTIMATE'
  | 'TRANSFORM'
  | 'SKILL'
  | 'ATTACK'
  | 'HIT'
  | 'DASH'
  | 'JUMP'
  | 'MOVE'
  | 'IDLE'

const STATE_LAYER: Record<FighterStateId, AnimLayer> = {
  [FighterState.DEAD]: 'FINISHER',
  [FighterState.ULTIMATE]: 'ULTIMATE',
  [FighterState.TRANSFORM]: 'TRANSFORM',
  [FighterState.SKILL]: 'SKILL',
  [FighterState.ATTACK]: 'ATTACK',
  [FighterState.HIT]: 'HIT',
  [FighterState.STUN]: 'HIT',
  [FighterState.KNOCKDOWN]: 'HIT',
  [FighterState.GETUP]: 'HIT',
  [FighterState.DASH]: 'DASH',
  [FighterState.JUMP]: 'JUMP',
  [FighterState.FALL]: 'JUMP',
  [FighterState.WALK]: 'MOVE',
  [FighterState.RUN]: 'MOVE',
  [FighterState.BLOCK]: 'MOVE',
  [FighterState.IDLE]: 'IDLE',
}

export function clipForState(state: FighterStateId): string {
  return STATE_TO_CLIP[state]
}

export function animLayer(state: FighterStateId): AnimLayer {
  return STATE_LAYER[state]
}

export function animPriority(state: FighterStateId): number {
  return ANIM_PRIORITY[animLayer(state)] ?? 0
}

/** Higher or equal layer may interrupt. Combat still owns cancel windows. */
export function canInterrupt(current: FighterStateId, incoming: FighterStateId): boolean {
  return animPriority(incoming) >= animPriority(current)
}
