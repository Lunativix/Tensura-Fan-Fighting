import type Phaser from 'phaser'
import { session } from '../game/GameState.ts'
import { MAX_DELTA_MS } from './Time.ts'

let visibilityBound = false

export function clampDelta(deltaMs: number): number {
  if (!Number.isFinite(deltaMs) || deltaMs < 0) {
    return 0
  }
  return Math.min(deltaMs, MAX_DELTA_MS)
}

export function installGameLoopGuards(game: Phaser.Game): void {
  if (!visibilityBound) {
    visibilityBound = true
    document.addEventListener('visibilitychange', () => {
      session.hidden = document.hidden
      if (document.hidden) {
        game.loop.sleep()
      } else {
        game.loop.wake()
      }
    })
    window.addEventListener('blur', () => {
      session.hidden = true
    })
    window.addEventListener('focus', () => {
      session.hidden = document.hidden
    })
  }
}

export function pauseGameplay(scene: Phaser.Scene): void {
  session.paused = true
  scene.physics.world.pause()
  scene.time.paused = true
}

export function resumeGameplay(scene: Phaser.Scene): void {
  session.paused = false
  scene.physics.world.resume()
  scene.time.paused = false
}
