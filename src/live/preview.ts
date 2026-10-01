import type Phaser from 'phaser'
import { CHARACTERS } from '../config/characters.ts'
import { portraitArtKey, portraitHeadKey } from '../ui/portraits.ts'
import { spriteAnimKey, spriteFrameKey, spritePackKey } from '../sprites/SpriteManifest.ts'
import { spawnSlimePreview } from '../characters/slimeLook.ts'
import type { SkinBody } from '../config/characterSkins.ts'
import type { FighterIdValue } from '../types/game.ts'

export function spawnIdleFighter(
  scene: Phaser.Scene,
  x: number,
  y: number,
  fighterId: FighterIdValue,
  scale = 0.7,
  body?: SkinBody,
): Phaser.GameObjects.GameObject {
  if (body === 'slime') {
    return spawnSlimePreview(scene, x, y, scale * 1.15)
  }
  const pack = spritePackKey(fighterId, 'idle')
  const frame = spriteFrameKey(fighterId, 'idle', 0)
  const key = scene.textures.exists(pack) ? pack : scene.textures.exists(frame) ? frame : ''
  if (key) {
    const sprite = scene.add.sprite(x, y, key, 0)
    sprite.setOrigin(0.5, 1)
    sprite.setScale(scale)
    const anim = spriteAnimKey(fighterId, 'idle')
    if (scene.anims.exists(anim)) {
      sprite.play(anim)
    }
    scene.tweens.add({
      targets: sprite,
      y: y - 8,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    })
    return sprite
  }
  const art = portraitArtKey(fighterId)
  if (scene.textures.exists(art)) {
    const image = scene.add.image(x, y, art)
    image.setOrigin(0.5, 1)
    image.setDisplaySize(Math.round(420 * scale), Math.round(620 * scale))
    scene.tweens.add({
      targets: image,
      scaleX: image.scaleX * 1.02,
      scaleY: image.scaleY * 1.02,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    })
    return image
  }
  const head = portraitHeadKey(fighterId)
  if (scene.textures.exists(head)) {
    const image = scene.add.image(x, y - 40, head)
    image.setOrigin(0.5, 1)
    image.setDisplaySize(180, 180)
    return image
  }
  const fallback = scene.add.circle(x, y - 80, 48, CHARACTERS[fighterId].color, 1)
  fallback.setStrokeStyle(4, CHARACTERS[fighterId].accent, 0.9)
  return fallback
}
