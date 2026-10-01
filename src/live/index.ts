/**
 * Live service — Collection + Boutique + Invocation
 *
 * Add a cosmetic:
 *   1. ItemDef in catalog.ts
 *   2. ShopOffer and/or banner pool
 *   3. No new playable fighter unless CharacterDefinition exists
 *
 * Add a banner:
 *   1. BannerDef in banners.ts (rates MUST sum to 100)
 *   2. Optional event in events.ts
 *
 * Story appearances stay in story/visual. Shop tints never override Story Mode.
 */
export { RARITIES, Rarity, rarityOf } from './rarity.ts'
export { ITEMS, SHOP_ITEMS, SHOP_OFFERS, itemById, offerById } from './catalog.ts'
export { BANNERS, bannerById, rateLines } from './banners.ts'
export { LIVE_EVENTS, activeEvents, formatCountdown, remainingMs, matchEventCreditBonus } from './events.ts'
export { defaultLive, mergeLive, emptyPity } from './defaults.ts'
export { ownsItem, grantItem } from './grant.ts'
export { featuredOffer, offersIn, offerVisible, purchaseOffer } from './shop.ts'
export { summon } from './summon.ts'
export {
  CollectionTab,
  collectionProgress,
  itemsForTab,
  displayNameForItem,
  toggleFavorite,
  equipItem,
  equippedTint,
  characterOwned,
  markEncountered,
  clearNewFlag,
} from './collection.ts'
export { isDevPurchaseMode } from './payment.ts'
export { ShopCategory, ItemKind, AcquireSource } from './types.ts'
export type { ItemDef, ShopOffer, BannerDef, LiveSaveSlice, SummonDrop } from './types.ts'
