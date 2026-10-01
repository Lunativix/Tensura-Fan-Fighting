import Phaser from 'phaser'
import { generateFallbackTextures } from '../assets/AssetService.ts'
import { generateBootTextures } from '../boot/textures.ts'
import { ensureSlimeTextures } from '../characters/slimeLook.ts'
import { GameFlow } from '../types/game.ts'
import { session } from '../game/GameState.ts'
import { SceneKeys } from '../game/SceneKeys.ts'

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Boot)
  }

  create(): void {
    session.flow = GameFlow.BOOT
    this.cameras.main.setBackgroundColor('#020308')
    generateFallbackTextures(this)
    generateBootTextures(this)
    ensureSlimeTextures(this, false)
    this.scene.start(SceneKeys.Preload)
  }
}
