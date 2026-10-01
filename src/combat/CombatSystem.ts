import type { Fighter } from '../characters/Fighter.ts'
import type { AttackData } from './Attack.ts'
import { AttackKind, type AttackKindId } from './Attack.ts'
import { ComboSystem } from './ComboSystem.ts'
import { computeHit } from './DamageSystem.ts'
import { hitboxOverlaps } from './Hitbox.ts'
import type { Projectile, ProjectilePool } from './Projectile.ts'

export { FighterState, type FighterStateId } from './FighterState.ts'

export interface CombatImpact {
  x: number
  y: number
  power: number
  flash: boolean
  perfect: boolean
  blocked: boolean
  facing: number
  attackerId: string
  attackId: string
  kind: AttackKindId
  slot: number | null
  airborne: boolean
  killing: boolean
  armored: boolean
  counter: boolean
  launcher: boolean
  knockdown: boolean
}

const EMPTY_IMPACT: CombatImpact = {
  x: 0,
  y: 0,
  power: 0,
  flash: false,
  perfect: false,
  blocked: false,
  facing: 1,
  attackerId: 'rimuru',
  attackId: '',
  kind: AttackKind.MELEE,
  slot: null,
  airborne: false,
  killing: false,
  armored: false,
  counter: false,
  launcher: false,
  knockdown: false,
}

export class CombatSystem {
  readonly combo = new ComboSystem()
  lastImpact: CombatImpact = { ...EMPTY_IMPACT }
  lastClash = 0

  update(a: Fighter, b: Fighter, projectiles: ProjectilePool): void {
    this.lastImpact = { ...EMPTY_IMPACT }
    this.lastClash = 0
    const boxA = a.currentHitbox()
    const boxB = b.currentHitbox()
    if (boxA && boxB && a.attack && b.attack && hitboxOverlaps(boxA, boxB)) {
      this.lastClash = Math.max(a.attack.data.damage, b.attack.data.damage)
      if (a.attack.data.kind === AttackKind.ULTIMATE || b.attack.data.kind === AttackKind.ULTIMATE) {
        this.lastClash += 200
      }
    }
    this.tryMelee(a, b)
    this.tryMelee(b, a)
    this.tryProjectileClash(projectiles)
    for (const shot of projectiles.active()) {
      const foe = shot.owner === b ? a : b
      shot.home(foe.x, shot.originY)
      this.tryProjectile(shot, a, b)
    }
  }

  private tryMelee(attacker: Fighter, defender: Fighter): void {
    const box = attacker.currentHitbox()
    if (!box || !attacker.attack || attacker.attack.connected) {
      return
    }
    if (defender.invuln > 0 || !defender.alive) {
      return
    }
    if (!hitboxOverlaps(box, defender.hurtbox())) {
      return
    }
    this.applyStrike(attacker, defender, attacker.attack.data, attacker.facing)
    attacker.attack.connected = true
  }

  private tryProjectileClash(pool: ProjectilePool): void {
    const shots = pool.active()
    for (let i = 0; i < shots.length; i += 1) {
      for (let j = i + 1; j < shots.length; j += 1) {
        const left = shots[i]
        const right = shots[j]
        if (!left || !right || !left.owner || !right.owner || left.owner === right.owner) {
          continue
        }
        if (!hitboxOverlaps(left.getHitbox(), right.getHitbox())) {
          continue
        }
        const power = Math.max(left.attack?.damage ?? 50, right.attack?.damage ?? 50)
        this.lastClash = Math.max(this.lastClash, power)
        if (!left.consumeHit()) {
          left.kill()
        }
        if (!right.consumeHit()) {
          right.kill()
        }
      }
    }
  }

  private tryProjectile(shot: Projectile, a: Fighter, b: Fighter): void {
    const attack = shot.attack
    const owner = shot.owner
    if (!attack || !owner) {
      return
    }
    const target = owner === a ? b : a
    if (!target.alive || target.invuln > 0) {
      return
    }
    if (!hitboxOverlaps(shot.getHitbox(), target.hurtbox())) {
      return
    }
    this.applyStrike(owner, target, attack, Math.sign(shot.vx) || shot.plan?.facing || owner.facing)
    if (!shot.consumeHit()) {
      shot.kill()
    }
  }

  private applyStrike(attacker: Fighter, defender: Fighter, attack: AttackData, facing: number): void {
    const result = computeHit(defender.hp, attack, {
      guarding: defender.guarding,
      perfectGuard: defender.perfectGuard,
      armor: defender.armored,
      defense: defender.def.defense * defender.statuses.defenseMul(),
      comboHits: this.combo.hits,
      elementResist: attack.element ? defender.def.resistances[attack.element] : undefined,
      attackMul: attacker.attackPower,
    })
    defender.hp = result.hpAfter
    defender.receiveHit(attack, facing, result.blocked, result.armored, result.perfect)
    if (attack.absorbOnHit && attacker.def.canAbsorb && defender.lastUsedAttack) {
      attacker.absorb.absorb(defender.lastUsedAttack)
    }
    if (attack.applyBuff === 'attack') {
      attacker.statuses.add({ id: 'buff-atk', remaining: 3000, attackMul: 1.2, defenseMul: 1, speedMul: 1 })
    }
    attacker.energy = Math.min(attacker.def.maxEnergy, attacker.energy + attack.energyGain)
    if (attack.grantEnergyOnHit) {
      attacker.energy = Math.min(attacker.def.maxEnergy, attacker.energy + attack.grantEnergyOnHit)
    }
    if (result.perfect) {
      this.lastImpact = this.packImpact(attacker, defender, attack, facing, 20, false, false, true, false)
      return
    }
    if (!result.blocked && !result.armored) {
      this.combo.registerHit()
      attacker.gainUltimate(6 + this.combo.hits * 0.4)
      defender.gainUltimate(3)
    } else {
      attacker.gainUltimate(2)
    }
    this.lastImpact = this.packImpact(
      attacker,
      defender,
      attack,
      facing,
      result.dealt,
      attack.kind === AttackKind.ULTIMATE || attack.damage >= 150,
      result.blocked,
      false,
      result.armored,
    )
  }

  private packImpact(
    attacker: Fighter,
    defender: Fighter,
    attack: AttackData,
    facing: number,
    power: number,
    flash: boolean,
    blocked: boolean,
    perfect: boolean,
    armored: boolean,
  ): CombatImpact {
    return {
      x: defender.x,
      y: defender.y,
      power,
      flash,
      perfect,
      blocked,
      facing,
      attackerId: attacker.def.id,
      attackId: attack.id,
      kind: attack.kind,
      slot: attacker.lastSkillSlot,
      airborne: !defender.grounded,
      killing: defender.hp <= 0,
      armored,
      counter: attack.kind === AttackKind.COUNTER,
      launcher: Boolean(attack.launcher),
      knockdown: Boolean(attack.knockdown),
    }
  }
}
