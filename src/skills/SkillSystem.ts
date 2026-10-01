import { CooldownSystem } from '../combat/CooldownSystem.ts'
import type { AttackData } from '../combat/Attack.ts'

export interface SkillRuntime {
  id: string
  remainingCooldown: number
}

export class SkillSystem {
  readonly cooldowns = new CooldownSystem()

  tryUse(id: string, cooldownMs: number, energy: number, cost: number): boolean {
    if (!this.cooldowns.ready(id) || energy < cost) {
      return false
    }
    this.cooldowns.start(id, cooldownMs)
    return true
  }

  update(deltaMs: number): void {
    this.cooldowns.update(deltaMs)
  }

  describe(attack: AttackData): string {
    return `${attack.name} (${attack.kind}) ${attack.damage}`
  }
}
