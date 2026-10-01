import { GameFlow, type GameFlowId } from '../types/game.ts'

export class CinematicState {
  phase: 'idle' | 'start' | 'running' | 'end' = 'idle'
  tweenScale = 1
  animScale = 1
  musicVolume = 0
  physicsPaused = false
  flowBefore: GameFlowId = GameFlow.FIGHT

  get busy(): boolean {
    return this.phase !== 'idle'
  }

  reset(): void {
    this.phase = 'idle'
    this.tweenScale = 1
    this.animScale = 1
  }
}
