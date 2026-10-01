import type { CameraImpactLevel } from '../feel/CameraImpact.ts'
import type { FighterIdValue } from '../../types/game.ts'
import type { ArtStatus, ArtPipelineStage } from './artStatus.ts'

export type { ArtStatus, ArtPipelineStage }

export type SkillAnimSlot = 0 | 1 | 2 | 3 | 4

export type SkillAnimSource = 'png' | 'missing'

export type SkillSfxCue = 'charge' | 'cast' | 'travel' | 'impact' | 'recovery'

export interface SkillTiming {
  startupStart: number
  startupEnd: number
  releaseFrame: number
  activeStart: number
  activeEnd: number
  impactFrame: number
  recoveryStart: number
  recoveryEnd: number
  /** After confirmationFrame, Ultimate is quasi-inevitable (super armor, target lock). */
  confirmationFrame?: number
}

export interface SkillVfxHooks {
  cast?: string
  release?: string
  travel?: string
  impact?: string
  recovery?: string
}

export interface SkillFrameEvent {
  frame: number
  kind: 'vfx' | 'sfx' | 'spawn' | 'camera'
  vfx?: string
  sfx?: SkillSfxCue
  camera?: CameraImpactLevel
}

export interface SkillAnimDef {
  fighterId: FighterIdValue
  attackId: string
  animId: string
  skillName: string
  slot: SkillAnimSlot
  /** Extra frame events on top of startup spawn / charge defaults. */
  extraEvents?: SkillFrameEvent[]
  /** Overlay on AttackData-derived timing. Easy to retouch when real frames arrive. */
  timing?: Partial<SkillTiming>
  vfx?: SkillVfxHooks
}

export interface NormalAnimDef {
  fighterId: FighterIdValue
  source: 'own' | 'fallback-rimuru' | 'fallback-milim'
  light1: string
  light2: string
  light3: string
  medium: string
  heavy: string
  airLight: string
  airHeavy: string
  downLight: string
}

export interface SkillAnimResolution {
  fighterId: FighterIdValue
  characterName: string
  form: string
  attackId: string
  skillName: string
  animId: string
  slot: SkillAnimSlot
  /** Phaser / folder clip key when PNG exists. Never `skill` or `attack`. */
  clipKey: string | null
  source: SkillAnimSource
  artStatus: ArtStatus
  timing: SkillTiming
  executionFrame: number
  /** startup + active + recovery — PNG playback is stretched to this. */
  durationFrames: number
  events: SkillFrameEvent[]
}

export interface SkillPlayback {
  animId: string
  clipKey: string | null
  missing: boolean
  form: string
  skillName: string
  durationFrames: number
  artStatus: ArtStatus
  characterName: string
}

export interface ResolveClipFn {
  (fighterId: FighterIdValue, clipKey: string): boolean
}
