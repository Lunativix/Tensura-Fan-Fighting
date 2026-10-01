import type { AttackKindId } from '../combat/Attack.ts'
import type { FighterIdValue } from '../types/game.ts'

export const SfxBus = {
  SFX: 'sfx',
  LEAD: 'lead',
  UI: 'ui',
  VOICE: 'voice',
  DIALOGUE: 'dialogue',
  ENV: 'env',
} as const

export type SfxBusId = (typeof SfxBus)[keyof typeof SfxBus]

/** Higher wins when voices are stolen. Matches the combat mix order. */
export const SfxPriority = {
  ENV: 1,
  MOVEMENT: 2,
  UI: 3,
  DIALOGUE: 4,
  ATTACK: 4,
  IMPACT: 5,
  SKILL1: 6,
  SKILL2: 7,
  SKILL3: 8,
  SPECIAL: 8,
  SKILL4: 9,
  ULTIMATE: 10,
} as const

export type OscWave = OscillatorType

export interface ToneLayer {
  duration: number
  gain: number
  delay?: number
  wave?: OscWave
  noise?: 'white' | 'brown'
  freq?: number
  freqEnd?: number
  filterType?: BiquadFilterType
  filterFreq?: number
  filterFreqEnd?: number
  q?: number
  attack?: number
  decay?: number
  sustain?: number
  release?: number
  fmRatio?: number
  fmGain?: number
}

export interface SfxRecipe {
  id: string
  bus: SfxBusId
  priority: number
  layers: ToneLayer[]
  maxInstances?: number
  cooldownMs?: number
  duckMs?: number
  duckAmount?: number
}

export interface SkillSfxDef {
  skillId: string
  name: string
  activate: SfxRecipe
  charge?: SfxRecipe
  release: SfxRecipe
  travel?: SfxRecipe
  impact: SfxRecipe
  secondary?: SfxRecipe
  aftermath?: SfxRecipe
}

export interface CharacterAudioProfile {
  id: FighterIdValue
  primary: string
  secondary: string
  energy: string
  impact: string
  movement: string
  defensive: string
  weight: number
  skills: readonly [SkillSfxDef, SkillSfxDef, SkillSfxDef, SkillSfxDef]
  ultimate: SkillSfxDef
  transform: SfxRecipe
  ko: SfxRecipe
  switchIn: SfxRecipe
  talkIds: readonly string[]
}

export interface SfxPlayOpts {
  x?: number
  pitch?: number
  volume?: number
  when?: number
}

export interface CombatSfxContext {
  fighterId: FighterIdValue
  attackId: string
  kind: AttackKindId
  slot: number | null
  power: number
  combo: number
  blocked: boolean
  perfect: boolean
  armored: boolean
  counter: boolean
  airborne: boolean
  grounded: boolean
  killing: boolean
  launcher: boolean
  knockdown: boolean
  flash: boolean
  x: number
  y: number
}

export type AudioCue =
  | 'dash'
  | 'airdash'
  | 'jump'
  | 'land'
  | 'attack'
  | 'skill'
  | 'ultimate'
  | 'interrupt'
  | 'ko'
  | 'guard_start'
  | 'footstep'
