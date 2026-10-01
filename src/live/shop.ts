import { Currency } from '../account/types.ts'
import type { SaveData } from '../save/SaveManager.ts'
import { offerById, SHOP_OFFERS, itemById } from './catalog.ts'
import { isWithin } from './events.ts'
import { grantCurrency, grantItem, ownsItem, spend } from './grant.ts'
import { premiumAmountForOffer, purchasePremiumSku } from './payment.ts'
import { ShopCategory, type ShopCategoryId, type ShopOffer } from './types.ts'

export function utcDayIndex(now = Date.now()): number {
  return Math.floor(now / 86_400_000)
}

export function utcWeekIndex(now = Date.now()): number {
  return Math.floor(now / (86_400_000 * 7))
}

export function offerVisible(offer: ShopOffer, now = Date.now()): boolean {
  if (offer.availableFrom && now < Date.parse(offer.availableFrom)) {
    return false
  }
  if (offer.availableUntil && now >= Date.parse(offer.availableUntil)) {
    return false
  }
  if (offer.eventId === 'premier-walpurgis' && !isWithin('2026-08-25T00:00:00.000Z', '2026-09-08T00:00:00.000Z', now)) {
    return false
  }
  if (offer.rotation === 'daily') {
    const pool = SHOP_OFFERS.filter((row) => row.rotation === 'daily' && row.category === offer.category)
    const pick = pool[utcDayIndex(now) % Math.max(1, pool.length)]
    return pick?.id === offer.id
  }
  if (offer.rotation === 'weekly') {
    const pool = SHOP_OFFERS.filter((row) => row.rotation === 'weekly')
    const pick = pool[utcWeekIndex(now) % Math.max(1, pool.length)]
    return pick?.id === offer.id
  }
  return true
}

export function offersIn(category: ShopCategoryId, now = Date.now()): ShopOffer[] {
  return SHOP_OFFERS.filter((offer) => offer.category === category && offerVisible(offer, now))
}

export function featuredOffer(now = Date.now()): ShopOffer | undefined {
  return offersIn(ShopCategory.FEATURED, now)[0] ?? offersIn(ShopCategory.APPEARANCES, now)[0]
}

export function purchaseOffer(data: SaveData, offerId: string): { ok: true, data: SaveData, message: string } | { ok: false, reason: string } {
  const offer = offerById(offerId)
  if (!offer) {
    return { ok: false, reason: 'unknown_offer' }
  }
  if (!offerVisible(offer)) {
    return { ok: false, reason: 'not_available' }
  }
  if (offer.once && data.live.purchasedOffers.includes(offer.id)) {
    return { ok: false, reason: 'already_owned' }
  }
  if (offer.itemId && ownsItem(data, offer.itemId) && !offer.pack && !offer.currencyGrant) {
    return { ok: false, reason: 'already_owned' }
  }
  if (offer.premiumSku) {
    const amount = premiumAmountForOffer(offer.id)
    const paid = purchasePremiumSku(data, offer.premiumSku, amount)
    if (!paid.ok) {
      return paid
    }
    data.live.purchasedOffers = offer.once ? [...data.live.purchasedOffers, offer.id] : data.live.purchasedOffers
    return { ok: true, data, message: 'Crédit Premium de test. Ce n’est pas un achat réel.' }
  }
  const spent = spend(data, offer.price.currency, offer.price.amount, `shop:${offer.id}`, offer.id)
  if (!spent.ok) {
    return spent
  }
  data.inventory = spent.inventory
  data.economy = spent.economy
  if (offer.currencyGrant && offer.currencyGrant.currency !== Currency.PREMIUM) {
    const granted = grantCurrency(data, offer.currencyGrant.currency, offer.currencyGrant.amount, `shop_grant:${offer.id}`)
    if (!granted.ok) {
      return granted
    }
    data.inventory = granted.inventory
    data.economy = granted.economy
  }
  if (offer.itemId) {
    grantItem(data, offer.itemId, 'shop')
  }
  for (const part of offer.pack ?? []) {
    for (let i = 0; i < part.qty; i += 1) {
      grantItem(data, part.itemId, 'pack')
    }
  }
  if (offer.once) {
    data.live.purchasedOffers = [...data.live.purchasedOffers, offer.id]
  }
  const item = offer.itemId ? itemById(offer.itemId) : undefined
  return { ok: true, data, message: item ? `${item.name} ajouté à la collection.` : 'Achat validé.' }
}
