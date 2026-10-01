import Phaser from 'phaser'
import { AssetKeys } from '../assets/AssetKeys.ts'
import { screenFxEnabled, vfxBudget } from '../effects/ScreenFx.ts'
import { fxAnimKey, fxById, fxTextureKey } from './FxLibrary.ts'

export interface VFXDefinition {
  id: string
  duration: number
  tint: number
  quantity: number
  scale: number
}

export const VFX_LIBRARY: Record<string, VFXDefinition> = {
  IMPACT: { id: 'IMPACT', duration: 280, tint: 0xfff59d, quantity: 10, scale: 0.5 },
  LIGHT: { id: 'LIGHT', duration: 180, tint: 0xffffff, quantity: 6, scale: 0.3 },
  HEAVY: { id: 'HEAVY', duration: 360, tint: 0xffcc80, quantity: 16, scale: 0.6 },
  LIGHTNING: { id: 'LIGHTNING', duration: 360, tint: 0xb39ddb, quantity: 14, scale: 0.4 },
  EXPLOSION: { id: 'EXPLOSION', duration: 420, tint: 0xff7043, quantity: 18, scale: 0.7 },
  AURA: { id: 'AURA', duration: 500, tint: 0x80d8ff, quantity: 8, scale: 0.35 },
  DASH: { id: 'DASH', duration: 220, tint: 0x90caf9, quantity: 8, scale: 0.3 },
  CHARGE: { id: 'CHARGE', duration: 400, tint: 0xffe082, quantity: 10, scale: 0.4 },
  BEAM: { id: 'BEAM', duration: 380, tint: 0xce93d8, quantity: 14, scale: 0.35 },
  ENERGY: { id: 'ENERGY', duration: 300, tint: 0x80d8ff, quantity: 12, scale: 0.4 },
  ULTIMATE: { id: 'ULTIMATE', duration: 600, tint: 0xffffff, quantity: 24, scale: 0.8 },
  MAGIC: { id: 'MAGIC', duration: 340, tint: 0xce93d8, quantity: 12, scale: 0.45 },
  TRANSFORMATION: { id: 'TRANSFORMATION', duration: 500, tint: 0xfff59d, quantity: 16, scale: 0.55 },
}

export class VfxEngine {
  particleCount = 0

  play(scene: Phaser.Scene, id: string, x: number, y: number, tint?: number): void {
    if (!screenFxEnabled()) {
      return
    }
    const def = VFX_LIBRARY[id] ?? VFX_LIBRARY.IMPACT
    if (!def) {
      return
    }
    const qty = Math.min(def.quantity, vfxBudget())
    const emitter = scene.add.particles(x, y, AssetKeys.particle, {
      speed: { min: 60, max: 240 },
      scale: { start: def.scale, end: 0 },
      lifespan: def.duration,
      tint: tint ?? def.tint,
      blendMode: 'ADD',
      emitting: false,
    })
    emitter.explode(qty)
    this.particleCount += qty
    scene.time.delayedCall(def.duration + 80, () => {
      if (emitter.active) {
        emitter.destroy()
      }
      this.particleCount = Math.max(0, this.particleCount - qty)
    })
  }

  /**
   * Joue un effet en planche (spritesheet additive de FxLibrary).
   * Retourne le sprite (a suivre/detruire soi-meme pour les effets en boucle), ou null si indisponible.
   */
  playSheet(
    scene: Phaser.Scene,
    id: string,
    x: number,
    y: number,
    opts?: { scale?: number; depth?: number; flipX?: boolean; tint?: number; persist?: boolean; lifespan?: number },
  ): Phaser.GameObjects.Sprite | null {
    if (!screenFxEnabled()) {
      return null
    }
    const def = fxById(id)
    if (!def || !scene.textures.exists(fxTextureKey(id)) || !scene.anims.exists(fxAnimKey(id))) {
      return null
    }
    const sprite = scene.add.sprite(x, y, fxTextureKey(id), 0)
    sprite.setBlendMode(Phaser.BlendModes.ADD)
    sprite.setScale(opts?.scale ?? def.scale)
    sprite.setDepth(opts?.depth ?? 25)
    sprite.setFlipX(opts?.flipX ?? false)
    if (opts?.tint !== undefined) {
      sprite.setTint(opts.tint)
    }
    sprite.play(fxAnimKey(id))
    if (!def.loop) {
      sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => sprite.destroy())
    } else if (!opts?.persist) {
      const life = opts?.lifespan ?? 480
      scene.time.delayedCall(life, () => {
        if (sprite.active) {
          sprite.destroy()
        }
      })
    }
    return sprite
  }

  clear(): void {
    this.particleCount = 0
  }
}

export const vfxEngine = new VfxEngine()
