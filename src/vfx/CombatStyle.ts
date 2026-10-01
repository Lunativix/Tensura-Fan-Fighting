import { CHARACTERS } from '../config/characters.ts'
import type { FighterIdValue } from '../types/game.ts'

export type EnergyType = 'magic' | 'fire' | 'dark' | 'holy' | 'wind' | 'water' | 'physical' | 'storm'
export type TrailType = 'arc' | 'straight' | 'spark' | 'ribbon'
export type ImpactFamily = 'blunt' | 'slash' | 'blast' | 'pierce'
export type AuraFamily = 'slime' | 'dragon' | 'demon' | 'holy' | 'ogre' | 'storm' | 'spirit' | 'blade'

export interface CombatStyle {
  energyType: EnergyType
  trailType: TrailType
  impactType: ImpactFamily
  auraType: AuraFamily
  color: number
  accent: number
  glow: number
}

const STYLE: Record<FighterIdValue, Omit<CombatStyle, 'color' | 'accent'>> = {
  rimuru: { energyType: 'water', trailType: 'ribbon', impactType: 'blast', auraType: 'slime', glow: 0x80d8ff },
  milim: { energyType: 'fire', trailType: 'spark', impactType: 'blunt', auraType: 'dragon', glow: 0xff8ab3 },
  diablo: { energyType: 'dark', trailType: 'arc', impactType: 'blast', auraType: 'demon', glow: 0xb388ff },
  benimaru: { energyType: 'fire', trailType: 'straight', impactType: 'slash', auraType: 'ogre', glow: 0xff7043 },
  shion: { energyType: 'physical', trailType: 'spark', impactType: 'blunt', auraType: 'ogre', glow: 0xce93d8 },
  veldora: { energyType: 'storm', trailType: 'ribbon', impactType: 'blast', auraType: 'storm', glow: 0x4dd0e1 },
  hinata: { energyType: 'holy', trailType: 'straight', impactType: 'slash', auraType: 'holy', glow: 0xfff59d },
  guy: { energyType: 'dark', trailType: 'arc', impactType: 'blunt', auraType: 'demon', glow: 0xef9a9a },
  shuna: { energyType: 'magic', trailType: 'ribbon', impactType: 'blast', auraType: 'spirit', glow: 0xf8bbd0 },
  souei: { energyType: 'dark', trailType: 'spark', impactType: 'pierce', auraType: 'spirit', glow: 0x90a4ae },
  hakurou: { energyType: 'physical', trailType: 'straight', impactType: 'slash', auraType: 'blade', glow: 0xeceff1 },
}

export function styleFor(id: FighterIdValue): CombatStyle {
  const base = STYLE[id]
  const def = CHARACTERS[id]
  return {
    energyType: base.energyType,
    trailType: base.trailType,
    impactType: base.impactType,
    auraType: base.auraType,
    glow: base.glow,
    color: def.color,
    accent: def.accent,
  }
}
