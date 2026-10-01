import { Currency } from '../account/types.ts'
import { Rarity } from './rarity.ts'
import type { BannerDef, RateTable } from './types.ts'

function rates(table: RateTable): RateTable {
  const sum = table.common + table.rare + table.epic + table.legendary + table.mythic
  if (Math.abs(sum - 100) > 0.001) {
    throw new Error(`banner rates must sum to 100, got ${sum}`)
  }
  return table
}

export const BANNERS: readonly BannerDef[] = [
  {
    id: 'chest-tempest',
    title: 'Coffre de Tempest',
    description: 'Coffre mystère de la Fédération. Les taux ci-dessous sont ceux du tirage réel.',
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2027-01-01T00:00:00.000Z',
    featuredItemIds: ['skin-rimuru-gold', 'card-veldora'],
    pool: [
      'emote-gobta-pose',
      'palette-night',
      'title-tempest',
      'vfx-water-trail',
      'music-tempest-dawn',
      'anim-victory-shion',
      'skin-rimuru-gold',
      'skin-milim-star',
      'card-veldora',
      'card-diablo',
    ],
    rates: rates({
      common: 55,
      rare: 30,
      epic: 12,
      legendary: 2.8,
      mythic: 0.2,
    }),
    pity: { legendaryEvery: 50, mythicEvery: 200 },
    currency: Currency.TICKETS,
    costX1: 1,
    costX10: 10,
  },
  {
    id: 'chest-walpurgis',
    title: 'Coffre de Walpurgis',
    description: 'Bannière d’événement. Même moteur, autre pool.',
    startDate: '2026-08-25T00:00:00.000Z',
    endDate: '2026-09-08T00:00:00.000Z',
    featuredItemIds: ['music-walpurgis-gate', 'card-diablo'],
    pool: [
      'music-walpurgis-gate',
      'card-diablo',
      'card-veldora',
      'skin-milim-star',
      'emote-gobta-pose',
    ],
    rates: rates({
      common: 48,
      rare: 32,
      epic: 15,
      legendary: 4.5,
      mythic: 0.5,
    }),
    pity: { legendaryEvery: 40, mythicEvery: 120 },
    currency: Currency.TICKETS,
    costX1: 1,
    costX10: 10,
    eventId: 'premier-walpurgis',
  },
]

const BANNER_MAP = new Map(BANNERS.map((banner) => [banner.id, banner]))

export function bannerById(id: string): BannerDef | undefined {
  return BANNER_MAP.get(id)
}

export function rateLines(table: RateTable): { rarity: typeof Rarity[keyof typeof Rarity], pct: number }[] {
  return [
    { rarity: Rarity.MYTHIC, pct: table.mythic },
    { rarity: Rarity.LEGENDARY, pct: table.legendary },
    { rarity: Rarity.EPIC, pct: table.epic },
    { rarity: Rarity.RARE, pct: table.rare },
    { rarity: Rarity.COMMON, pct: table.common },
  ]
}
