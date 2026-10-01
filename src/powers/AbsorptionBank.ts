import type { AttackData } from '../combat/Attack.ts'

export class AbsorptionBank {
  stored: AttackData | null = null
  analyzed = 0

  absorb(attack: AttackData): void {
    this.stored = { ...attack, id: `absorbed-${attack.id}`, energyCost: Math.max(8, Math.floor(attack.energyCost * 0.7)) }
    this.analyzed += 1
  }
}
