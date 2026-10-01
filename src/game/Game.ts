import Phaser from 'phaser'
import { audio } from '../audio/AudioManager.ts'
import { combatSfx } from '../audio/CombatSfx.ts'
import { debugHud } from '../debug/DebugHud.ts'
import { installGameLoopGuards } from '../engine/GameLoop.ts'
import { installDeviceWatch } from '../input/InputDeviceManager.ts'
import { saveManager } from '../save/SaveManager.ts'
import { session } from './GameState.ts'
import { AiDifficulty } from '../ai/AiDifficulty.ts'
import { createGameConfig } from './GameConfig.ts'
import { musicManager } from '../audio/music/MusicManager.ts'

export function startGame(parent: string | HTMLElement = 'game-root'): Phaser.Game {
  const save = saveManager.load()
  audio.setVolume('music', save.settings.musicVolume)
  audio.setVolume('sfx', save.settings.sfxVolume)
  musicManager.applySettings({
    battleMusicVolume: save.settings.battleMusicVolume,
    cinematicMusicVolume: save.settings.cinematicMusicVolume,
    menuMusicVolume: save.settings.menuMusicVolume,
    musicDynamic: save.settings.musicDynamic,
    musicVariation: save.settings.musicVariation,
  })
  combatSfx.setEnvironment('tempest_city')
  if (save.settings.aiDifficulty === AiDifficulty.EASY || save.settings.aiDifficulty === AiDifficulty.HARD || save.settings.aiDifficulty === AiDifficulty.EXPERT) {
    session.aiDifficulty = save.settings.aiDifficulty
  } else {
    session.aiDifficulty = AiDifficulty.NORMAL
  }

  const host = window as unknown as { ensuraGame?: Phaser.Game }
  if (host.ensuraGame) {
    host.ensuraGame.destroy(true)
    host.ensuraGame = undefined
  }

  const game = new Phaser.Game(createGameConfig(parent))
  host.ensuraGame = game
  installGameLoopGuards(game)
  debugHud.attach()
  const toast = document.createElement('div')
  toast.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:30;padding:12px 16px;background:rgba(8,16,28,0.88);color:#eaf6ff;font:14px Segoe UI,sans-serif;white-space:pre;display:none;border:1px solid #4fc3f7'
  document.body.appendChild(toast)
  installDeviceWatch((message) => {
    toast.textContent = message
    toast.style.display = 'block'
    window.setTimeout(() => {
      toast.style.display = 'none'
    }, 2800)
  })
  game.events.on(Phaser.Core.Events.STEP, () => {
    debugHud.update(game)
  })
  return game
}
