import type { CollectionSlice } from './types.ts'
import { unique } from './crypto.ts'

export function unlockCollection(
  collection: CollectionSlice,
  extra: Partial<Pick<CollectionSlice, 'characters' | 'appearances' | 'cosmetics' | 'musicTracks' | 'emotes' | 'vfx' | 'cards' | 'animations' | 'codex'>>,
): CollectionSlice {
  return {
    characters: unique(collection.characters, extra.characters),
    appearances: unique(collection.appearances, extra.appearances),
    cosmetics: unique(collection.cosmetics, extra.cosmetics),
    musicTracks: unique(collection.musicTracks, extra.musicTracks),
    emotes: unique(collection.emotes, extra.emotes),
    vfx: unique(collection.vfx, extra.vfx),
    cards: unique(collection.cards, extra.cards),
    animations: unique(collection.animations, extra.animations),
    codex: unique(collection.codex, extra.codex),
  }
}

export function ownsCosmetic(collection: CollectionSlice, id: string): boolean {
  return collection.cosmetics.includes(id)
}
