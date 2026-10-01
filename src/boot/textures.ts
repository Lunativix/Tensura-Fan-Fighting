import type Phaser from 'phaser'

export const BootTexture = {
  ring: 'boot-ring',
  glow: 'boot-glow',
} as const

/** Tiny procedural textures for the boot sequence. No extra files. */
export function generateBootTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists(BootTexture.glow)) {
    const g = scene.add.graphics()
    for (let i = 8; i >= 1; i -= 1) {
      g.fillStyle(0xffffff, 0.045 * i)
      g.fillCircle(32, 32, i * 3.8)
    }
    g.generateTexture(BootTexture.glow, 64, 64)
    g.destroy()
  }

  if (!scene.textures.exists(BootTexture.ring)) {
    const g = scene.add.graphics()
    g.lineStyle(2, 0xffffff, 0.7)
    g.strokeCircle(128, 128, 108)
    g.lineStyle(1, 0xffffff, 0.35)
    g.strokeCircle(128, 128, 88)
    g.lineStyle(1, 0xffffff, 0.22)
    g.strokeCircle(128, 128, 64)
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2
      const inner = i % 3 === 0 ? 96 : 102
      g.lineStyle(i % 3 === 0 ? 2 : 1, 0xffffff, i % 3 === 0 ? 0.45 : 0.22)
      g.lineBetween(
        128 + Math.cos(a) * inner,
        128 + Math.sin(a) * inner,
        128 + Math.cos(a) * 114,
        128 + Math.sin(a) * 114,
      )
    }
    g.generateTexture(BootTexture.ring, 256, 256)
    g.destroy()
  }
}
