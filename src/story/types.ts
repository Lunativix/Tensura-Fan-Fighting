import type { DialogueEmotionId } from '../dialogue/DialogueTypes.ts'
import type { FighterIdValue } from '../types/game.ts'

export const StoryRole = {
  PLAYABLE: 'playable',
  ALLY_AI: 'ally_ai',
  ENEMY_AI: 'enemy_ai',
  BOSS: 'boss',
  NPC: 'npc',
  CINEMATIC_ONLY: 'cinematic_only',
} as const

export type StoryRoleId = (typeof StoryRole)[keyof typeof StoryRole]

export const StorySource = {
  LN: 'light-novel',
  MANGA: 'manga',
  ANIME: 'anime',
} as const

export type StorySourceId = (typeof StorySource)[keyof typeof StorySource]

export interface StoryArcDef {
  id: string
  title: string
  chronology: number
  summary: string
  source: StorySourceId
  location?: string
}

export interface StoryUnlocks {
  skills?: string[]
  characters?: string[]
  stages?: string[]
  archives?: string[]
  tutorials?: string[]
}

export type StoryBeat =
  | { type: 'title'; text: string; sub?: string; ms?: number }
  | {
    type: 'dialogue'
    speaker: string
    speakerId?: FighterIdValue
    portrait?: string
    text: string
    emotion?: DialogueEmotionId
  }
  | { type: 'narration'; text: string }
  | { type: 'hint'; text: string }
  | { type: 'wait'; input: 'move' | 'attack' | 'skill1' | 'guard' | 'dash' | 'jump' }
  | { type: 'spawn'; enemy: string; x: number; y?: number }
  | { type: 'clear' }
  | { type: 'goto'; x: number; hint?: string }
  | { type: 'heal' }
  | { type: 'unlock'; unlocks: StoryUnlocks }
  | { type: 'presence'; who: StoryPresenceId }
  | { type: 'transform'; who: FighterIdValue; appearanceId: string }
  | { type: 'complete' }

export type StoryPresenceId = 'none' | 'veldora' | 'benimaru' | 'shion' | 'milim' | 'diablo' | 'guy'

export interface StoryMissionDef {
  id: string
  title: string
  arc: string
  chronology: number
  location: string
  stageId: string
  summary: string
  source: StorySourceId
  playable: boolean
  playableCharacter: FighterIdValue
  objectives: string[]
  beats: StoryBeat[]
  rewards: { xp: number; coins: number }
  unlocks: StoryUnlocks
}

export interface StorySaveSlice {
  missionId: string
  /** Completed missions. Source of truth for visual continuity. Never store a separate "future look". */
  completed: string[]
  unlockedSkills: string[]
  unlockedCharacters: string[]
  unlockedStages: string[]
  archives: string[]
  tutorials: string[]
  seenCinematics: string[]
}

export function defaultStorySave(): StorySaveSlice {
  return {
    missionId: 'prologue_reincarnation',
    completed: [],
    unlockedSkills: [],
    unlockedCharacters: ['rimuru'],
    unlockedStages: ['sealed_cave'],
    archives: [],
    tutorials: [],
    seenCinematics: [],
  }
}

export const PveProfile = {
  PASSIVE: 'passive',
  DEFENSIVE: 'defensive',
  AGGRESSIVE: 'aggressive',
  RANGED: 'ranged',
  SWARM: 'swarm',
  BOSS: 'boss',
} as const

export type PveProfileId = (typeof PveProfile)[keyof typeof PveProfile]

export interface PveEnemyDef {
  id: string
  name: string
  species: string
  source: StorySourceId
  hp: number
  damage: number
  defense: number
  speed: number
  knockback: number
  profile: PveProfileId
  tint: number
  width: number
  height: number
  /** Placeholder visuel jusqu'au sprite canon. */
  asset: 'TODO_ASSET'
}
