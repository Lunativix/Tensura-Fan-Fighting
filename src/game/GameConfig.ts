import Phaser from 'phaser'
import { LOGICAL_HEIGHT, LOGICAL_WIDTH, TARGET_FPS } from '../engine/Time.ts'
import { BootScene } from '../scenes/BootScene.ts'
import { CharacterSelectScene } from '../scenes/CharacterSelectScene.ts'
import { CharactersScene } from '../scenes/CharactersScene.ts'
import { MainMenuScene } from '../scenes/MainMenuScene.ts'
import { HubScene } from '../scenes/HubScene.ts'
import { ModeSelectScene } from '../scenes/ModeSelectScene.ts'
import { PreloadScene } from '../scenes/PreloadScene.ts'
import { SettingsScene } from '../scenes/SettingsScene.ts'
import { AccountScene } from '../scenes/AccountScene.ts'
import { TrainingScene } from '../scenes/TrainingScene.ts'
import { FightScene } from '../scenes/FightScene.ts'
import { ResultScene } from '../scenes/ResultScene.ts'
import { ControlsScene } from '../scenes/ControlsScene.ts'
import { StoryScene } from '../scenes/StoryScene.ts'
import { StoryPlayScene } from '../scenes/StoryPlayScene.ts'
import { OnlineScene } from '../scenes/OnlineScene.ts'
import { ShopScene } from '../scenes/ShopScene.ts'
import { SummonScene } from '../scenes/SummonScene.ts'
import { EventsScene } from '../scenes/EventsScene.ts'
import { PatchNotesScene } from '../scenes/PatchNotesScene.ts'

export function createGameConfig(parent: string | HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: LOGICAL_WIDTH,
    height: LOGICAL_HEIGHT,
    backgroundColor: '#05060c',
    fps: {
      target: TARGET_FPS,
      min: 30,
      smoothStep: true,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 1800 },
        fps: TARGET_FPS,
        fixedStep: true,
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: LOGICAL_WIDTH,
      height: LOGICAL_HEIGHT,
    },
    render: {
      antialias: true,
      pixelArt: false,
      powerPreference: 'high-performance',
    },
    audio: {
      disableWebAudio: false,
    },
    input: {
      gamepad: true,
      keyboard: true,
      mouse: true,
    },
    scene: [
      BootScene,
      PreloadScene,
      MainMenuScene,
      HubScene,
      ModeSelectScene,
      CharacterSelectScene,
      CharactersScene,
      TrainingScene,
      SettingsScene,
      AccountScene,
      ControlsScene,
      FightScene,
      ResultScene,
      StoryScene,
      StoryPlayScene,
      OnlineScene,
      ShopScene,
      SummonScene,
      PatchNotesScene,
      EventsScene,
    ],
  }
}
