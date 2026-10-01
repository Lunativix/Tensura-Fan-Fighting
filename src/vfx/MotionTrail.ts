import Phaser from 'phaser'
import { FxLayer } from './FxLayers.ts'
import { screenFxEnabled } from '../effects/ScreenFx.ts'
import type { TrailType } from './CombatStyle.ts'

interface Streak {
  rect: Phaser.GameObjects.Rectangle
  life: number
}

export class MotionTrail {
  private readonly streaks: Streak[] = []
  private cursor = 0

  constructor(scene: Phaser.Scene) {
    for (let i = 0; i < 16; i += 1) {
      const rect = scene.add.rectangle(-999, -999, 54, 10, 0xffffff, 0.4)
      rect.setVisible(false).setDepth(FxLayer.TRAIL).setBlendMode(Phaser.BlendModes.ADD)
      this.streaks.push({ rect, life: 0 })
    }
  }

  slash(x: number, y: number, facing: number, color: number, kind: TrailType): void {
    if (!screenFxEnabled()) {
      return
    }
    const count = kind === 'spark' ? 2 : 3
    for (let i = 0; i < count; i += 1) {
      const streak = this.streaks[this.cursor]
      this.cursor = (this.cursor + 1) % this.streaks.length
      if (!streak) {
        continue
      }
      const spread = kind === 'arc' ? (i - 1) * 18 : i * 10
      streak.life = 110 + i * 20
      streak.rect.setPosition(x + facing * (28 + i * 22), y - 28 - spread)
      streak.rect.setFillStyle(color, 0.55)
      streak.rect.setDisplaySize(kind === 'ribbon' ? 70 : 48, kind === 'straight' ? 8 : 12)
      streak.rect.setRotation(facing < 0 ? Math.PI + i * 0.08 : i * 0.08)
      streak.rect.setVisible(true)
      streak.rect.setAlpha(0.5)
    }
  }

  bolt(x: number, y: number, vx: number, color: number): void {
    if (!screenFxEnabled()) {
      return
    }
    const streak = this.streaks[this.cursor]
    this.cursor = (this.cursor + 1) % this.streaks.length
    if (!streak) {
      return
    }
    streak.life = 90
    streak.rect.setPosition(x, y)
    streak.rect.setFillStyle(color, 0.5)
    streak.rect.setDisplaySize(36, 8)
    streak.rect.setRotation(vx < 0 ? Math.PI : 0)
    streak.rect.setVisible(true)
    streak.rect.setAlpha(0.45)
  }

  tick(dt: number): void {
    for (const streak of this.streaks) {
      if (streak.life <= 0) {
        continue
      }
      streak.life -= dt
      streak.rect.setAlpha(Math.max(0, streak.life / 140) * 0.5)
      if (streak.life <= 0) {
        streak.rect.setVisible(false)
      }
    }
  }

  clear(): void {
    for (const streak of this.streaks) {
      streak.life = 0
      streak.rect.setVisible(false)
    }
  }

  destroy(): void {
    this.clear()
    this.streaks.forEach((s) => s.rect.destroy())
  }
}
