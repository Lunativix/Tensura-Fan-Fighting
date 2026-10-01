import { applyDamage } from '../gameplay/Resources.ts'
import type { AttackData } from './Attack.ts'
import { resistMultiplier } from './elements.ts'

export interface HitContext {
  guarding: boolean
  perfectGuard: boolean
  armor: boolean
  defense: number
  comboHits: number
  elementResist?: number
  attackMul?: number
}

export interface DamageResult {
  dealt: number
  hpAfter: number
  blocked: boolean
  perfect: boolean
  armored: boolean
}

export function comboScale(hits: number): number {
  return Math.max(0.25, 1 - Math.max(0, hits - 1) * 0.08)
}

export function computeHit(hp: number, attack: AttackData, ctx: HitContext): DamageResult {
  const blocked = ctx.guarding && !attack.unguardable
  const perfect = blocked && ctx.perfectGuard && !attack.unguardable
  if (perfect) {
    return { dealt: 0, hpAfter: hp, blocked: true, perfect: true, armored: false }
  }
  const scaled = attack.damage
    * comboScale(ctx.comboHits)
    * (1 / (1 + ctx.defense / 100))
    * resistMultiplier(ctx.elementResist)
    * (ctx.attackMul ?? 1)
  if (!Number.isFinite(scaled)) {
    return { dealt: 0, hpAfter: hp, blocked, perfect: false, armored: false }
  }
  const hpAfter = applyDamage(hp, scaled, blocked, 0.2)
  return {
    dealt: hp - hpAfter,
    hpAfter,
    blocked,
    perfect: false,
    armored: ctx.armor && !blocked,
  }
}
