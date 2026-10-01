import type Phaser from 'phaser'
import type { Fighter } from '../characters/Fighter.ts'
import type { FighterIdValue } from '../types/game.ts'
import type { CinematicApi } from './CinematicApi.ts'

export type CinematicPhase = 'idle' | 'start' | 'running' | 'end'

export interface CinematicContext {
  attacker?: Fighter
  target?: Fighter
  attackerId?: FighterIdValue
  targetId?: FighterIdValue
  playerTeam: FighterIdValue[]
  cpuTeam: FighterIdValue[]
  winner?: Fighter
}

export interface CinematicHost {
  scene: Phaser.Scene
  getPlayer: () => Fighter
  getCpu: () => Fighter
  playerTeam: () => FighterIdValue[]
  cpuTeam: () => FighterIdValue[]
  fireUltimate: (who: 'player' | 'cpu') => void
  applyTransform: (who: 'player' | 'cpu') => void
}

export interface CinematicStep {
  at: number
  run: (api: CinematicApi) => void
}

export interface CinematicDef {
  id: string
  duration: number
  skippable?: boolean
  /** Combat follow-up applied after skip/end (e.g. the actual Ultimate). */
  commit?: 'ultimate' | 'transform'
  steps: CinematicStep[]
}

export type CinematicFactory = (ctx: CinematicContext) => CinematicDef
