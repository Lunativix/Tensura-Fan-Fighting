import { AttackKind, type AttackData } from '../Attack.ts'
import type { MotionProfile } from './MotionProfile.ts'

/** Map canon kits onto existing VFX ids. Never invent a technique. */
export function attackVfxId(attack: AttackData, motion: MotionProfile): string | null {
  if (attack.vfx) {
    return attack.vfx
  }
  switch (attack.kind) {
    case AttackKind.ULTIMATE:
      return 'impact_ultimate'
    case AttackKind.BEAM:
      return 'energy_beam'
    case AttackKind.PROJECTILE:
      return 'energy_beam'
    case AttackKind.AREA:
      return 'magic_explosion'
    case AttackKind.TRANSFORMATION:
      return 'energy_burst'
    case AttackKind.BUFF:
      return 'aura'
    case AttackKind.DEFENSIVE:
      return 'flash'
    case AttackKind.MOBILITY:
      return 'dash'
    default:
      if (motion.magicCircle && attack.energyCost >= 12) {
        return 'magic_circle'
      }
      if (motion.bladeTrail && attack.energyCost > 0) {
        return 'trail'
      }
      return null
  }
}
