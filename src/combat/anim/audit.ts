import { SPRITE_CLIP_INDEX } from '../../sprites/spriteClipIndex.ts'
import type { FighterIdValue } from '../../types/game.ts'
import { clipKeysFor, formsOf } from './forms.ts'
import { attackOf, deriveArtStatus } from './pipeline.ts'
import { allSkillAnimDefs, characterDisplayName } from './registry.ts'
import { timingFromAttack } from './timing.ts'
import type { SkillAnimResolution } from './types.ts'

export function indexHasClip(fighterId: FighterIdValue, clipKey: string): boolean {
  const clips = SPRITE_CLIP_INDEX[fighterId]
  const files = clips?.[clipKey]
  return Boolean(files && files.length > 0)
}

export function pngExistsFor(fighterId: FighterIdValue, form: string, animId: string): boolean {
  if (indexHasClip(fighterId, animId)) {
    return true
  }
  return clipKeysFor(form, animId).some((key) => indexHasClip(fighterId, key))
}

export function listMissingFromIndex(): SkillAnimResolution[] {
  const missing: SkillAnimResolution[] = []
  for (const def of allSkillAnimDefs()) {
    const forms = formsOf(def.fighterId)
    const present = indexHasClip(def.fighterId, def.animId)
      || forms.some((form) => pngExistsFor(def.fighterId, form, def.animId))
    if (present) {
      continue
    }
    const attack = attackOf(def.fighterId, def.attackId)
    if (!attack) {
      continue
    }
    const timing = timingFromAttack(attack, def.timing)
    missing.push({
      fighterId: def.fighterId,
      characterName: characterDisplayName(def.fighterId),
      form: forms[0] ?? 'default',
      attackId: def.attackId,
      skillName: def.skillName,
      animId: def.animId,
      slot: def.slot,
      clipKey: null,
      source: 'missing',
      artStatus: deriveArtStatus(false),
      timing,
      executionFrame: timing.releaseFrame,
      durationFrames: attack.startup + attack.active + attack.recovery,
      events: [],
    })
  }
  return missing
}

export function reportMissingSkillAnimsAtBoot(): void {
  const missing = listMissingFromIndex()
  if (missing.length === 0) {
    console.info('[skill anim] all registered clips have PNG folders')
    return
  }
  console.warn(`[MISSING SKILL ANIMATION] ${missing.length} clip(s) still need PNG drop-in`)
  const byChar = new Map<string, string[]>()
  for (const item of missing) {
    const list = byChar.get(item.characterName) ?? []
    list.push(`${item.skillName} (${item.animId})`)
    byChar.set(item.characterName, list)
  }
  for (const [name, skills] of byChar) {
    console.warn(`${name}: ${skills.join(', ')}`)
  }
}
