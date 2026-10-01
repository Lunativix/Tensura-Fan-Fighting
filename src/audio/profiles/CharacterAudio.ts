import type { CharacterAudioProfile } from '../SfxTypes.ts'
import { SIGNATURES } from './signatures.ts'
import { skillsFor } from './skillCatalog.ts'
import { koOf, transformOf, COMMON_SWITCH } from './commonCatalog.ts'
import { talkRecipeIds } from './voiceCatalog.ts'
import type { FighterIdValue } from '../../types/game.ts'
import { PLAYABLE_FIGHTERS } from '../../config/characters.ts'

const CACHE = new Map<FighterIdValue, CharacterAudioProfile>()

export function profileFor(id: FighterIdValue): CharacterAudioProfile {
  const cached = CACHE.get(id)
  if (cached) {
    return cached
  }
  const sig = SIGNATURES[id]
  const kit = skillsFor(id)
  const profile: CharacterAudioProfile = {
    id,
    primary: sig.primary,
    secondary: sig.secondary,
    energy: sig.energy,
    impact: sig.impact,
    movement: sig.movement,
    defensive: sig.defensive,
    weight: sig.weight,
    skills: [kit.skills[0]!, kit.skills[1]!, kit.skills[2]!, kit.skills[3]!],
    ultimate: kit.ultimate,
    transform: transformOf(id),
    ko: koOf(id),
    switchIn: COMMON_SWITCH.entry,
    talkIds: talkRecipeIds(id),
  }
  CACHE.set(id, profile)
  return profile
}

export function allProfiles(): CharacterAudioProfile[] {
  return PLAYABLE_FIGHTERS.map(profileFor)
}

export function skillReleaseIds(id: FighterIdValue): string[] {
  const profile = profileFor(id)
  return [...profile.skills.map((skill) => skill.release.id), profile.ultimate.release.id]
}
