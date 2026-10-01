import { kitFor, type FighterKit } from '../../config/skills.ts'
import { appearanceById } from '../../story/visual/catalog.ts'
import { appearanceFor, rosterAppearanceFor } from '../../story/visual/resolve.ts'
import { isCinematicOnlyForm, versusAnimForm } from '../anim/forms.ts'
import type { SkinBody } from '../../config/characterSkins.ts'
import type { StorySaveSlice } from '../../story/types.ts'
import type { FighterIdValue } from '../../types/game.ts'
import { rosterVariantOf, variantById, variantsOf } from './catalog.ts'
import { DEFAULT_CHRONOLOGY_MISSION, storySliceAtPeriod } from './timeline.ts'
import {
  MovesetId,
  VariantMode,
  type FighterLoadout,
  type MatchRosterSync,
  type MovesetIdValue,
  type VariantDef,
  type VariantModeId,
} from './types.ts'

export function cycleMode(mode: VariantModeId, dir: 1 | -1 = 1): VariantModeId {
  const order: VariantModeId[] = [VariantMode.FREE, VariantMode.CHRONOLOGY, VariantMode.CUSTOM]
  const index = Math.max(0, order.indexOf(mode))
  return order[(index + dir + order.length) % order.length] ?? VariantMode.FREE
}

export function variantForPeriod(fighterId: FighterIdValue, missionId: string): VariantDef {
  const look = appearanceFor(fighterId, {
    story: storySliceAtPeriod(missionId),
    missionId,
  })
  return variantById(look.id) ?? rosterVariantOf(fighterId)
}

export function isVariantUnlocked(
  variant: VariantDef,
  story: StorySaveSlice,
  collectionAppearances: readonly string[] = [],
): boolean {
  if (variant.unlock.kind === 'start') {
    return true
  }
  const missionId = variant.unlock.missionId
  if (story.completed.includes(missionId) || collectionAppearances.includes(variant.id)) {
    return true
  }
  return rosterAppearanceFor(variant.fighterId).id === variant.id
}

export function selectableVariants(
  fighterId: FighterIdValue,
  mode: VariantModeId,
  story: StorySaveSlice,
  collectionAppearances: readonly string[] = [],
  chronologyMissionId = DEFAULT_CHRONOLOGY_MISSION,
): VariantDef[] {
  const all = variantsOf(fighterId)
  if (mode === VariantMode.CHRONOLOGY) {
    return [variantForPeriod(fighterId, chronologyMissionId)]
  }
  return all.filter((item) => item.selectableInVersus && isVariantUnlocked(item, story, collectionAppearances))
}

export function cycleSelectableVariant(
  fighterId: FighterIdValue,
  currentId: string,
  dir: 1 | -1,
  opts: {
    mode: VariantModeId
    chronologyMissionId?: string
    story: StorySaveSlice
    collectionAppearances?: readonly string[]
  },
): VariantDef {
  const list = selectableVariants(
    fighterId,
    opts.mode,
    opts.story,
    opts.collectionAppearances,
    opts.chronologyMissionId,
  )
  if (list.length === 0) {
    return rosterVariantOf(fighterId)
  }
  const index = Math.max(0, list.findIndex((item) => item.id === currentId))
  return list[(index + dir + list.length) % list.length] ?? list[0]!
}

export function resolveLoadout(
  fighterId: FighterIdValue,
  opts: {
    mode: VariantModeId
    chronologyMissionId?: string
    pick?: Partial<FighterLoadout> | null
    story: StorySaveSlice
    collectionAppearances?: readonly string[]
  },
): FighterLoadout {
  const period = opts.chronologyMissionId ?? DEFAULT_CHRONOLOGY_MISSION
  if (opts.mode === VariantMode.CHRONOLOGY) {
    const variant = variantForPeriod(fighterId, period)
    return { fighterId, variantId: variant.id, movesetId: MovesetId.NARRATIVE }
  }
  const allowed = selectableVariants(fighterId, opts.mode, opts.story, opts.collectionAppearances, period)
  const picked = opts.pick?.variantId ? variantById(opts.pick.variantId) : undefined
  const variant = picked && allowed.some((item) => item.id === picked.id)
    ? picked
    : allowed.find((item) => item.id === rosterVariantOf(fighterId).id) ?? allowed[allowed.length - 1] ?? rosterVariantOf(fighterId)
  const moveset: MovesetIdValue = opts.mode === VariantMode.CUSTOM
    ? (opts.pick?.movesetId === MovesetId.CUSTOM ? MovesetId.CUSTOM : MovesetId.NARRATIVE)
    : MovesetId.NARRATIVE
  return { fighterId, variantId: variant.id, movesetId: moveset }
}

export function loadoutsForTeam(
  ids: readonly FighterIdValue[],
  existing: readonly FighterLoadout[] | undefined,
  opts: Parameters<typeof resolveLoadout>[1],
): FighterLoadout[] {
  return ids.map((id, index) => {
    const prev = existing?.[index]
    return resolveLoadout(id, { ...opts, pick: prev?.fighterId === id ? prev : null })
  })
}

export function allowedAttackIds(loadout: FighterLoadout): readonly string[] | null {
  if (loadout.movesetId === MovesetId.CUSTOM) {
    return null
  }
  const variant = variantById(loadout.variantId)
  return variant?.skillAllowlist ?? null
}

export function attackIsAllowed(loadout: FighterLoadout, attackId: string): boolean {
  const allowed = allowedAttackIds(loadout)
  return !allowed || allowed.includes(attackId)
}

/** Full kit always. Chronology gates via attackIsAllowed, not by shrinking FighterKit. */
export function kitForLoadout(loadout: FighterLoadout): FighterKit {
  return kitFor(loadout.fighterId)
}

export function versusSpawnOpts(loadout: FighterLoadout): { body: SkinBody, form: string } {
  const variant = variantById(loadout.variantId) ?? rosterVariantOf(loadout.fighterId)
  const appearance = appearanceById(variant.appearanceId)
  if (!appearance || isCinematicOnlyForm(appearance.id) || appearance.body !== 'sprite') {
    return { body: 'sprite', form: versusAnimForm(loadout.fighterId) }
  }
  return { body: appearance.body, form: appearance.id }
}

export function versusFighterOpts(loadout: FighterLoadout): {
  body: SkinBody
  form: string
  allowedAttackIds: readonly string[] | null
} {
  return {
    ...versusSpawnOpts(loadout),
    allowedAttackIds: allowedAttackIds(loadout),
  }
}

export function rosterSyncPayload(
  mode: VariantModeId,
  chronologyMissionId: string,
  player: readonly FighterLoadout[],
  cpu: readonly FighterLoadout[],
): MatchRosterSync {
  const toIdentity = (item: FighterLoadout) => ({
    characterId: item.fighterId,
    variantId: item.variantId,
    movesetId: item.movesetId,
  })
  return {
    variantMode: mode,
    chronologyMissionId,
    player: player.map(toIdentity),
    cpu: cpu.map(toIdentity),
  }
}
