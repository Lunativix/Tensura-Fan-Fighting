import type Phaser from 'phaser'
import { FxLayer } from './FxLayers.ts'
import { screenFxEnabled, vfxBudget } from '../effects/ScreenFx.ts'

export interface GhostSpawn {
  x: number
  y: number
  facing: number
  color: number
  texture?: string
  frame?: string | number
  scale?: number
  originX?: number
  originY?: number
}

interface Ghost {
  img: Phaser.GameObjects.Image
  life: number
  max: number
}

export class AfterimagePool {
  private readonly ghosts: Ghost[] = []
  private readonly rects: Phaser.GameObjects.Rectangle[]
  private readonly rectLife: number[]
  private cursor = 0
  private readonly scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.rects = []
    this.rectLife = []
    const n = 12
    for (let i = 0; i < n; i += 1) {
      const rect = scene.add.rectangle(-999, -999, 46, 118, 0xffffff, 0.3)
      rect.setVisible(false).setDepth(FxLayer.AFTERIMAGE)
      this.rects.push(rect)
      this.rectLife.push(0)
    }
  }

  spawn(ghost: GhostSpawn, life = 160): void {
    if (!screenFxEnabled()) {
      return
    }
    if (ghost.texture && this.scene.textures.exists(ghost.texture) && this.ghosts.length < Math.min(10, vfxBudget())) {
      this.spawnSprite(ghost, life)
      return
    }
    this.spawnRect(ghost, life)
  }

  tick(dt: number): void {
    for (const g of this.ghosts) {
      if (g.life <= 0) {
        continue
      }
      g.life -= dt
      const t = Math.max(0, g.life / g.max)
      g.img.setAlpha(0.4 * t)
      if (g.life <= 0) {
        g.img.setVisible(false)
      }
    }
    for (let i = 0; i < this.rects.length; i += 1) {
      const life = this.rectLife[i] ?? 0
      if (life <= 0) {
        continue
      }
      const next = life - dt
      this.rectLife[i] = next
      const rect = this.rects[i]
      if (!rect) {
        continue
      }
      rect.setAlpha(Math.max(0, next / 180) * 0.38)
      if (next <= 0) {
        rect.setVisible(false)
      }
    }
  }

  clear(): void {
    for (const g of this.ghosts) {
      g.life = 0
      g.img.setVisible(false)
    }
    for (let i = 0; i < this.rects.length; i += 1) {
      this.rectLife[i] = 0
      this.rects[i]?.setVisible(false)
    }
  }

  destroy(): void {
    this.clear()
    this.ghosts.forEach((g) => g.img.destroy())
    this.rects.forEach((r) => r.destroy())
    this.ghosts.length = 0
  }

  private spawnSprite(ghost: GhostSpawn, life: number): void {
    let slot = this.ghosts.find((g) => g.life <= 0)
    if (!slot) {
      const img = this.scene.add.image(ghost.x, ghost.y, ghost.texture ?? '__DEFAULT')
      img.setDepth(FxLayer.AFTERIMAGE)
      slot = { img, life: 0, max: life }
      this.ghosts.push(slot)
    }
    slot.life = life
    slot.max = life
    slot.img.setTexture(ghost.texture ?? '', ghost.frame ?? 0)
    slot.img.setPosition(ghost.x, ghost.y)
    slot.img.setFlipX(ghost.facing < 0)
    slot.img.setScale(ghost.scale ?? 1)
    slot.img.setOrigin(ghost.originX ?? 0.5, ghost.originY ?? 0.85)
    slot.img.setTint(ghost.color)
    slot.img.setAlpha(0.42)
    slot.img.setVisible(true)
  }

  private spawnRect(ghost: GhostSpawn, life: number): void {
    const rect = this.rects[this.cursor]
    if (!rect) {
      return
    }
    this.rectLife[this.cursor] = life
    this.cursor = (this.cursor + 1) % this.rects.length
    rect.setPosition(ghost.x, ghost.y - 36)
    rect.setFillStyle(ghost.color, 0.36)
    rect.setScale(ghost.facing, 1)
    rect.setVisible(true)
    rect.setAlpha(0.36)
  }
}
