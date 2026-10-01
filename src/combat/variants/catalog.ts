import { FighterId, type FighterIdValue } from '../../types/game.ts'
import { APPEARANCES } from '../../story/visual/catalog.ts'
import { isCinematicOnlyForm } from '../anim/forms.ts'
import type { VariantDef } from './types.ts'

/**
 * Documented versus skill gates only. Water Blade + Predator are in the cave catalog.
 * Beelzebuth belongs to the Harvest Festival look. Do not invent other period kits.
 */
const RIMURU_EARLY_SKILLS = ['water-blade', 'predator'] as const

function skillAllowlistFor(appearanceId: string): readonly string[] | undefined {
  if (appearanceId === 'rimuru-satoru' || appearanceId === 'rimuru-slime') {
    return RIMURU_EARLY_SKILLS
  }
  if (appearanceId === 'rimuru-shizu') {
    return RIMURU_EARLY_SKILLS
  }
  return undefined
}

function periodMissionOf(from: VariantDef['unlock']): string | undefined {
  if (from.kind === 'start') {
    return undefined
  }
  return from.missionId
}

export const VARIANTS: VariantDef[] = APPEARANCES.map((look) => ({
  id: look.id,
  fighterId: look.fighterId,
  appearanceId: look.id,
  label: look.label,
  periodMissionId: periodMissionOf(look.from),
  unlock: look.from,
  selectableInVersus: !isCinematicOnlyForm(look.id),
  skillAllowlist: look.fighterId === FighterId.rimuru ? skillAllowlistFor(look.id) : undefined,
}))

export function variantsOf(fighterId: FighterIdValue): VariantDef[] {
  return VARIANTS.filter((item) => item.fighterId === fighterId)
}

export function variantById(id: string): VariantDef | undefined {
  return VARIANTS.find((item) => item.id === id)
}

export function rosterVariantOf(fighterId: FighterIdValue): VariantDef {
  const list = variantsOf(fighterId)
  const selectable = list.filter((item) => item.selectableInVersus)
  return selectable[selectable.length - 1] ?? list[0]!
}
