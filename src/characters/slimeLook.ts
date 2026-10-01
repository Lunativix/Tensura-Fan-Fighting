import type Phaser from 'phaser'
import { addPunchedTexture, canvasFromPunchedImage } from '../sprites/punchBackdrop.ts'
import { portraitArtKey, portraitHeadKey } from '../ui/portraits.ts'

export const SLIME_BODY_KEY = 'rimuru-slime-body'

/** Canon slime silhouette — teardrop gel, pale cyan, line face. */
export function drawRimuruSlime(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h)
  const cx = w * 0.5
  const cy = h * 0.56
  const blob = () => {
    ctx.beginPath()
    ctx.moveTo(cx, cy - h * 0.3)
    ctx.bezierCurveTo(cx + w * 0.27, cy - h * 0.26, cx + w * 0.34, cy + h * 0.02, cx + w * 0.28, cy + h * 0.22)
    ctx.bezierCurveTo(cx + w * 0.18, cy + h * 0.36, cx - w * 0.18, cy + h * 0.36, cx - w * 0.28, cy + h * 0.22)
    ctx.bezierCurveTo(cx - w * 0.34, cy + h * 0.02, cx - w * 0.27, cy - h * 0.26, cx, cy - h * 0.3)
    ctx.closePath()
  }
  ctx.save()
  ctx.translate(0, h * 0.03)
  blob()
  ctx.fillStyle = 'rgba(6, 22, 40, 0.3)'
  ctx.fill()
  ctx.restore()
  const body = ctx.createRadialGradient(cx + w * 0.08, cy - h * 0.12, w * 0.05, cx, cy + h * 0.05, w * 0.4)
  body.addColorStop(0, 'rgba(236, 252, 255, 0.96)')
  body.addColorStop(0.32, 'rgba(176, 234, 246, 0.93)')
  body.addColorStop(0.72, 'rgba(118, 200, 222, 0.9)')
  body.addColorStop(1, 'rgba(64, 150, 182, 0.88)')
  blob()
  ctx.fillStyle = body
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(cx - w * 0.02, cy + h * 0.05, w * 0.17, h * 0.15, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(72, 152, 184, 0.26)'
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(cx + w * 0.1, cy - h * 0.13, w * 0.14, h * 0.09, -0.45, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(cx + w * 0.16, cy - h * 0.17, w * 0.045, h * 0.028, -0.35, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'
  ctx.fill()
  ctx.fillStyle = 'rgba(248, 252, 255, 0.42)'
  ctx.beginPath()
  ctx.ellipse(cx - w * 0.12, cy + h * 0.018, w * 0.038, h * 0.022, -0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(cx + w * 0.12, cy + h * 0.018, w * 0.038, h * 0.022, 0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(24, 44, 60, 0.92)'
  ctx.lineCap = 'round'
  ctx.lineWidth = Math.max(2.2, w * 0.014)
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.095, cy - h * 0.008)
  ctx.lineTo(cx - w * 0.038, cy - h * 0.008)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx + w * 0.038, cy - h * 0.008)
  ctx.lineTo(cx + w * 0.095, cy - h * 0.008)
  ctx.stroke()
  ctx.lineWidth = Math.max(1.6, w * 0.009)
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.022, cy + h * 0.038)
  ctx.lineTo(cx + w * 0.022, cy + h * 0.038)
  ctx.stroke()
}

function bakeProcedural(scene: Phaser.Scene): void {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return
  }
  drawRimuruSlime(ctx, 256, 256)
  if (scene.textures.exists(SLIME_BODY_KEY)) {
    scene.textures.remove(SLIME_BODY_KEY)
  }
  scene.textures.addCanvas(SLIME_BODY_KEY, canvas)
}

export function ensureSlimeTextures(scene: Phaser.Scene, preferArt = false): void {
  const srcKey = portraitHeadKey('rimuru-slime')
  const artKey = portraitArtKey('rimuru-slime')
  if (preferArt && scene.textures.exists(srcKey)) {
    const src = scene.textures.get(srcKey).getSourceImage() as HTMLImageElement | HTMLCanvasElement
    if (src instanceof HTMLCanvasElement && scene.textures.exists(SLIME_BODY_KEY)) {
      return
    }
    if (src && typeof src.width === 'number' && src.width > 8) {
      const punched = canvasFromPunchedImage(src, 'studio')
      addPunchedTexture(scene, SLIME_BODY_KEY, punched)
      addPunchedTexture(scene, srcKey, punched)
      if (scene.textures.exists(artKey)) {
        const artSrc = scene.textures.get(artKey).getSourceImage() as HTMLImageElement | HTMLCanvasElement
        if (artSrc && typeof artSrc.width === 'number' && artSrc.width > 8 && !(artSrc instanceof HTMLCanvasElement)) {
          addPunchedTexture(scene, artKey, canvasFromPunchedImage(artSrc, 'studio'))
        }
      }
      return
    }
  }
  if (!scene.textures.exists(SLIME_BODY_KEY)) {
    bakeProcedural(scene)
  }
}

export function spawnSlimePreview(
  scene: Phaser.Scene,
  x: number,
  y: number,
  scale = 1,
): Phaser.GameObjects.Image {
  ensureSlimeTextures(scene, true)
  const image = scene.add.image(x, y, SLIME_BODY_KEY)
  image.setOrigin(0.5, 1)
  image.setScale(scale)
  scene.tweens.add({
    targets: image,
    scaleX: scale * 1.05,
    scaleY: scale * 0.94,
    y: y - 6,
    duration: 1600,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut',
  })
  return image
}
