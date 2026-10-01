import type Phaser from 'phaser'
import { AssetKeys } from '../assets/AssetKeys.ts'

export function spawnHitBurst(scene: Phaser.Scene, x: number, y: number, tint: number): void {
  const emitter = scene.add.particles(x, y, AssetKeys.particle, {
    speed: { min: 80, max: 220 },
    scale: { start: 0.5, end: 0 },
    lifespan: 280,
    tint,
    blendMode: 'ADD',
    emitting: false,
  })
  emitter.explode(10)
  scene.time.delayedCall(360, () => {
    if (emitter.active) {
      emitter.destroy()
    }
  })
}
