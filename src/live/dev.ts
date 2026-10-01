import type { SaveData } from '../save/SaveManager.ts'
import { grantCredits, grantTickets } from '../account/economy.ts'
import { isDevPurchaseMode } from './payment.ts'
import type { RarityId } from './rarity.ts'

export function devGrantCredits(data: SaveData, amount: number): SaveData {
  if (!isDevPurchaseMode()) {
    return data
  }
  const granted = grantCredits(data.inventory, data.economy, amount, 'dev_add_currency')
  if (granted.ok) {
    data.inventory = granted.inventory
    data.economy = granted.economy
  }
  return data
}

export function devGrantTickets(data: SaveData, amount: number): SaveData {
  if (!isDevPurchaseMode()) {
    return data
  }
  const granted = grantTickets(data.inventory, data.economy, amount, 'dev_add_tickets')
  if (granted.ok) {
    data.inventory = granted.inventory
    data.economy = granted.economy
  }
  return data
}

export function devResetPity(data: SaveData): SaveData {
  if (!isDevPurchaseMode()) {
    return data
  }
  data.live.pity = {}
  return data
}

export function devForceRarity(data: SaveData, rarity: RarityId): SaveData {
  if (!isDevPurchaseMode()) {
    return data
  }
  data.live.nextForceRarity = rarity
  return data
}
