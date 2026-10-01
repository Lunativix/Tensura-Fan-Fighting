import { AttackKind, type AttackData } from '../Attack.ts'
import type { SkillTiming } from './types.ts'

export function timingFromAttack(attack: AttackData, overlay?: Partial<SkillTiming>): SkillTiming {
  const release = overlay?.releaseFrame ?? attack.startup
  const activeLen = attack.active
  const recoveryLen = attack.recovery
  const activeStart = overlay?.activeStart ?? release
  const activeEnd = overlay?.activeEnd ?? Math.max(activeStart, activeStart + activeLen - 1)
  const recoveryStart = overlay?.recoveryStart ?? activeStart + activeLen
  const recoveryEnd = overlay?.recoveryEnd ?? Math.max(recoveryStart, recoveryStart + recoveryLen - 1)
  const startupStart = overlay?.startupStart ?? 0
  const startupEnd = overlay?.startupEnd ?? Math.max(startupStart, release - 1)
  return {
    startupStart,
    startupEnd,
    releaseFrame: release,
    activeStart,
    activeEnd,
    impactFrame: overlay?.impactFrame ?? release,
    recoveryStart,
    recoveryEnd,
    confirmationFrame: overlay?.confirmationFrame ?? (attack.kind === AttackKind.ULTIMATE ? release : undefined),
  }
}

export function durationFromTiming(timing: SkillTiming): number {
  return Math.max(timing.recoveryEnd + 1, timing.releaseFrame + 1)
}
