import type { FighterIdValue } from '../../types/game.ts'
import type { StorySaveSlice } from '../types.ts'

export type VisualBody = 'sprite' | 'slime'

/** When this appearance becomes the current one. Story state only — never the reverse. */
export type VisualFrom =
  | { kind: 'start' }
  | { kind: 'missionComplete'; missionId: string }
  | { kind: 'missionStart'; missionId: string }

export type VisualArtStatus = 'present' | 'aliased' | 'missing-period-art'

export interface AppearanceDef {
  id: string
  fighterId: FighterIdValue
  label: string
  /** Name plate / HUD for this period. */
  displayName: string
  from: VisualFrom
  /** Earlier events that must already be true. Blocks a later look on a broken save. */
  requires?: string[]
  body: VisualBody
  portrait: string
  /**
   * If set, combat sprites come from this fighter folder.
   * Used when a later look has no unique sheets yet — never an invented outfit.
   */
  spriteFighterId?: FighterIdValue
  artStatus: VisualArtStatus
  /** Optional unique sprite directory under /sprites. Falls back to fighter id. */
  spriteFolder?: string
  /** Master visual notes (LN first). Empty details = keep previous canon look. */
  reference: string
}

export interface SpeakerAppearanceOverride {
  speaker: string
  appearanceId: string
}

export interface VisualContext {
  story: StorySaveSlice
  missionId?: string
  speaker?: string
}

export interface StoryVisualState {
  /** e.g. IN:shizu_ifrit or AFTER:orc_war */
  moment: string
  missionId: string
  completed: readonly string[]
  appearances: Record<FighterIdValue, AppearanceDef>
}
