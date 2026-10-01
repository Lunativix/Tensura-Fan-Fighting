import type Phaser from 'phaser'
import { MusicEvent } from '../../audio/music/types.ts'
import { musicManager } from '../../audio/music/MusicManager.ts'
import type { CombatSpectacle } from '../../vfx/CombatSpectacle.ts'
import type { PveEnemy } from '../../story/pve/PveEnemy.ts'
import { PveProfile } from '../../story/types.ts'

/** Phase 2 is a feel beat (VFX + music). No invented moves. */
export function consumeBossPhase2(
  scene: Phaser.Scene,
  spectacle: CombatSpectacle | null,
  enemy: PveEnemy,
): boolean {
  if (enemy.def.profile !== PveProfile.BOSS || enemy.phase < 2 || enemy.phaseAnnounced) {
    return false
  }
  enemy.phaseAnnounced = true
  musicManager.event(MusicEvent.BossPhaseChange)
  if (!spectacle) {
    return true
  }
  spectacle.play('energy_burst', enemy.x, enemy.y - 40)
  spectacle.play('speed_lines', enemy.x, enemy.y)
  scene.cameras.main.flash(90, 255, 224, 180)
  return true
}
