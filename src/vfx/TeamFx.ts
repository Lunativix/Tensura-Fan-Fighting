import type Phaser from 'phaser'
import { vfxEngine } from './VfxEngine.ts'

/** Effets modulaires 3v3 : reutilisables pour n'importe quel perso / arene. */
export function playSwitchIn(scene: Phaser.Scene, x: number, y: number): void {
  vfxEngine.playSheet(scene, 'SWITCH_IN', x, y - 50)
  vfxEngine.play(scene, 'ENERGY', x, y - 40)
}

export function playSwitchOut(scene: Phaser.Scene, x: number, y: number): void {
  vfxEngine.playSheet(scene, 'SWITCH_OUT', x, y - 50)
  vfxEngine.play(scene, 'DASH', x, y - 40)
}

export function playAssist(scene: Phaser.Scene, x: number, y: number): void {
  vfxEngine.playSheet(scene, 'ASSIST', x, y - 40)
  vfxEngine.play(scene, 'LIGHT', x, y - 20)
}

export function playEmergency(scene: Phaser.Scene, x: number, y: number): void {
  vfxEngine.playSheet(scene, 'EMERGENCY', x, y - 50, { scale: 1.05, depth: 26 })
  vfxEngine.play(scene, 'AURA', x, y - 40)
}
