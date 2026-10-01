import { AttackKind, type AttackData } from '../Attack.ts'

export function formatSkillTimeline(timing: {
  startupStart: number
  startupEnd: number
  releaseFrame: number
  activeStart: number
  activeEnd: number
  recoveryStart: number
  recoveryEnd: number
}, opts?: { projectile: boolean }): string {
  const end = Math.max(timing.recoveryEnd, timing.activeEnd, timing.releaseFrame)
  const marks: string[] = []
  for (let i = 0; i <= Math.min(end, 36); i += 1) {
    if (i === timing.releaseFrame) {
      marks.push(`${i}*`)
    } else {
      marks.push(String(i))
    }
  }
  const projectile = opts?.projectile ? `  PROJECTILE@${timing.releaseFrame}` : ''
  return [
    `STARTUP ${timing.startupStart}-${timing.startupEnd} | RELEASE ${timing.releaseFrame}${projectile} | ACTIVE ${timing.activeStart}-${timing.activeEnd} | RECOVERY ${timing.recoveryStart}-${timing.recoveryEnd}`,
    marks.join(' '),
  ].join('\n')
}

export function skillUsesProjectile(attack: AttackData): boolean {
  return attack.kind === AttackKind.PROJECTILE || attack.kind === AttackKind.BEAM
}
