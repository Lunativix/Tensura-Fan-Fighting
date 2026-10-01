import Phaser from 'phaser'
import { SceneKeys } from '../game/SceneKeys.ts'

/** Ancien menu liste : redirige vers le lobby Tempest. */
export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.MainMenu)
  }

  create(): void {
    this.scene.start(SceneKeys.Hub)
  }
}
