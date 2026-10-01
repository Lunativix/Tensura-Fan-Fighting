import type { FighterIdValue } from '../../types/game.ts'

export type MotionWeight = 'light' | 'medium' | 'heavy'

/** Per-fighter motion — not new abilities. Afterimages only where the work justifies them. */
export interface MotionProfile {
  weight: MotionWeight
  /** Dash / teleport ghosts. Souei, Rimuru, Diablo, Hinata, Milim. */
  afterimage: boolean
  dashGhosts: number
  idleBreath: number
  idleCycleMs: number
  smear: number
  landingDust: boolean
  /** Magic circle on skill startup (mages / holy). */
  magicCircle: boolean
  /** Sword arc trail on active frames. */
  bladeTrail: boolean
}

const PROFILE: Record<FighterIdValue, MotionProfile> = {
  rimuru: { weight: 'light', afterimage: true, dashGhosts: 3, idleBreath: 2.2, idleCycleMs: 4200, smear: 1.08, landingDust: false, magicCircle: true, bladeTrail: false },
  milim: { weight: 'medium', afterimage: true, dashGhosts: 2, idleBreath: 3.4, idleCycleMs: 2800, smear: 1.14, landingDust: true, magicCircle: false, bladeTrail: false },
  diablo: { weight: 'medium', afterimage: true, dashGhosts: 3, idleBreath: 1.4, idleCycleMs: 5200, smear: 1.1, landingDust: false, magicCircle: true, bladeTrail: false },
  benimaru: { weight: 'medium', afterimage: false, dashGhosts: 1, idleBreath: 2.0, idleCycleMs: 3600, smear: 1.12, landingDust: true, magicCircle: false, bladeTrail: true },
  shion: { weight: 'heavy', afterimage: false, dashGhosts: 0, idleBreath: 2.8, idleCycleMs: 3400, smear: 1.06, landingDust: true, magicCircle: false, bladeTrail: false },
  veldora: { weight: 'heavy', afterimage: false, dashGhosts: 1, idleBreath: 4.2, idleCycleMs: 2600, smear: 1.16, landingDust: true, magicCircle: false, bladeTrail: false },
  hinata: { weight: 'light', afterimage: true, dashGhosts: 3, idleBreath: 1.6, idleCycleMs: 4000, smear: 1.2, landingDust: false, magicCircle: true, bladeTrail: true },
  guy: { weight: 'heavy', afterimage: false, dashGhosts: 1, idleBreath: 1.8, idleCycleMs: 4800, smear: 1.08, landingDust: true, magicCircle: true, bladeTrail: true },
  shuna: { weight: 'light', afterimage: false, dashGhosts: 1, idleBreath: 2.4, idleCycleMs: 3800, smear: 1.04, landingDust: false, magicCircle: true, bladeTrail: false },
  souei: { weight: 'light', afterimage: true, dashGhosts: 4, idleBreath: 1.2, idleCycleMs: 5600, smear: 1.22, landingDust: false, magicCircle: false, bladeTrail: false },
  hakurou: { weight: 'medium', afterimage: false, dashGhosts: 2, idleBreath: 1.5, idleCycleMs: 4400, smear: 1.18, landingDust: false, magicCircle: false, bladeTrail: true },
}

export function motionOf(id: FighterIdValue): MotionProfile {
  return PROFILE[id]
}

export function idleVariant(timeMs: number, cycleMs: number): 0 | 1 | 2 {
  return (Math.floor(timeMs / Math.max(800, cycleMs)) % 3) as 0 | 1 | 2
}

export const ANIM_PRIORITY: Record<string, number> = {
  FINISHER: 100,
  ULTIMATE: 90,
  TRANSFORM: 80,
  SKILL: 70,
  ATTACK: 60,
  HIT: 55,
  DASH: 40,
  JUMP: 30,
  MOVE: 20,
  IDLE: 10,
}
