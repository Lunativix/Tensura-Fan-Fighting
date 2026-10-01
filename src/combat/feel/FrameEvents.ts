import type { AttackInstance } from '../Attack.ts'

export type AttackPhase = 'startup' | 'active' | 'recovery'

export function attackPhase(attack: AttackInstance): AttackPhase {
  const { startup, active } = attack.data
  if (attack.frame < startup) {
    return 'startup'
  }
  if (attack.frame < startup + active) {
    return 'active'
  }
  return 'recovery'
}

export function enteredPhase(prevFrame: number, attack: AttackInstance, phase: AttackPhase): boolean {
  const now = attackPhase(attack)
  if (now !== phase) {
    return false
  }
  if (prevFrame < 0) {
    return phase === 'startup'
  }
  const ghost = { data: attack.data, frame: prevFrame, connected: attack.connected }
  return attackPhase(ghost) !== phase
}
