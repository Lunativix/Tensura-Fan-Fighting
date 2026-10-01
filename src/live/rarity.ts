export const Rarity = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
  MYTHIC: 'mythic',
} as const

export type RarityId = (typeof Rarity)[keyof typeof Rarity]

export interface RarityDef {
  id: RarityId
  label: string
  rank: number
  color: string
  glow: number
  particleCount: number
  revealMs: number
  sfx: string
}

/** Single source of truth. Never hardcode rarity colors/timings in scenes. */
export const RARITIES: Record<RarityId, RarityDef> = {
  common: {
    id: Rarity.COMMON,
    label: 'Commun',
    rank: 1,
    color: '#b0bec5',
    glow: 0x90a4ae,
    particleCount: 6,
    revealMs: 280,
    sfx: 'notify',
  },
  rare: {
    id: Rarity.RARE,
    label: 'Rare',
    rank: 2,
    color: '#64b5f6',
    glow: 0x42a5f5,
    particleCount: 14,
    revealMs: 520,
    sfx: 'unlock',
  },
  epic: {
    id: Rarity.EPIC,
    label: 'Épique',
    rank: 3,
    color: '#ce93d8',
    glow: 0xab47bc,
    particleCount: 28,
    revealMs: 820,
    sfx: 'rare',
  },
  legendary: {
    id: Rarity.LEGENDARY,
    label: 'Légendaire',
    rank: 4,
    color: '#ffd54f',
    glow: 0xffc107,
    particleCount: 48,
    revealMs: 1400,
    sfx: 'legendary',
  },
  mythic: {
    id: Rarity.MYTHIC,
    label: 'Mythique',
    rank: 5,
    color: '#ff8a80',
    glow: 0xff5252,
    particleCount: 72,
    revealMs: 2200,
    sfx: 'mythic',
  },
}

export const RARITY_ORDER: RarityId[] = [
  Rarity.COMMON,
  Rarity.RARE,
  Rarity.EPIC,
  Rarity.LEGENDARY,
  Rarity.MYTHIC,
]

export function rarityOf(id: string): RarityDef {
  return RARITIES[id as RarityId] ?? RARITIES.common
}

export function rarityAtLeast(actual: RarityId, needed: RarityId): boolean {
  return RARITIES[actual].rank >= RARITIES[needed].rank
}
