import { defaultStorySave, type StorySaveSlice } from '../story/types.ts'
import { PLAYABLE_FIGHTERS } from '../config/characters.ts'
import { AccountKind, Currency, type AccountSlice, type CollectionSlice, type EconomySlice, type GameProfileSlice, type GdprSlice, type InventorySlice } from './types.ts'
import { newId, nowIso } from './crypto.ts'

export function defaultAccount(): AccountSlice {
  return {
    id: newId('guest'),
    kind: AccountKind.GUEST,
    displayName: 'Voyageur',
    createdAt: nowIso(),
    lastSeenAt: nowIso(),
    credentials: null,
    claimedFromGuestId: null,
  }
}

export function defaultProfile(): GameProfileSlice {
  return {
    level: 1,
    xp: 0,
    wins: 0,
    losses: 0,
    titles: [],
    equippedTitle: '',
    lastWinDay: '',
    avatarId: 'rimuru',
  }
}

export function defaultCollection(): CollectionSlice {
  return {
    characters: [...PLAYABLE_FIGHTERS],
    appearances: ['rimuru-slime'],
    cosmetics: [],
    musicTracks: [],
    emotes: [],
    vfx: [],
    cards: [],
    animations: [],
    codex: [],
  }
}

export function defaultInventory(): InventorySlice {
  return {
    credits: 0,
    premium: 0,
    tickets: 0,
    fragments: 0,
    items: [],
  }
}

export function defaultEconomy(): EconomySlice {
  return {
    ledger: [],
    purchases: [],
    summons: [],
  }
}

export function defaultGdpr(): GdprSlice {
  return {
    privacyAcceptedAt: null,
    analyticsAcceptedAt: null,
    marketingAcceptedAt: null,
    ageGateAcceptedAt: null,
    lastExportAt: null,
  }
}

export function emptyStory(): StorySaveSlice {
  return defaultStorySave()
}

export function balanceOf(inventory: InventorySlice, currency: typeof Currency[keyof typeof Currency]): number {
  if (currency === Currency.CREDITS) {
    return inventory.credits
  }
  if (currency === Currency.PREMIUM) {
    return inventory.premium
  }
  if (currency === Currency.TICKETS) {
    return inventory.tickets
  }
  return inventory.fragments
}

export function writeBalance(inventory: InventorySlice, currency: typeof Currency[keyof typeof Currency], amount: number): InventorySlice {
  const next = Math.max(0, Math.floor(amount))
  if (currency === Currency.CREDITS) {
    return { ...inventory, credits: next }
  }
  if (currency === Currency.PREMIUM) {
    return { ...inventory, premium: next }
  }
  if (currency === Currency.TICKETS) {
    return { ...inventory, tickets: next }
  }
  return { ...inventory, fragments: next }
}
