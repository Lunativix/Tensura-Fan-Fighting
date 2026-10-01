import type Phaser from 'phaser'
import type { Fighter } from '../characters/Fighter.ts'
import type { FighterIdValue } from '../types/game.ts'
import type { CinematicCamera } from './CinematicCamera.ts'
import type { CinematicDialogue } from './CinematicDialogue.ts'
import type { CinematicEffects } from './CinematicEffects.ts'
import type { CinematicAudio } from './CinematicAudio.ts'
import type { CinematicContext } from './types.ts'

export interface CinematicApi {
  readonly scene: Phaser.Scene
  readonly camera: CinematicCamera
  readonly dialogue: CinematicDialogue
  readonly fx: CinematicEffects
  readonly audio: CinematicAudio
  readonly ctx: CinematicContext
  player(): Fighter
  cpu(): Fighter
  fighter(id: FighterIdValue): Fighter | null
  freezeFrame(ms: number): void
  slowMotion(scale: number, durationMs: number): void
  letterbox(on: boolean, duration?: number): void
  fireUltimate(who: 'player' | 'cpu'): void
}
