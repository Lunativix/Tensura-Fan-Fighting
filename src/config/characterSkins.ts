import { PLAYABLE_FIGHTERS } from './characters.ts'
import { type FighterIdValue } from '../types/game.ts'
import { appearancesOf, appearanceById, APPEARANCES } from '../story/visual/catalog.ts'
import { appearanceFor } from '../story/visual/resolve.ts'
import type { AppearanceDef, VisualBody, VisualContext } from '../story/visual/types.ts'
import { hasCompleted, type StorySaveSlice } from '../story/StoryProgress.ts'

export type SkinBody = VisualBody

export interface CharacterSkinDef {
  id: string
  fighterId: FighterIdValue
  label: string
  portrait: string
  body: SkinBody
  unlockOn?: string
}

function toSkin(def: AppearanceDef): CharacterSkinDef {
  return {
    id: def.id,
    fighterId: def.fighterId,
    label: def.label,
    portrait: def.portrait,
    body: def.body,
    unlockOn: def.from.kind === 'missionComplete' ? def.from.missionId : def.from.kind === 'missionStart' ? def.from.missionId : undefined,
  }
}

export const CHARACTER_SKINS: Record<FighterIdValue, CharacterSkinDef[]> = PLAYABLE_FIGHTERS.reduce((acc, id) => {
  acc[id] = appearancesOf(id).map(toSkin)
  return acc
}, {} as Record<FighterIdValue, CharacterSkinDef[]>)

export function skinsOf(fighterId: FighterIdValue): CharacterSkinDef[] {
  return CHARACTER_SKINS[fighterId] ?? []
}

export function skinById(id: string): CharacterSkinDef | undefined {
  const found = appearanceById(id)
  return found ? toSkin(found) : undefined
}

export function isSkinUnlocked(def: CharacterSkinDef, story: StorySaveSlice): boolean {
  if (!def.unlockOn) {
    return true
  }
  return hasCompleted(story, def.unlockOn)
}

/**
 * Story Mode appearance. Versus / arcade use roster sprites via Fighter default body.
 */
export function storySkinFor(
  fighterId: FighterIdValue,
  story: StorySaveSlice,
  ctx?: { missionId?: string; speaker?: string },
): CharacterSkinDef {
  const visual: VisualContext = { story, missionId: ctx?.missionId, speaker: ctx?.speaker }
  return toSkin(appearanceFor(fighterId, visual))
}

export { APPEARANCES, appearanceFor }
