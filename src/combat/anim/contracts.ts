import { AttackKind } from '../Attack.ts'
import { CHARACTERS } from '../../config/characters.ts'
import { kitFor } from '../../config/skills.ts'
import type { FighterIdValue } from '../../types/game.ts'
import { pngExistsFor } from './audit.ts'
import { attackOf, timingOf, vfxHooksOf } from './pipeline.ts'
import { formsOf, versusAnimForm } from './forms.ts'
import { allOwnNormalSlots, allSkillAnimDefs, characterDisplayName, normalsOf } from './registry.ts'
import { vfxHookFlag, sfxHookFlag } from './hookStatus.ts'

export interface SkillArtBrief {
  character: string
  fighterId: FighterIdValue
  form: string
  skill: string
  id: string
  attackId: string
  slot: 0 | 1 | 2 | 3 | 4
  type: string
  movementStyle: string
  animationPurpose: string
  requiredPoses: string[]
  requiredFrames: string
  releaseFrame: number
  projectile: boolean
  hitbox: string
  vfx: { cast?: string, release?: string, travel?: string, impact?: string, recovery?: string }
  sfx: 'SFX_READY' | 'SFX_MISSING'
  camera: string
  recovery: string
}

export interface NormalArtBrief {
  character: string
  fighterId: FighterIdValue
  id: string
  name: string
  source: 'own' | 'fallback-rimuru' | 'fallback-milim'
  path: string
  altPath: string
}

export interface UltimateArtBrief extends SkillArtBrief {
  confirmationFrame: number
}

const POSES = [
  'anticipation',
  'formation',
  'release',
  'follow-through',
  'recovery',
]

function movementStyle(kind: string, projectile: boolean): string {
  if (kind === AttackKind.BEAM) {
    return 'Aim, hold, fire a beam that spans to the target or arena edge.'
  }
  if (projectile) {
    return 'Prepare, form, and project. The character sheet is the CAST only.'
  }
  if (kind === AttackKind.ULTIMATE) {
    return 'Startup that can be interrupted, then confirmation, then committed execution.'
  }
  if (kind === AttackKind.TRANSFORMATION) {
    return 'Full-body transformation: startup, change, aura, finish.'
  }
  if (kind === AttackKind.DEFENSIVE || kind === AttackKind.COUNTER) {
    return 'Guard / counter posture, not a generic punch.'
  }
  if (kind === AttackKind.MOBILITY) {
    return 'Displacement with a unique silhouette, not a dash reuse.'
  }
  return 'Committed unique melee silhouette for this technique only.'
}

function purpose(skill: string, animId: string): string {
  if (animId === 'rimuru_water_blade') {
    return 'Rimuru prepares and throws a water blade. Never idle, punch, jab, kick, or a generic slash.'
  }
  return `Unique animation for ${skill} (${animId}). Do not reuse another skill or a generic attack clip.`
}

export function skillArtBriefs(): SkillArtBrief[] {
  return allSkillAnimDefs().map((def) => {
    const attack = attackOf(def.fighterId, def.attackId)
    if (!attack) {
      throw new Error(`missing attack ${def.fighterId} ${def.attackId}`)
    }
    const timing = timingOf(def, attack)
    const vfx = vfxHooksOf(attack, def)
    const projectile = attack.kind === AttackKind.PROJECTILE || attack.kind === AttackKind.BEAM
    return {
      character: characterDisplayName(def.fighterId),
      fighterId: def.fighterId,
      form: 'base',
      skill: def.skillName,
      id: def.animId,
      attackId: def.attackId,
      slot: def.slot,
      type: attack.kind,
      movementStyle: movementStyle(attack.kind, projectile),
      animationPurpose: purpose(def.skillName, def.animId),
      requiredPoses: POSES,
      requiredFrames: 'Enough for anticipation, motion, release, follow-through, recovery. Canonical 001.png… no gaps.',
      releaseFrame: timing.releaseFrame,
      projectile,
      hitbox: projectile
        ? 'Projectile / beam hitbox follows the spawned shot, not the character sprite.'
        : `Melee hitbox during active ${timing.activeStart}-${timing.activeEnd}.`,
      vfx,
      sfx: sfxHookFlag(def.fighterId, def.slot),
      camera: def.slot === 4 ? 'ultimate at release' : def.slot >= 2 ? 'release micro-impact' : 'release light (if extraEvents)',
      recovery: `${timing.recoveryStart}-${timing.recoveryEnd}`,
    }
  })
}

export function normalArtBriefs(): NormalArtBrief[] {
  return allOwnNormalSlots().map((slot) => {
    const kit = kitFor(slot.fighterId)
    const names: Record<string, string> = {
      light_1: kit.lights[0]?.name ?? 'Light 1',
      light_2: kit.lights[1]?.name ?? 'Light 2',
      light_3: kit.lights[2]?.name ?? 'Light 3',
      medium: kit.medium.name,
      heavy: kit.heavy.name,
      air_light: kit.airLight.name,
      air_heavy: kit.airHeavy.name,
      down_light: kit.downLight.name,
    }
    const suffix = slot.animId.slice(slot.fighterId.length + 1)
    const runtime = normalsOf(slot.fighterId)
    return {
      character: characterDisplayName(slot.fighterId),
      fighterId: slot.fighterId,
      id: slot.animId,
      name: names[suffix] ?? slot.animId,
      source: runtime.source,
      path: `public/sprites/${slot.fighterId}/${slot.animId}/`,
      altPath: `public/sprites/${slot.fighterId}/normals/${slot.animId}/`,
    }
  })
}

export function ultimateArtBriefs(): UltimateArtBrief[] {
  return skillArtBriefs().filter((item) => item.slot === 4).map((item) => {
    const attack = attackOf(item.fighterId, item.attackId)!
    const timing = timingOf(
      { fighterId: item.fighterId, attackId: item.attackId, animId: item.id, skillName: item.skill, slot: 4 },
      attack,
    )
    return { ...item, confirmationFrame: timing.confirmationFrame ?? timing.releaseFrame }
  })
}

export interface FormArtBrief {
  character: string
  fighterId: FighterIdValue
  form: string
  path: string
}

export function formArtBriefs(): FormArtBrief[] {
  return (Object.keys(CHARACTERS) as FighterIdValue[]).flatMap((fighterId) => (
    formsOf(fighterId).map((form) => ({
      character: characterDisplayName(fighterId),
      fighterId,
      form,
      path: form === 'default'
        ? `public/sprites/${fighterId}/`
        : `public/sprites/${fighterId}/${form}/`,
    }))
  ))
}

export function artProgressCounts(): {
  skillsComplete: number
  skillsTotal: number
  normalsComplete: number
  normalsTotal: number
  ultimatesComplete: number
  ultimatesTotal: number
} {
  const skills = allSkillAnimDefs()
  let skillsComplete = 0
  let ultimatesComplete = 0
  for (const def of skills) {
    const has = pngExistsFor(def.fighterId, versusAnimForm(def.fighterId), def.animId)
    if (has) {
      skillsComplete += 1
      if (def.slot === 4) {
        ultimatesComplete += 1
      }
    }
  }
  const normals = allOwnNormalSlots()
  let normalsComplete = 0
  for (const slot of normals) {
    if (pngExistsFor(slot.fighterId, versusAnimForm(slot.fighterId), slot.animId)) {
      normalsComplete += 1
    }
  }
  return {
    skillsComplete,
    skillsTotal: skills.length,
    normalsComplete,
    normalsTotal: normals.length,
    ultimatesComplete,
    ultimatesTotal: Object.keys(CHARACTERS).length,
  }
}

export function vfxBriefFlag(id: string | undefined): 'VFX_READY' | 'VFX_MISSING' {
  return vfxHookFlag(id)
}
