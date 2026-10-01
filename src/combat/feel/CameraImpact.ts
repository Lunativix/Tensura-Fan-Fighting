import type Phaser from 'phaser'
import { screenFxEnabled } from '../../effects/ScreenFx.ts'
import { SHAKE, type ImpactFeel, type ShakePreset } from '../../vfx/ImpactCatalog.ts'

/** Controlled camera punches — never a constant earthquake. */
export type CameraImpactLevel = 'light' | 'medium' | 'heavy' | 'ultimate' | 'finisher'

const LEVEL: Record<CameraImpactLevel, ShakePreset> = {
  light: SHAKE.LIGHT,
  medium: SHAKE.MEDIUM,
  heavy: SHAKE.HEAVY,
  ultimate: SHAKE.ULTIMATE,
  finisher: { duration: 160, intensity: 0.014 },
}

export const CameraImpactManager = {
  apply(cam: Phaser.Cameras.Scene2D.Camera, level: CameraImpactLevel): void {
    if (!screenFxEnabled()) {
      return
    }
    const shake = LEVEL[level]
    if (shake.intensity <= 0) {
      return
    }
    cam.shake(shake.duration, shake.intensity)
  },

  fromFeel(cam: Phaser.Cameras.Scene2D.Camera, feel: ImpactFeel): void {
    if (!screenFxEnabled() || feel.shake.intensity <= 0) {
      return
    }
    cam.shake(feel.shake.duration, feel.shake.intensity)
  },
}
