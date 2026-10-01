import { AttackKind, type AttackInstance } from '../Attack.ts'
import type { SkillTiming } from '../anim/types.ts'
import { timingFromAttack } from '../anim/timing.ts'

export function confirmationFrameOf(attack: AttackInstance['data'], timing?: SkillTiming): number {
  return timing?.confirmationFrame ?? timingFromAttack(attack).confirmationFrame ?? attack.startup
}

/** True once the Ultimate has passed confirmation. Quasi-inevitable, still KO-able. */
export function ultimateIsConfirmed(attack: AttackInstance | null, timing?: SkillTiming): boolean {
  if (!attack || attack.data.kind !== AttackKind.ULTIMATE) {
    return false
  }
  return attack.frame + 0.001 >= confirmationFrameOf(attack.data, timing)
}
