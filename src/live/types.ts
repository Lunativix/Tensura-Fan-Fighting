import type { CurrencyId } from '../account/types.ts'
import type { FighterIdValue } from '../types/game.ts'
import type { RarityId } from './rarity.ts'

export const ItemKind = {
  CHARACTER: 'character',
  APPEARANCE: 'appearance',
  COSMETIC: 'cosmetic',
  EMOTE: 'emote',
  VFX: 'vfx',
  MUSIC: 'music',
  CARD: 'card',
  ANIMATION: 'animation',
} as const

export type ItemKindId = (typeof ItemKind)[keyof typeof ItemKind]

export const ShopCategory = {
  FEATURED: 'featured',
  CHARACTERS: 'characters',
  APPEARANCES: 'appearances',
  COSMETICS: 'cosmetics',
  PACKS: 'packs',
  EVENT: 'event',
  CURRENCY: 'currency',
  SUMMON: 'summon',
} as const

export type ShopCategoryId = (typeof ShopCategory)[keyof typeof ShopCategory]

export const AcquireSource = {
  SHOP: 'shop',
  SUMMON: 'summon',
  STORY: 'story',
  PACK: 'pack',
  DUPLICATE: 'duplicate',
  DEV: 'dev',
  REWARD: 'reward',
} as const

export type AcquireSourceId = (typeof AcquireSource)[keyof typeof AcquireSource]

export interface ItemDef {
  id: string
  name: string
  description: string
  kind: ItemKindId
  rarity: RarityId
  fighterId?: FighterIdValue
  faction?: string
  /** Versus tint only. Never a story body swap. */
  tint?: number
  musicTrackId?: string
  /** Hide name until story encounter. */
  spoiler?: boolean
  duplicateFragments: number
  fragmentTarget?: string
}

export interface ShopOffer {
  id: string
  label: string
  category: ShopCategoryId
  price: { currency: CurrencyId, amount: number }
  itemId?: string
  pack?: { itemId: string, qty: number }[]
  currencyGrant?: { currency: CurrencyId, amount: number }
  featured?: boolean
  once?: boolean
  eventId?: string
  rotation?: 'always' | 'daily' | 'weekly'
  availableFrom?: string
  availableUntil?: string
  /** Premium SKU for PaymentProvider. Not a client-set balance. */
  premiumSku?: string
}

export interface RateTable {
  common: number
  rare: number
  epic: number
  legendary: number
  mythic: number
}

export interface PityConfig {
  legendaryEvery: number
  mythicEvery: number
}

export interface BannerDef {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  featuredItemIds: string[]
  pool: string[]
  rates: RateTable
  pity: PityConfig
  currency: CurrencyId
  costX1: number
  costX10: number
  eventId?: string
}

export interface LiveEventDef {
  id: string
  title: string
  blurb: string
  startDate: string
  endDate: string
  bannerId?: string
  shopCategories: ShopCategoryId[]
  /** Combat credit bonus while this event is active. Same source as Events UI. */
  matchCreditBonus?: number
}

export interface PityState {
  pulls: number
  sinceLegendary: number
  sinceMythic: number
}

export interface InventoryRecord {
  itemId: string
  qty: number
  at: string
  source: AcquireSourceId
}

export interface AcquisitionRecord {
  id: string
  at: string
  itemId: string
  source: AcquireSourceId
  duplicate: boolean
  bannerId?: string
}

export interface EquippedLoadout {
  appearanceId: string | null
  vfxId: string | null
  emoteId: string | null
  animationId: string | null
}

export interface VariantPrefs {
  mode: 'free' | 'chronology' | 'custom'
  chronologyMissionId: string
  preferred: Partial<Record<string, { variantId: string, movesetId: 'narrative' | 'custom' }>>
}

export interface LiveSaveSlice {
  equipped: Partial<Record<string, EquippedLoadout>>
  favorites: string[]
  newFlags: string[]
  encountered: string[]
  fragments: Record<string, number>
  pity: Record<string, PityState>
  inventory: InventoryRecord[]
  acquisitions: AcquisitionRecord[]
  purchasedOffers: string[]
  nextForceRarity: RarityId | null
  variantPrefs: VariantPrefs | null
}

export interface SummonDrop {
  itemId: string
  rarity: RarityId
  duplicate: boolean
  fragments: number
  pityForced: boolean
}
