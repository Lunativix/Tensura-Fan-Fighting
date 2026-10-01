import type { LiveSaveSlice, PityState } from './types.ts'

export function emptyPity(): PityState {
  return { pulls: 0, sinceLegendary: 0, sinceMythic: 0 }
}

export function defaultLive(): LiveSaveSlice {
  return {
    equipped: {},
    favorites: [],
    newFlags: [],
    encountered: ['rimuru'],
    fragments: {},
    pity: {},
    inventory: [],
    acquisitions: [],
    purchasedOffers: [],
    nextForceRarity: null,
    variantPrefs: null,
  }
}

export function mergeLive(raw: Partial<LiveSaveSlice> | undefined): LiveSaveSlice {
  const base = defaultLive()
  if (!raw) {
    return base
  }
  return {
    equipped: { ...base.equipped, ...(raw.equipped ?? {}) },
    favorites: raw.favorites ?? base.favorites,
    newFlags: raw.newFlags ?? [],
    encountered: Array.from(new Set([...(raw.encountered ?? []), ...base.encountered])),
    fragments: { ...raw.fragments },
    pity: { ...raw.pity },
    inventory: raw.inventory ?? [],
    acquisitions: raw.acquisitions ?? [],
    purchasedOffers: raw.purchasedOffers ?? [],
    nextForceRarity: raw.nextForceRarity ?? null,
    variantPrefs: raw.variantPrefs ?? null,
  }
}
