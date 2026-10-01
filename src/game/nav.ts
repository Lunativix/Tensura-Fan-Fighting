import type Phaser from 'phaser'
import { SceneKeys } from './SceneKeys.ts'

export function goHub(scene: Phaser.Scene): void {
  scene.scene.start(SceneKeys.Hub)
}
