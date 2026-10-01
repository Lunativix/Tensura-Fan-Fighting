import { CHARACTERS } from '../../config/characters.ts'
import { AttackKind, type AttackData } from '../Attack.ts'
import type { FighterIdValue } from '../../types/game.ts'
import { timingFromAttack } from './timing.ts'
import type { NormalAnimDef, SkillAnimDef, SkillAnimSlot, SkillFrameEvent, SkillTiming } from './types.ts'

function def(
  fighterId: FighterIdValue,
  attackId: string,
  animId: string,
  skillName: string,
  slot: SkillAnimSlot,
): SkillAnimDef {
  return { fighterId, attackId, animId, skillName, slot }
}

const SKILLS: SkillAnimDef[] = [
  {
    ...def('rimuru', 'water-blade', 'rimuru_water_blade', 'Water Blade', 0),
    extraEvents: [
      { frame: 8, kind: 'camera', camera: 'light' },
    ],
  },
  def('rimuru', 'black-lightning', 'rimuru_black_lightning', 'Black Lightning', 1),
  def('rimuru', 'predator', 'rimuru_predator', 'Predator', 2),
  def('rimuru', 'megiddo', 'rimuru_megiddo', 'Megiddo', 3),
  def('rimuru', 'rimuru-ult', 'rimuru_beelzebuth', 'Beelzebuth', 4),

  def('milim', 'dragon-fist', 'milim_dragon_fist', 'Dragon Fist', 0),
  def('milim', 'magic-missile', 'milim_magic_missile', 'Magic Missile', 1),
  def('milim', 'milim-kick', 'milim_milim_kick', 'Milim Kick', 2),
  def('milim', 'dragon-nova', 'milim_dragon_nova', 'Dragon Nova', 3),
  def('milim', 'milim-ult', 'milim_drago_buster', 'Drago Buster', 4),

  def('diablo', 'end-of-world', 'diablo_end_of_world', 'End of World', 0),
  def('diablo', 'tempter', 'diablo_tempter_counter', 'Tempter Counter', 1),
  def('diablo', 'dark-nova', 'diablo_dark_nova', 'Dark Nova', 2),
  def('diablo', 'demon-lord', 'diablo_demon_form', 'Demon Form', 3),
  def('diablo', 'diablo-ult', 'diablo_azazel', 'Azazel', 4),

  def('benimaru', 'flame-slash', 'benimaru_flame_slash', 'Flame Slash', 0),
  def('benimaru', 'hellflare', 'benimaru_hellflare', 'Hellflare', 1),
  def('benimaru', 'ogre-rush', 'benimaru_ogre_rush', 'Ogre Rush', 2),
  def('benimaru', 'black-flame', 'benimaru_black_flame', 'Black Flame', 3),
  def('benimaru', 'benimaru-ult', 'benimaru_prominence', 'Prominence', 4),

  def('shion', 'cleaver', 'shion_chef_cleaver', 'Chef Cleaver', 0),
  def('shion', 'cook', 'shion_cook_throw', 'Cook Throw', 1),
  def('shion', 'berserk', 'shion_berserk', 'Berserk', 2),
  def('shion', 'ground-break', 'shion_ground_break', 'Ground Break', 3),
  def('shion', 'shion-ult', 'shion_tempest_fury', 'Tempest Fury', 4),

  def('veldora', 'storm', 'veldora_storm_breath', 'Storm Breath', 0),
  def('veldora', 'dragon-tail', 'veldora_dragon_tail', 'Dragon Tail', 1),
  def('veldora', 'thunder', 'veldora_death_heralding_wind', 'Death-Heralding Wind', 2),
  def('veldora', 'roar', 'veldora_storm_roar', 'Storm Roar', 3),
  def('veldora', 'veldora-ult', 'veldora_storm_dragon', 'Storm Dragon', 4),

  def('hinata', 'holy-cut', 'hinata_holy_cut', 'Holy Cut', 0),
  def('hinata', 'melt-slash', 'hinata_melt_slash', 'Melt Slash', 1),
  def('hinata', 'disintegration', 'hinata_disintegration', 'Disintegration', 2),
  def('hinata', 'faith', 'hinata_faith_guard', 'Faith Guard', 3),
  def('hinata', 'hinata-ult', 'hinata_chrono_saltation', 'Chrono-Saltation', 4),

  def('guy', 'pride-cut', 'guy_pride_cut', 'Pride Cut', 0),
  def('guy', 'crimson', 'guy_crimson_magic', 'Crimson Magic', 1),
  def('guy', 'dominate', 'guy_dominate', 'Dominate', 2),
  def('guy', 'lord', 'guy_true_dragon_lord', 'True Dragon Lord', 3),
  def('guy', 'guy-ult', 'guy_world_ruin', 'World Ruin', 4),

  def('shuna', 'holy-flame', 'shuna_holy_flame', 'Holy Flame', 0),
  def('shuna', 'barrier', 'shuna_barrier', 'Barrier', 1),
  def('shuna', 'bless', 'shuna_blessing', 'Blessing', 2),
  def('shuna', 'purify', 'shuna_purify', 'Purify', 3),
  def('shuna', 'shuna-ult', 'shuna_temple_light', 'Temple Light', 4),

  def('souei', 'shadow-stab', 'souei_shadow_blade', 'Shadow Blade', 0),
  def('souei', 'clone', 'souei_clone_dash', 'Clone Dash', 1),
  def('souei', 'kunai', 'souei_shadow_kunai', 'Shadow Kunai', 2),
  def('souei', 'assassinate', 'souei_assassinate', 'Assassinate', 3),
  def('souei', 'souei-ult', 'souei_death_shadow', 'Death Shadow', 4),

  def('hakurou', 'iai', 'hakurou_iai', 'Iai', 0),
  def('hakurou', 'form-two', 'hakurou_second_form', 'Second Form', 1),
  def('hakurou', 'parry', 'hakurou_sword_parry', 'Sword Parry', 2),
  def('hakurou', 'secret', 'hakurou_secret_art', 'Secret Art', 3),
  def('hakurou', 'hakurou-ult', 'hakurou_moon_fang', 'Moon Fang', 4),
]

const BY_ATTACK = new Map<string, SkillAnimDef>()
for (const item of SKILLS) {
  BY_ATTACK.set(`${item.fighterId}::${item.attackId}`, item)
}

function normalSet(
  fighterId: FighterIdValue,
  source: NormalAnimDef['source'],
): NormalAnimDef {
  const prefix = source === 'own' ? fighterId : source === 'fallback-rimuru' ? 'rimuru' : 'milim'
  return {
    fighterId,
    source,
    light1: `${prefix}_light_1`,
    light2: `${prefix}_light_2`,
    light3: `${prefix}_light_3`,
    medium: `${prefix}_medium`,
    heavy: `${prefix}_heavy`,
    airLight: `${prefix}_air_light`,
    airHeavy: `${prefix}_air_heavy`,
    downLight: `${prefix}_down_light`,
  }
}

const NORMALS: Record<FighterIdValue, NormalAnimDef> = {
  rimuru: normalSet('rimuru', 'own'),
  milim: normalSet('milim', 'own'),
  diablo: normalSet('diablo', 'fallback-rimuru'),
  benimaru: normalSet('benimaru', 'fallback-milim'),
  shion: normalSet('shion', 'fallback-milim'),
  veldora: normalSet('veldora', 'fallback-milim'),
  hinata: normalSet('hinata', 'fallback-rimuru'),
  guy: normalSet('guy', 'fallback-milim'),
  shuna: normalSet('shuna', 'fallback-rimuru'),
  souei: normalSet('souei', 'fallback-rimuru'),
  hakurou: normalSet('hakurou', 'fallback-rimuru'),
}

const warnedNormals = new Set<string>()

export function allSkillAnimDefs(): readonly SkillAnimDef[] {
  return SKILLS
}

export function skillAnimDefsOf(fighterId: FighterIdValue): SkillAnimDef[] {
  return SKILLS.filter((item) => item.fighterId === fighterId)
}

export function skillAnimOf(fighterId: FighterIdValue, attackId: string): SkillAnimDef | undefined {
  return BY_ATTACK.get(`${fighterId}::${attackId}`)
}

export function slotForAttack(fighterId: FighterIdValue, attack: AttackData): SkillAnimSlot | null {
  const found = skillAnimOf(fighterId, attack.id)
  if (found) {
    return found.slot
  }
  if (attack.kind === AttackKind.ULTIMATE) {
    return 4
  }
  return null
}

export function characterDisplayName(fighterId: FighterIdValue): string {
  return CHARACTERS[fighterId]?.name ?? fighterId
}

export function normalsOf(fighterId: FighterIdValue): NormalAnimDef {
  const set = NORMALS[fighterId]
  if (set.source !== 'own' && !warnedNormals.has(fighterId)) {
    warnedNormals.add(fighterId)
    console.warn(
      `[MISSING NORMAL ANIMATIONS] Character: ${characterDisplayName(fighterId)} using ${set.source} until unique clips exist`,
    )
  }
  return set
}

export const NORMAL_CLIP_SUFFIXES = [
  'light_1',
  'light_2',
  'light_3',
  'medium',
  'heavy',
  'air_light',
  'air_heavy',
  'down_light',
] as const

export function ownNormalAnimIds(fighterId: FighterIdValue): string[] {
  return NORMAL_CLIP_SUFFIXES.map((suffix) => `${fighterId}_${suffix}`)
}

export function allOwnNormalSlots(): { fighterId: FighterIdValue, animId: string }[] {
  return (Object.keys(NORMALS) as FighterIdValue[]).flatMap((fighterId) => (
    ownNormalAnimIds(fighterId).map((animId) => ({ fighterId, animId }))
  ))
}

export function expectedAnimIds(): string[] {
  return SKILLS.map((item) => item.animId)
}

export function defaultSkillEvents(
  attack: AttackData,
  slot: SkillAnimSlot,
  timing?: SkillTiming,
): SkillFrameEvent[] {
  const release = timing?.releaseFrame ?? timingFromAttack(attack).releaseFrame
  const events: SkillFrameEvent[] = [
    { frame: 0, kind: 'sfx', sfx: 'charge' },
    { frame: release, kind: 'sfx', sfx: 'cast' },
    { frame: release, kind: 'vfx', vfx: attack.vfx ?? (slot >= 3 ? 'energy_burst' : 'energy_charge') },
  ]
  if (attack.startup >= 8) {
    events.push({ frame: 0, kind: 'vfx', vfx: 'energy_charge' })
  }
  if (attack.kind === AttackKind.PROJECTILE || attack.kind === AttackKind.BEAM) {
    events.push({ frame: release, kind: 'spawn' })
  }
  if (slot === 4) {
    events.push({ frame: Math.max(0, release), kind: 'camera', camera: 'ultimate' })
  } else if (slot === 3) {
    events.push({ frame: release, kind: 'camera', camera: 'heavy' })
  } else if (slot === 2) {
    events.push({ frame: release, kind: 'camera', camera: 'medium' })
  }
  return events
}
