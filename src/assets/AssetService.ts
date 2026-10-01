import type Phaser from 'phaser'
import { AssetKeys } from './AssetKeys.ts'

export function generateFallbackTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists(AssetKeys.pixel)) {
    const g = scene.add.graphics()
    g.fillStyle(0xffffff, 1)
    g.fillRect(0, 0, 8, 8)
    g.generateTexture(AssetKeys.pixel, 8, 8)
    g.destroy()
  }

  if (!scene.textures.exists(AssetKeys.missing)) {
    const g = scene.add.graphics()
    g.fillStyle(0xff4d6d, 1)
    g.fillRect(0, 0, 32, 32)
    g.fillStyle(0x1a1020, 1)
    g.fillRect(4, 4, 24, 24)
    g.generateTexture(AssetKeys.missing, 32, 32)
    g.destroy()
  }

  if (!scene.textures.exists(AssetKeys.particle)) {
    const g = scene.add.graphics()
    g.fillStyle(0xffffff, 1)
    g.fillCircle(8, 8, 8)
    g.generateTexture(AssetKeys.particle, 16, 16)
    g.destroy()
  }
}

export function safeTexture(scene: Phaser.Scene, key: string): string {
  if (scene.textures.exists(key)) {
    return key
  }
  if (scene.textures.exists(AssetKeys.missing)) {
    return AssetKeys.missing
  }
  return AssetKeys.pixel
}

export function safeAnimation(scene: Phaser.Scene, key: string, fallback = 'idle'): string {
  if (scene.anims.exists(key)) {
    return key
  }
  if (scene.anims.exists(fallback)) {
    return fallback
  }
  return key
}
