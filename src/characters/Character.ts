import type { CharacterDefinition } from '../config/characters.ts'
import { FighterState, type FighterStateId } from '../combat/FighterState.ts'

export class Character {
  hp: number
  energy: number
  ultimate = 0
  state: FighterStateId = FighterState.IDLE
  facing = 1

  readonly def: CharacterDefinition

  constructor(def: CharacterDefinition) {
    this.def = def
    this.hp = def.maxHp
    this.energy = def.maxEnergy
  }

  get alive(): boolean {
    return this.hp > 0 && this.state !== FighterState.DEAD
  }

  reset(): void {
    this.hp = this.def.maxHp
    this.energy = this.def.maxEnergy
    this.ultimate = 0
    this.state = FighterState.IDLE
  }
}
