import { AiState, type AiStateId } from './FighterAI.ts'
import { profileFor } from './AiDifficulty.ts'
import type { Fighter } from '../characters/Fighter.ts'
import { emptyActions, type FighterActions } from '../input/Actions.ts'
import { session } from '../game/GameState.ts'

export class FighterBrain {
  state: AiStateId = AiState.IDLE
  private cooldown = 0
  private readonly actions = emptyActions()

  think(self: Fighter, opponent: Fighter, deltaMs: number): FighterActions {
    const a = this.actions
    a.left = false
    a.right = false
    a.jump = false
    a.down = false
    a.guard = false
    a.light = false
    a.medium = false
    a.heavy = false
    a.dash = false
    a.skill1 = false
    a.skill2 = false
    a.skill3 = false
    a.skill4 = false
    a.ultimate = false

    this.cooldown -= deltaMs
    const profile = profileFor(session.aiDifficulty)
    const dist = opponent.x - self.x
    const abs = Math.abs(dist)
    const toward = dist > 0

    if (!self.alive) {
      this.state = AiState.IDLE
      return a
    }

    if (this.cooldown > 0) {
      return a
    }

    if (Math.random() < profile.mistake) {
      this.cooldown = profile.reaction
      return a
    }

    const roll = Math.random()
    if (self.ultimate >= 100 && abs < 380 && roll < profile.skillRate) {
      this.state = AiState.USE_SKILL
      a.ultimate = true
      this.cooldown = 400
      return a
    }

    if (opponent.attack && abs < 160 && roll < 0.4) {
      this.state = AiState.DEFEND
      if (roll < 0.18) {
        a.dash = true
      } else {
        a.guard = true
      }
      this.cooldown = 220
      return a
    }

    if (abs > 420) {
      this.state = roll < 0.55 ? AiState.CHASE : AiState.USE_SKILL
      if (this.state === AiState.CHASE) {
        a.left = !toward
        a.right = toward
        if (roll < 0.12) {
          a.jump = true
        }
      } else if (self.cooldowns.ready(self.kit.skills[1].id) && self.energy >= self.kit.skills[1].energyCost) {
        a.skill2 = true
      } else {
        a.left = !toward
        a.right = toward
      }
      this.cooldown = 180 + Math.random() * 160
      return a
    }

    if (abs > 180) {
      this.state = AiState.APPROACH
      a.left = !toward
      a.right = toward
      if (roll < 0.2 && self.energy >= self.kit.skills[0].energyCost) {
        a.skill1 = true
        this.state = AiState.ATTACK
      } else if (roll < 0.32) {
        a.heavy = true
      }
      this.cooldown = 140 + Math.random() * 120
      return a
    }

    this.state = roll < 0.12 ? AiState.RETREAT : AiState.ATTACK
    if (this.state === AiState.RETREAT) {
      a.left = toward
      a.right = !toward
      if (roll < 0.06) {
        a.dash = true
      }
      this.cooldown = 160
      return a
    }

    if (roll < 0.38) {
      a.light = true
    } else if (roll < 0.5) {
      a.medium = true
    } else if (roll < 0.62) {
      a.heavy = true
    } else if (roll < 0.74 && self.energy >= self.kit.skills[2].energyCost) {
      a.skill3 = true
    } else if (roll < 0.82 && self.energy >= self.kit.skills[0].energyCost) {
      a.skill1 = true
    } else if (self.hp < self.def.maxHp * 0.35) {
      a.guard = true
      this.state = AiState.DEFEND
    } else {
      a.left = !toward
      a.right = toward
    }
    this.cooldown = profile.reaction * (0.4 + Math.random() * 0.8)
    return a
  }
}
