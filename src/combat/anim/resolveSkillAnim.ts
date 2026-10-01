import { AttackKind, type AttackData } from '../Attack.ts'
import { clipKeysFor } from './forms.ts'
import { deriveArtStatus, durationOf, timingOf } from './pipeline.ts'
import { characterDisplayName, defaultSkillEvents, skillAnimOf } from './registry.ts'
import type { ResolveClipFn, SkillAnimResolution } from './types.ts'
import { noteMissingSkillAnim, clearFoundSkillAnim } from './missingLog.ts'

const FORBIDDEN = new Set(['skill', 'attack', 'ultimate', 'punch', 'jab', 'melee'])

export function resolveSkillAnim(
  fighterId: SkillAnimResolution['fighterId'],
  form: string,
  attack: AttackData,
  hasClip: ResolveClipFn,
): SkillAnimResolution | null {
  const def = skillAnimOf(fighterId, attack.id)
  if (!def) {
    return null
  }
  let clipKey: string | null = null
  for (const key of clipKeysFor(form, def.animId)) {
    if (FORBIDDEN.has(key)) {
      continue
    }
    if (hasClip(fighterId, key)) {
      clipKey = key
      break
    }
  }
  const source = clipKey ? 'png' : 'missing'
  const timing = timingOf(def, attack)
  const resolution: SkillAnimResolution = {
    fighterId,
    characterName: characterDisplayName(fighterId),
    form,
    attackId: attack.id,
    skillName: def.skillName,
    animId: def.animId,
    slot: def.slot,
    clipKey,
    source,
    artStatus: deriveArtStatus(Boolean(clipKey)),
    timing,
    executionFrame: timing.releaseFrame,
    durationFrames: durationOf(def, attack),
    events: [...defaultSkillEvents(attack, def.slot, timing), ...(def.extraEvents ?? [])],
  }
  if (source === 'missing') {
    noteMissingSkillAnim(resolution)
  } else {
    clearFoundSkillAnim(resolution)
  }
  return resolution
}

export function isGenericCombatClip(clip: string): boolean {
  return FORBIDDEN.has(clip)
}

export function needsProjectileSpawn(attack: AttackData): boolean {
  return attack.kind === AttackKind.PROJECTILE || attack.kind === AttackKind.BEAM
}
