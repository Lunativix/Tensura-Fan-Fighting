import type Phaser from 'phaser'
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../engine/Time.ts'
import { FxLayer } from './FxLayers.ts'
import { screenFxEnabled } from '../effects/ScreenFx.ts'

/** Speed lines stay on the frame edges so fighters in the center stay readable. */
export class SpeedLines {
  private readonly gfx: Phaser.GameObjects.Graphics
  private pulse = 0
  private readonly scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.gfx = scene.add.graphics().setScrollFactor(0).setDepth(FxLayer.SPEED_LINES)
  }

  burst(strength = 1): void {
    if (!screenFxEnabled()) {
      return
    }
    this.pulse = Math.max(this.pulse, 140 * strength)
  }

  tick(dt: number): void {
    this.gfx.clear()
    if (this.pulse <= 0) {
      return
    }
    this.pulse -= dt
    const a = Math.min(0.28, this.pulse / 400)
    this.gfx.lineStyle(2, 0xeaf6ff, a)
    const n = 7
    for (let i = 0; i < n; i += 1) {
      const y = 90 + i * ((LOGICAL_HEIGHT - 180) / n) + (this.scene.time.now * 0.2 + i * 17) % 24
      this.gfx.lineBetween(12, y, 160, y + 8)
      this.gfx.lineBetween(LOGICAL_WIDTH - 12, y + 6, LOGICAL_WIDTH - 160, y - 4)
    }
  }

  clear(): void {
    this.pulse = 0
    this.gfx.clear()
  }

  destroy(): void {
    this.gfx.destroy()
  }
}
