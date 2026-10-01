import type Phaser from 'phaser'
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../engine/Time.ts'

export function drawMenuBackdrop(scene: Phaser.Scene): void {
  const g = scene.add.graphics()
  g.fillGradientStyle(0x07101c, 0x07101c, 0x123056, 0x1a1540, 1)
  g.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT)
  g.lineStyle(2, 0x4fc3f7, 0.15)
  for (let i = 0; i < 18; i += 1) {
    const y = 80 + i * 56
    g.lineBetween(0, y, LOGICAL_WIDTH, y)
  }
  g.fillStyle(0x4fc3f7, 0.08)
  g.fillTriangle(0, LOGICAL_HEIGHT, 520, LOGICAL_HEIGHT, 0, 420)
  g.fillStyle(0xff6b9d, 0.07)
  g.fillTriangle(LOGICAL_WIDTH, 0, LOGICAL_WIDTH - 640, 0, LOGICAL_WIDTH, 520)
}
