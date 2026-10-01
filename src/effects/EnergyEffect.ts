import type Phaser from 'phaser'
import { AssetKeys } from '../assets/AssetKeys.ts'

export function spawnCharge(scene: Phaser.Scene, x: number, y: number, tint: number): Phaser.GameObjects.Particles.ParticleEmitter {
  return scene.add.particles(x, y, AssetKeys.particle, {
    speed: { min: 10, max: 40 },
    scale: { start: 0.4, end: 0 },
    lifespan: 500,
    frequency: 30,
    tint,
    blendMode: 'ADD',
  })
}
