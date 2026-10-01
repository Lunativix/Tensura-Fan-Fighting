import { Currency } from '../account/types.ts'
import { grantPremiumFromServer, requestPremiumPurchase } from '../account/economy.ts'
import { newId } from '../account/crypto.ts'
import type { SaveData } from '../save/SaveManager.ts'
import { offerById } from './catalog.ts'

/** Dev virtual currency only. Never presented as a real payment. */
export function isDevPurchaseMode(): boolean {
  try {
    if (import.meta.env.DEV) {
      return true
    }
    return localStorage.getItem('tensura-dev-live') === '1'
  } catch {
    return Boolean(import.meta.env.DEV)
  }
}

export function purchasePremiumSku(data: SaveData, sku: string, amount: number): { ok: true, data: SaveData } | { ok: false, reason: string } {
  if (!isDevPurchaseMode()) {
    const rejected = requestPremiumPurchase(sku)
    data.economy = {
      ...data.economy,
      purchases: [...data.economy.purchases, rejected.purchase],
    }
    return { ok: false, reason: 'payments_not_enabled' }
  }
  const receipt = `srv_dev_${sku}_${newId('rcpt')}`
  const granted = grantPremiumFromServer(data.inventory, data.economy, amount, receipt)
  if (!granted.ok) {
    return granted
  }
  data.inventory = granted.inventory
  data.economy = {
    ...granted.economy,
    purchases: [...granted.economy.purchases, {
      id: newId('pay'),
      at: new Date().toISOString(),
      sku,
      status: 'fulfilled',
      reason: 'dev_virtual_grant',
    }],
  }
  return { ok: true, data }
}

export function premiumAmountForOffer(offerId: string): number {
  const offer = offerById(offerId)
  if (!offer?.premiumSku || offer.currencyGrant?.currency !== Currency.PREMIUM) {
    return 0
  }
  return offer.currencyGrant.amount
}
