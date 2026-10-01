import { Currency } from '../account/types.ts'
import { grantCredits, grantFragments, grantTickets, spendCredits, spendTickets } from '../account/economy.ts'
import { unlockCollection } from '../account/collection.ts'
import { newId, nowIso, unique } from '../account/crypto.ts'
import type { SaveData } from '../save/SaveManager.ts'
import { itemById } from './catalog.ts'
import { ItemKind, AcquireSource, type AcquireSourceId, type ItemDef } from './types.ts'

function spend(data: SaveData, currency: typeof Currency[keyof typeof Currency], amount: number, reason: string, sku?: string) {
  if (amount <= 0) {
    return { ok: true as const, inventory: data.inventory, economy: data.economy, balance: 0 }
  }
  if (currency === Currency.CREDITS) {
    return spendCredits(data.inventory, data.economy, amount, reason, sku)
  }
  if (currency === Currency.TICKETS) {
    return spendTickets(data.inventory, data.economy, amount, reason, sku)
  }
  return { ok: false as const, reason: 'unsupported_spend' }
}

function grantCurrency(data: SaveData, currency: typeof Currency[keyof typeof Currency], amount: number, reason: string) {
  if (amount <= 0) {
    return { ok: true as const, inventory: data.inventory, economy: data.economy, balance: 0 }
  }
  if (currency === Currency.CREDITS) {
    return grantCredits(data.inventory, data.economy, amount, reason)
  }
  if (currency === Currency.TICKETS) {
    return grantTickets(data.inventory, data.economy, amount, reason)
  }
  if (currency === Currency.FRAGMENTS) {
    return grantFragments(data.inventory, data.economy, amount, reason)
  }
  return { ok: false as const, reason: 'unsupported_grant' }
}

export function ownsItem(data: SaveData, itemId: string): boolean {
  const item = itemById(itemId)
  if (!item) {
    return data.collection.cosmetics.includes(itemId)
  }
  if (item.kind === ItemKind.CHARACTER) {
    return data.collection.characters.includes(item.fighterId ?? itemId)
  }
  if (item.kind === ItemKind.APPEARANCE) {
    return data.collection.appearances.includes(itemId) || data.collection.cosmetics.includes(itemId)
  }
  if (item.kind === ItemKind.MUSIC) {
    return data.collection.musicTracks.includes(itemId)
  }
  if (item.kind === ItemKind.EMOTE) {
    return data.collection.emotes.includes(itemId) || data.collection.cosmetics.includes(itemId)
  }
  if (item.kind === ItemKind.VFX) {
    return data.collection.vfx.includes(itemId) || data.collection.cosmetics.includes(itemId)
  }
  if (item.kind === ItemKind.CARD) {
    return data.collection.cards.includes(itemId) || data.collection.cosmetics.includes(itemId)
  }
  if (item.kind === ItemKind.ANIMATION) {
    return data.collection.animations.includes(itemId) || data.collection.cosmetics.includes(itemId)
  }
  return data.collection.cosmetics.includes(itemId)
}

function putOwned(data: SaveData, item: ItemDef): void {
  if (item.kind === ItemKind.CHARACTER && item.fighterId) {
    data.collection = unlockCollection(data.collection, { characters: [item.fighterId] })
    return
  }
  if (item.kind === ItemKind.APPEARANCE) {
    data.collection = unlockCollection(data.collection, { appearances: [item.id], cosmetics: [item.id] })
    return
  }
  if (item.kind === ItemKind.MUSIC) {
    data.collection = unlockCollection(data.collection, { musicTracks: [item.id] })
    return
  }
  if (item.kind === ItemKind.EMOTE) {
    data.collection = unlockCollection(data.collection, { emotes: [item.id], cosmetics: [item.id] })
    return
  }
  if (item.kind === ItemKind.VFX) {
    data.collection = unlockCollection(data.collection, { vfx: [item.id], cosmetics: [item.id] })
    return
  }
  if (item.kind === ItemKind.CARD) {
    data.collection = unlockCollection(data.collection, { cards: [item.id], cosmetics: [item.id] })
    return
  }
  if (item.kind === ItemKind.ANIMATION) {
    data.collection = unlockCollection(data.collection, { animations: [item.id], cosmetics: [item.id] })
    return
  }
  data.collection = unlockCollection(data.collection, { cosmetics: [item.id] })
}

const MAX_ACQ = 80

export function grantItem(
  data: SaveData,
  itemId: string,
  source: AcquireSourceId,
  bannerId?: string,
): { duplicate: boolean, fragments: number } {
  const item = itemById(itemId)
  if (!item) {
    return { duplicate: false, fragments: 0 }
  }
  const duplicate = ownsItem(data, itemId)
  const at = nowIso()
  if (duplicate) {
    const amount = item.duplicateFragments
    const target = item.fragmentTarget ?? item.fighterId ?? item.id
    data.live.fragments[target] = (data.live.fragments[target] ?? 0) + amount
    const granted = grantCurrency(data, Currency.FRAGMENTS, amount, `duplicate:${itemId}`)
    if (granted.ok) {
      data.inventory = granted.inventory
      data.economy = granted.economy
    }
    data.live.acquisitions = [...data.live.acquisitions, {
      id: newId('acq'),
      at,
      itemId,
      source: AcquireSource.DUPLICATE,
      duplicate: true,
      bannerId,
    }].slice(-MAX_ACQ)
    return { duplicate: true, fragments: amount }
  }
  putOwned(data, item)
  data.inventory.items = unique(data.inventory.items, [itemId])
  if (item.fighterId && !data.live.encountered.includes(item.fighterId)) {
    data.live.encountered = [...data.live.encountered, item.fighterId]
  }
  data.live.inventory = [...data.live.inventory, { itemId, qty: 1, at, source }]
  data.live.newFlags = unique(data.live.newFlags, [itemId])
  data.live.acquisitions = [...data.live.acquisitions, {
    id: newId('acq'),
    at,
    itemId,
    source,
    duplicate: false,
    bannerId,
  }].slice(-MAX_ACQ)
  return { duplicate: false, fragments: 0 }
}

export { spend, grantCurrency }
