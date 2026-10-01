import { kitFor } from '../../config/skills.ts'
import { AttackKind, type AttackData } from '../Attack.ts'
import type { FighterIdValue } from '../../types/game.ts'
import { skillAnimOf } from './registry.ts'
import { durationFromTiming, timingFromAttack } from './timing.ts'
import { artStatusLabel } from './artStatus.ts'
import type {
  ArtStatus,
  SkillAnimDef,
  SkillAnimSlot,
  SkillTiming,
  SkillVfxHooks,
} from './types.ts'

export interface SkillSlot {
  fighterId: FighterIdValue
  attackId: string
  animId: string
  skillName: string
  slot: SkillAnimSlot
  form: string
  assetPath: string
  formAssetPath: string
  timing: SkillTiming
  vfx: SkillVfxHooks
  projectileInSprite: false
}

export { deriveArtStatus, artStatusLabel } from './artStatus.ts'

export function skillAssetPath(fighterId: FighterIdValue, animId: string): string {
  return `public/sprites/${fighterId}/${animId}/`
}

export function skillFormAssetPath(fighterId: FighterIdValue, form: string, animId: string): string {
  return `public/sprites/${fighterId}/${form}/${animId}/`
}

export function attackOf(fighterId: FighterIdValue, attackId: string): AttackData | undefined {
  const kit = kitFor(fighterId)
  return [...kit.skills, kit.ultimate].find((item) => item.id === attackId)
}

export function timingOf(def: SkillAnimDef, attack: AttackData): SkillTiming {
  return timingFromAttack(attack, def.timing)
}

export function vfxHooksOf(attack: AttackData, def: SkillAnimDef): SkillVfxHooks {
  const travel = attack.kind === AttackKind.PROJECTILE || attack.kind === AttackKind.BEAM
    ? (attack.rangedShape ?? 'projectile')
    : undefined
  return {
    cast: attack.startup >= 8 ? 'energy_charge' : undefined,
    release: attack.vfx,
    travel,
    impact: def.slot === 4 ? 'impact_ultimate' : undefined,
    recovery: undefined,
    ...def.vfx,
  }
}

export function skillSlotOf(
  fighterId: FighterIdValue,
  attackId: string,
  form = 'default',
): SkillSlot | null {
  const def = skillAnimOf(fighterId, attackId)
  const attack = attackOf(fighterId, attackId)
  if (!def || !attack) {
    return null
  }
  return {
    fighterId,
    attackId,
    animId: def.animId,
    skillName: def.skillName,
    slot: def.slot,
    form,
    assetPath: skillAssetPath(fighterId, def.animId),
    formAssetPath: skillFormAssetPath(fighterId, form, def.animId),
    timing: timingOf(def, attack),
    vfx: vfxHooksOf(attack, def),
    projectileInSprite: false,
  }
}

export function durationOf(def: SkillAnimDef, attack: AttackData): number {
  return Math.max(attack.startup + attack.active + attack.recovery, durationFromTiming(timingOf(def, attack)))
}

export function skillDebugLines(input: {
  characterName: string
  form: string
  skillName: string
  animId: string
  artStatus: ArtStatus | null
  frame: number
  timing: SkillTiming | null
  hitboxes: boolean
  tag: string
  totalFrames?: number
  projectile?: boolean
  vfx?: string
  sfx?: string
  camera?: string
  sourceTag?: string
}): string[] {
  const status = input.artStatus ? artStatusLabel(input.artStatus) : '—'
  const t = input.timing
  const phases = t
    ? `startup ${t.startupStart}-${t.startupEnd}  release ${t.releaseFrame}  active ${t.activeStart}-${t.activeEnd}  recovery ${t.recoveryStart}-${t.recoveryEnd}`
    : '—'
  const tag = input.tag ? ` ${input.tag}` : ''
  const extra: string[] = []
  if (input.totalFrames !== undefined) {
    extra.push(`Frames ${Math.floor(input.frame)}/${input.totalFrames}`)
  }
  if (input.sourceTag) {
    extra.push(input.sourceTag)
  }
  if (input.vfx) {
    extra.push(input.vfx)
  }
  if (input.sfx) {
    extra.push(input.sfx)
  }
  if (input.camera) {
    extra.push(input.camera)
  }
  return [
    `Character ${input.characterName}  Form ${input.form}  Skill ${input.skillName}${tag}`,
    `Anim ${input.animId}  Asset ${status}`,
    `Frame ${Math.floor(input.frame)}  ${phases}`,
    `Hitbox ${input.hitboxes ? 'ON' : 'OFF'}`,
    ...extra,
  ]
}
