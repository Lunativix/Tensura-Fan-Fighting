export const Element = {
  PHYSICAL: 'PHYSICAL',
  FIRE: 'FIRE',
  WATER: 'WATER',
  WIND: 'WIND',
  EARTH: 'EARTH',
  LIGHTNING: 'LIGHTNING',
  LIGHT: 'LIGHT',
  DARK: 'DARK',
  MAGIC: 'MAGIC',
  SPIRITUAL: 'SPIRITUAL',
  UNIQUE: 'UNIQUE',
} as const

export type ElementId = (typeof Element)[keyof typeof Element]

export const SkillTier = {
  EXTRA: 'EXTRA',
  UNIQUE: 'UNIQUE',
  ULTIMATE: 'ULTIMATE',
} as const

export type SkillTierId = (typeof SkillTier)[keyof typeof SkillTier]

export function resistMultiplier(resist: number | undefined): number {
  if (resist === undefined) {
    return 1
  }
  if (resist >= 1) {
    return 0
  }
  return Math.max(0, 1 - resist)
}
