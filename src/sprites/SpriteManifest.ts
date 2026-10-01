import { FighterId, type FighterIdValue } from '../types/game.ts'
import { FighterState, type FighterStateId } from '../combat/FighterState.ts'

export interface SpriteAnimDef {
  start: number
  end: number
  frameRate?: number
  repeat?: number
}

export type ActionClip =
  | 'idle'
  | 'walk'
  | 'run'
  | 'jump'
  | 'fall'
  | 'dash'
  | 'attack'
  | 'skill'
  | 'ultimate'
  | 'block'
  | 'hit'
  | 'knockdown'
  | 'getup'
  | 'dead'
  | 'switch_in'
  | 'switch_out'

export const ACTION_FOLDERS: ActionClip[] = [
  'idle',
  'walk',
  'run',
  'jump',
  'fall',
  'dash',
  'attack',
  'skill',
  'ultimate',
  'block',
  'hit',
  'knockdown',
  'getup',
  'dead',
  'switch_in',
  'switch_out',
]

export const LOOPING_CLIPS = new Set<string>(['idle', 'walk', 'run', 'block'])

export const CLIP_ALIASES: Record<string, ActionClip> = {
  melee: 'attack',
  punch: 'attack',
  stun: 'hit',
  transform: 'ultimate',
  switchin: 'switch_in',
  switchout: 'switch_out',
}

export interface SpriteManifest {
  fighterId: string
  image?: string
  atlas?: string
  melee?: string[]
  clips?: Partial<Record<string, string[]>>
  frameRate?: number
  frameWidth?: number
  frameHeight?: number
  scale?: number
  originX?: number
  originY?: number
  animations?: Partial<Record<string, SpriteAnimDef>>
}

export const STATE_TO_CLIP: Record<FighterStateId, string> = {
  [FighterState.IDLE]: 'idle',
  [FighterState.WALK]: 'walk',
  [FighterState.RUN]: 'run',
  [FighterState.JUMP]: 'jump',
  [FighterState.FALL]: 'fall',
  [FighterState.DASH]: 'dash',
  [FighterState.ATTACK]: 'attack',
  [FighterState.BLOCK]: 'block',
  [FighterState.HIT]: 'hit',
  [FighterState.STUN]: 'hit',
  [FighterState.KNOCKDOWN]: 'knockdown',
  [FighterState.GETUP]: 'getup',
  [FighterState.SKILL]: 'skill',
  [FighterState.ULTIMATE]: 'ultimate',
  [FighterState.TRANSFORM]: 'ultimate',
  [FighterState.DEAD]: 'dead',
}

export function spriteSheetKey(id: FighterIdValue): string {
  return `fighter-sheet-${id}`
}

export function spritePackKey(id: FighterIdValue, clip: string): string {
  return `fighter-pack-${id}-${clip}`
}

export function spriteFrameKey(id: FighterIdValue, clip: string, index: number): string {
  return `fighter-frame-${id}-${clip}-${index}`
}

export function spriteAnimKey(id: FighterIdValue, clip: string): string {
  return `fighter-${id}-${clip}`
}

export function spriteFolder(id: FighterIdValue): string {
  return `/sprites/${id}`
}

export function clipFileCount(man: SpriteManifest, clip: string): number {
  return man.clips?.[clip]?.length ?? 0
}

export function hasActionFrames(man: SpriteManifest): boolean {
  if (!man.clips) {
    return false
  }
  return Object.values(man.clips).some((files) => (files?.length ?? 0) > 0)
}

export function hasMeleeFrames(man: SpriteManifest): boolean {
  return clipFileCount(man, 'attack') > 0 || (man.melee?.length ?? 0) > 0
}

export const SPRITE_FIGHTER_IDS: FighterIdValue[] = Object.values(FighterId)
