import type Phaser from 'phaser'
import { vfxEngine } from '../vfx/VfxEngine.ts'
import { spawnCharge } from '../effects/EnergyEffect.ts'
import { spawnHitBurst } from '../effects/HitEffect.ts'
import { flashCamera } from '../effects/ScreenEffect.ts'
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../engine/Time.ts'
import { FONT_UI } from '../ui/theme.ts'
import { AssetKeys } from '../assets/AssetKeys.ts'
import { screenFxEnabled } from '../effects/ScreenFx.ts'

export class CinematicEffects {
  private readonly spawned: Phaser.GameObjects.GameObject[] = []
  private bars: Phaser.GameObjects.Rectangle[] = []
  private skipHint: Phaser.GameObjects.Text | null = null
  private titles: Phaser.GameObjects.GameObject[] = []
  private dim: Phaser.GameObjects.Rectangle | null = null
  private readonly scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  track(obj: Phaser.GameObjects.GameObject): void {
    this.spawned.push(obj)
  }

  aura(x: number, y: number, tint = 0x80d8ff): void {
    vfxEngine.play(this.scene, 'AURA', x, y)
    const sheet = vfxEngine.playSheet(this.scene, 'CHARGE_AURA', x, y, { depth: 20, persist: true })
    if (sheet) {
      this.track(sheet)
      this.scene.time.delayedCall(900, () => {
        if (sheet.active) {
          sheet.destroy()
        }
      })
    }
    if (screenFxEnabled()) {
      const sparks = spawnCharge(this.scene, x, y, tint)
      this.track(sparks)
      this.scene.time.delayedCall(700, () => sparks.destroy())
    }
  }

  slash(x: number, y: number): void {
    vfxEngine.play(this.scene, 'HEAVY', x, y)
  }

  impact(x: number, y: number): void {
    spawnHitBurst(this.scene, x, y, 0xfff59d)
    vfxEngine.play(this.scene, 'ULTIMATE', x, y)
    vfxEngine.playSheet(this.scene, 'ULTIMATE_IMPACT', x, y - 40)
  }

  explosion(x: number, y: number): void {
    vfxEngine.play(this.scene, 'EXPLOSION', x, y)
  }

  energy(x: number, y: number): void {
    vfxEngine.play(this.scene, 'ENERGY', x, y)
    vfxEngine.play(this.scene, 'MAGIC', x, y)
  }

  transformBurst(x: number, y: number): void {
    vfxEngine.play(this.scene, 'TRANSFORMATION', x, y)
    const sheet = vfxEngine.playSheet(this.scene, 'TRANSFORM', x, y, { depth: 22, scale: 1.15 })
    if (sheet) {
      this.track(sheet)
    }
  }

  ultimateFlash(x: number, y: number): void {
    vfxEngine.playSheet(this.scene, 'ULTIMATE_FLASH', x, y)
  }

  victoryAura(x: number, y: number): void {
    const sheet = vfxEngine.playSheet(this.scene, 'VICTORY_AURA', x, y, { depth: 18, persist: true })
    if (sheet) {
      this.track(sheet)
    }
  }

  shockwave(x: number, y: number): void {
    const ring = this.scene.add.circle(x, y, 20, 0xffffff, 0)
    ring.setStrokeStyle(6, 0xeaf6ff, 0.85)
    ring.setDepth(24)
    this.track(ring)
    this.scene.tweens.add({
      targets: ring,
      scale: 8,
      alpha: 0,
      duration: 420,
      ease: 'Cubic.Out',
      onComplete: () => ring.destroy(),
    })
  }

  afterimage(x: number, y: number, color: number): void {
    const ghost = this.scene.add.rectangle(x, y - 40, 48, 120, color, 0.35)
    ghost.setDepth(12)
    this.track(ghost)
    this.scene.tweens.add({
      targets: ghost,
      alpha: 0,
      x: x - 40,
      duration: 280,
      onComplete: () => ghost.destroy(),
    })
  }

  dust(x: number, y: number): void {
    if (!screenFxEnabled()) {
      return
    }
    const emitter = this.scene.add.particles(x, y + 50, AssetKeys.particle, {
      speed: { min: 40, max: 120 },
      angle: { min: 240, max: 300 },
      scale: { start: 0.45, end: 0 },
      lifespan: 380,
      tint: 0xcbb99a,
      emitting: false,
    })
    this.track(emitter)
    emitter.explode(8)
    this.scene.time.delayedCall(420, () => {
      if (emitter.active) {
        emitter.destroy()
      }
    })
  }

  flash(duration = 80): void {
    flashCamera(this.scene.cameras.main, duration)
  }

  dimScreen(alpha = 0.35): void {
    this.clearDim()
    this.dim = this.scene.add.rectangle(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, LOGICAL_WIDTH, LOGICAL_HEIGHT, 0x000000, alpha)
    this.dim.setScrollFactor(0).setDepth(70)
    this.track(this.dim)
  }

  clearDim(): void {
    this.dim?.destroy()
    this.dim = null
  }

  letterbox(on: boolean, duration = 240): void {
    if (!on) {
      this.bars.forEach((bar) => {
        this.scene.tweens.add({
          targets: bar,
          displayHeight: 1,
          duration,
          onComplete: () => bar.destroy(),
        })
      })
      this.bars = []
      this.skipHint?.destroy()
      this.skipHint = null
      return
    }
    if (this.bars.length > 0) {
      return
    }
    const top = this.scene.add.rectangle(LOGICAL_WIDTH / 2, 0, LOGICAL_WIDTH, 1, 0x05070c, 1)
    const bot = this.scene.add.rectangle(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT, LOGICAL_WIDTH, 1, 0x05070c, 1)
    top.setOrigin(0.5, 0).setScrollFactor(0).setDepth(72)
    bot.setOrigin(0.5, 1).setScrollFactor(0).setDepth(72)
    this.bars = [top, bot]
    this.scene.tweens.add({ targets: [top, bot], displayHeight: 92, duration, ease: 'Cubic.Out' })
    this.skipHint = this.scene.add.text(LOGICAL_WIDTH - 40, LOGICAL_HEIGHT - 28, 'Enter  SKIP', {
      fontFamily: FONT_UI,
      fontSize: '16px',
      color: '#9ec4e8',
    }).setOrigin(1, 1).setScrollFactor(0).setDepth(78)
  }

  setSkipHint(visible: boolean): void {
    this.skipHint?.setVisible(visible)
  }

  title(text: string, opts?: { y?: number; size?: number; color?: string; duration?: number }): Phaser.GameObjects.Text {
    const label = this.scene.add.text(LOGICAL_WIDTH / 2, opts?.y ?? LOGICAL_HEIGHT / 2, text, {
      fontFamily: FONT_UI,
      fontSize: `${opts?.size ?? 72}px`,
      color: opts?.color ?? '#eaf6ff',
      stroke: '#071018',
      strokeThickness: 8,
      align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(74).setAlpha(0).setScale(0.86)
    this.titles.push(label)
    this.track(label)
    this.scene.tweens.add({
      targets: label,
      alpha: 1,
      scale: 1,
      duration: 180,
      ease: 'Back.Out',
    })
    this.scene.time.delayedCall(opts?.duration ?? 700, () => {
      this.scene.tweens.add({
        targets: label,
        alpha: 0,
        duration: 160,
        onComplete: () => label.destroy(),
      })
    })
    return label
  }

  clear(): void {
    this.bars.forEach((bar) => bar.destroy())
    this.bars = []
    this.skipHint?.destroy()
    this.skipHint = null
    this.clearDim()
    for (const obj of this.spawned) {
      if (obj && obj.active) {
        obj.destroy()
      }
    }
    this.spawned.length = 0
    this.titles.length = 0
  }
}
