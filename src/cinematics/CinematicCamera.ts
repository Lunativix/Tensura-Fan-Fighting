import type Phaser from 'phaser'
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../engine/Time.ts'

interface CamSnap {
  scrollX: number
  scrollY: number
  zoom: number
}

export class CinematicCamera {
  private snap: CamSnap | null = null
  private tweens: Phaser.Tweens.Tween[] = []
  private readonly scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  capture(): void {
    const cam = this.scene.cameras.main
    this.snap = { scrollX: cam.scrollX, scrollY: cam.scrollY, zoom: cam.zoom }
  }

  focus(
    x: number,
    y: number,
    opts?: { zoom?: number; duration?: number; ease?: string },
  ): void {
    const cam = this.scene.cameras.main
    const duration = opts?.duration ?? 400
    this.kill()
    this.tweens.push(this.scene.tweens.add({
      targets: cam,
      scrollX: x - LOGICAL_WIDTH / 2,
      scrollY: y - LOGICAL_HEIGHT / 2,
      zoom: opts?.zoom ?? cam.zoom,
      duration,
      ease: opts?.ease ?? 'Cubic.Out',
    }))
  }

  pan(x: number, y: number, duration = 500): void {
    this.focus(x, y, { duration, zoom: this.scene.cameras.main.zoom, ease: 'Sine.InOut' })
  }

  slamZoom(x: number, y: number, zoom = 1.85): void {
    this.focus(x, y, { zoom, duration: 160, ease: 'Back.Out' })
  }

  impact(intensity = 0.012, duration = 180): void {
    this.scene.cameras.main.shake(duration, intensity)
  }

  flash(duration = 80, color = 0xffffff): void {
    const r = (color >> 16) & 255
    const g = (color >> 8) & 255
    const b = color & 255
    this.scene.cameras.main.flash(duration, r, g, b)
  }

  fade(duration = 240, toBlack = true): void {
    if (toBlack) {
      this.scene.cameras.main.fadeOut(duration, 0, 0, 0)
    } else {
      this.scene.cameras.main.fadeIn(duration, 0, 0, 0)
    }
  }

  restore(duration = 280): void {
    const cam = this.scene.cameras.main
    cam.resetFX()
    const snap = this.snap
    this.kill()
    if (!snap) {
      cam.setZoom(1)
      cam.centerOn(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2)
      return
    }
    this.tweens.push(this.scene.tweens.add({
      targets: cam,
      scrollX: snap.scrollX,
      scrollY: snap.scrollY,
      zoom: snap.zoom,
      duration,
      ease: 'Cubic.Out',
    }))
  }

  restoreImmediate(): void {
    const cam = this.scene.cameras.main
    cam.resetFX()
    this.kill()
    if (this.snap) {
      cam.setScroll(this.snap.scrollX, this.snap.scrollY)
      cam.setZoom(this.snap.zoom)
    }
  }

  private kill(): void {
    this.tweens.forEach((tw) => tw.stop())
    this.tweens = []
  }
}
