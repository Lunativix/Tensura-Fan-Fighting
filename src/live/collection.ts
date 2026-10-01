import { PLAYABLE_FIGHTERS } from '../config/characters.ts'
import { CHARACTERS } from '../config/characters.ts'
import type { FighterIdValue } from '../types/game.ts'
import type { SaveData } from '../save/SaveManager.ts'
import { appearancesOf } from '../story/visual/catalog.ts'
import { ITEMS, itemById } from './catalog.ts'
import { ItemKind, type EquippedLoadout } from './types.ts'
import { ownsItem } from './grant.ts'
import type { ItemDef } from './types.ts'

export const CollectionTab = {
  CHARACTERS: 'characters',
  APPEARANCES: 'appearances',
  COSMETICS: 'cosmetics',
  MUSIC: 'music',
  CARDS: 'cards',
  OTHER: 'other',
} as const

export type CollectionTabId = (typeof CollectionTab)[keyof typeof CollectionTab]

export function collectionProgress(data: SaveData): { owned: number, total: number } {
  const total = ITEMS.length
  const owned = ITEMS.filter((item) => ownsItem(data, item.id)).length
  return { owned, total }
}

export function itemsForTab(tab: CollectionTabId): ItemDef[] {
  if (tab === CollectionTab.APPEARANCES) {
    return ITEMS.filter((item) => item.kind === ItemKind.APPEARANCE)
  }
  if (tab === CollectionTab.MUSIC) {
    return ITEMS.filter((item) => item.kind === ItemKind.MUSIC)
  }
  if (tab === CollectionTab.CARDS) {
    return ITEMS.filter((item) => item.kind === ItemKind.CARD)
  }
  if (tab === CollectionTab.COSMETICS) {
    return ITEMS.filter((item) => item.kind === ItemKind.COSMETIC || item.kind === ItemKind.EMOTE || item.kind === ItemKind.VFX || item.kind === ItemKind.ANIMATION)
  }
  if (tab === CollectionTab.OTHER) {
    return ITEMS.filter((item) => item.kind === ItemKind.VFX || item.kind === ItemKind.ANIMATION)
  }
  return []
}

export function storyLooksOf(fighterId: FighterIdValue) {
  return appearancesOf(fighterId)
}

export function displayNameForItem(data: SaveData, item: ItemDef): string {
  if (item.spoiler && !data.live.encountered.includes(item.fighterId ?? '') && !ownsItem(data, item.id)) {
    return '????'
  }
  return item.name
}

export function toggleFavorite(data: SaveData, id: string): SaveData {
  data.live.favorites = data.live.favorites.includes(id)
    ? data.live.favorites.filter((row) => row !== id)
    : [...data.live.favorites, id]
  return data
}

export function clearNewFlag(data: SaveData, id: string): SaveData {
  data.live.newFlags = data.live.newFlags.filter((row) => row !== id)
  return data
}

export function emptyLoadout(): EquippedLoadout {
  return { appearanceId: null, vfxId: null, emoteId: null, animationId: null }
}

export function equipItem(data: SaveData, fighterId: FighterIdValue, itemId: string): SaveData {
  const item = itemById(itemId)
  if (!item || !ownsItem(data, itemId)) {
    return data
  }
  const current = data.live.equipped[fighterId] ?? emptyLoadout()
  if (item.kind === ItemKind.APPEARANCE) {
    current.appearanceId = itemId
  } else if (item.kind === ItemKind.VFX) {
    current.vfxId = itemId
  } else if (item.kind === ItemKind.EMOTE) {
    current.emoteId = itemId
  } else if (item.kind === ItemKind.ANIMATION) {
    current.animationId = itemId
  }
  data.live.equipped[fighterId] = current
  if (itemId === 'title-tempest') {
    data.profile.equippedTitle = itemId
  }
  return data
}

export function equippedTint(data: SaveData, fighterId: FighterIdValue): number | undefined {
  const id = data.live.equipped[fighterId]?.appearanceId
  return id ? itemById(id)?.tint : undefined
}

export function markEncountered(data: SaveData, fighterId: string): SaveData {
  if (!data.live.encountered.includes(fighterId)) {
    data.live.encountered = [...data.live.encountered, fighterId]
  }
  return data
}

export function characterOwned(data: SaveData, id: FighterIdValue): boolean {
  return data.collection.characters.includes(id) || PLAYABLE_FIGHTERS.includes(id)
}

export function characterMeta(id: FighterIdValue) {
  return CHARACTERS[id]
}
