import type { FighterIdValue } from '../../types/game.ts'

export const MusicRole = {
  SILENCE: 'SILENCE',
  MENU: 'MENU',
  EXPLORATION: 'EXPLORATION',
  DIALOGUE: 'DIALOGUE',
  BATTLE: 'BATTLE',
  BOSS: 'BOSS',
  CINEMATIC: 'CINEMATIC',
  VICTORY: 'VICTORY',
  DEFEAT: 'DEFEAT',
  STINGER: 'STINGER',
} as const

export type MusicRoleId = (typeof MusicRole)[keyof typeof MusicRole]

export const BattleType = {
  NONE: 'NONE',
  NORMAL: 'NORMAL_BATTLE',
  HARD: 'HARD_BATTLE',
  ELITE: 'ELITE_BATTLE',
  STORY: 'STORY_BATTLE',
  PVE_WAVE: 'PVE_WAVE',
  BOSS: 'BOSS',
  FINAL_BOSS: 'FINAL_BOSS',
} as const

export type BattleTypeId = (typeof BattleType)[keyof typeof BattleType]

export const MusicLayer = {
  BASE: 'BASE',
  PERCUSSION: 'PERCUSSION',
  BRASS: 'BRASS',
  CHOIR: 'CHOIR',
  MOTIF: 'MOTIF',
  CLIMAX: 'CLIMAX',
} as const

export type MusicLayerId = (typeof MusicLayer)[keyof typeof MusicLayer]

export const MusicEvent = {
  BattleStart: 'BattleStart',
  EnemySpawn: 'EnemySpawn',
  BossSpawn: 'BossSpawn',
  BossPhaseChange: 'BossPhaseChange',
  CharacterSwitch: 'CharacterSwitch',
  CharacterDefeated: 'CharacterDefeated',
  LowHP: 'LowHP',
  EnemyLowHP: 'EnemyLowHP',
  SkillUsed: 'SkillUsed',
  Ultimate: 'Ultimate',
  Transformation: 'Transformation',
  StoryEvent: 'StoryEvent',
  Victory: 'Victory',
  Defeat: 'Defeat',
  DialogueStart: 'DialogueStart',
  DialogueEnd: 'DialogueEnd',
} as const

export type MusicEventId = (typeof MusicEvent)[keyof typeof MusicEvent]

export type ScaleId =
  | 'majorPenta'
  | 'minorPenta'
  | 'yo'
  | 'hirajoshi'
  | 'dorian'
  | 'phrygian'
  | 'lydian'
  | 'harmonicMinor'

export interface MusicContext {
  role: MusicRoleId
  arc?: string
  location?: string
  stageId?: string
  battleType?: BattleTypeId
  intensity?: number
  phase?: number
  playerCharacter?: FighterIdValue
  character?: string
  team?: readonly FighterIdValue[]
  enemy?: string
  boss?: string
  storyEvent?: string
  emotionalState?: 'calm' | 'wonder' | 'tension' | 'grief' | 'hope' | 'rage' | 'majesty'
  introAllowed?: boolean
}

export interface CharacterMusicProfile {
  characterId: string
  leitmotiv: string
  battleTheme?: string
  victoryTheme?: string
  cinematicTheme?: string
}

export interface MapMusicProfile {
  location: string
  exploration: string
  combat?: string
  boss?: string
  danger?: string
}

export interface ArcMusicProfile {
  arc: string
  mainTheme: string
  exploration?: string
  battle?: string
  boss?: string
  dramatic?: string
}

export interface LayerPattern {
  id: MusicLayerId
  minIntensity: number
  kind: 'pad' | 'bass' | 'arp' | 'motif' | 'perc' | 'brass' | 'choir'
  /** Scale degrees. 0 = rest. Length 16 = one bar of 16ths. */
  steps: number[]
  octave: number
  gain?: number
}

export interface MusicTrackDef {
  id: string
  title: string
  category: MusicRoleId
  priority: number
  bpm: number
  bars: number
  rootHz: number
  scale: ScaleId
  loopStart: number
  volume: number
  arc?: string
  location?: string
  character?: string
  boss?: string
  battleType?: BattleTypeId
  minIntensity?: number
  phase?: number
  layers: LayerPattern[]
}

export interface MusicResolveResult {
  trackId: string | null
  silence: boolean
  reason: string
}

export interface MusicDebugSnapshot {
  track: string | null
  role: MusicRoleId
  intensity: number
  phase: number
  motif: string
  volume: number
  duck: number
  fading: boolean
}

export interface MusicSettingsSlice {
  battleMusicVolume: number
  cinematicMusicVolume: number
  menuMusicVolume: number
  musicDynamic: boolean
  musicVariation: boolean
}

export const defaultMusicSettings = (): MusicSettingsSlice => ({
  battleMusicVolume: 1,
  cinematicMusicVolume: 1,
  menuMusicVolume: 0.9,
  musicDynamic: true,
  musicVariation: true,
})
