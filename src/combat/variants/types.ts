import type { FighterIdValue } from '../../types/game.ts'
import type { VisualFrom } from '../../story/visual/types.ts'

/** Versus / online identity modes. Story fights keep storySkinFor and ignore this. */
export const VariantMode = {
  FREE: 'free',
  CHRONOLOGY: 'chronology',
  CUSTOM: 'custom',
} as const

export type VariantModeId = (typeof VariantMode)[keyof typeof VariantMode]

export const MovesetId = {
  NARRATIVE: 'narrative',
  CUSTOM: 'custom',
} as const

export type MovesetIdValue = (typeof MovesetId)[keyof typeof MovesetId]

/**
 * Playable narrative version of a character.
 * Visuals reuse AppearanceDef + existing form folders. Not a shop tint.
 */
export interface VariantDef {
  id: string
  fighterId: FighterIdValue
  appearanceId: string
  label: string
  /** Story mission that anchors this look in the chronology UI. */
  periodMissionId?: string
  arcId?: string
  unlock: VisualFrom
  /** False for cinematic-only looks (slime / Satoru). Versus combat falls back to roster sheets. */
  selectableInVersus: boolean
  /**
   * Attack ids allowed when moveset is narrative.
   * Omit = full kitFor(fighterId). Never invent later skills for an early look.
   */
  skillAllowlist?: readonly string[]
}

export interface ChronologyPeriod {
  missionId: string
  arcId: string
  title: string
  chronology: number
}

export interface FighterLoadout {
  fighterId: FighterIdValue
  variantId: string
  movesetId: MovesetIdValue
}

export interface VariantMissing {
  variantId: string
  fighterId: FighterIdValue
  missing: string[]
}

export interface RosterIdentity {
  characterId: FighterIdValue
  variantId: string
  movesetId: MovesetIdValue
}

export interface MatchRosterSync {
  variantMode: VariantModeId
  chronologyMissionId: string
  player: RosterIdentity[]
  cpu: RosterIdentity[]
}
