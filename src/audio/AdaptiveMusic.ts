import { musicManager } from './music/MusicManager.ts'
import { BattleType, MusicRole } from './music/types.ts'
import type { FighterIdValue } from '../types/game.ts'

/** Compat façade — le moteur réel est MusicManager. */
export class AdaptiveMusic {
  start(p1: FighterIdValue, p2: FighterIdValue): void {
    musicManager.playContext({
      role: MusicRole.BATTLE,
      playerCharacter: p1,
      enemy: p2,
      battleType: BattleType.NORMAL,
      intensity: 2,
    }, true)
  }

  setCombat(playerHpRatio: number, enemyHpRatio: number, combo: number): void {
    musicManager.setCombatState(playerHpRatio, enemyHpRatio, combo)
  }

  stop(): void {
    musicManager.stop()
  }

  pulse(): void {
    musicManager.pulse()
  }
}

export const adaptiveMusic = new AdaptiveMusic()
