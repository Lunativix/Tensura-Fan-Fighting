import type Phaser from 'phaser'
import type { Fighter } from '../../characters/Fighter.ts'
import { musicManager } from '../../audio/music/MusicManager.ts'
import { MusicEvent } from '../../audio/music/types.ts'
import { combatSfx } from '../../audio/CombatSfx.ts'
import { vfxEngine } from '../../vfx/VfxEngine.ts'
import { styleFor } from '../../vfx/CombatStyle.ts'
import type { CombatSpectacle } from '../../vfx/CombatSpectacle.ts'
import { motionOf } from './MotionProfile.ts'

/** Shared combat + story transform feel. Visual body swap stays in StoryPlayScene.applyTransform. */
export function playTransformFeel(
  scene: Phaser.Scene,
  spectacle: CombatSpectacle | null,
  fighter: Fighter,
): void {
  const style = styleFor(fighter.def.id)
  const y = fighter.y - 48
  vfxEngine.playSheet(scene, 'TRANSFORM', fighter.x, y, { tint: style.glow })
  combatSfx.transform(fighter)
  musicManager.event(MusicEvent.Transformation, { playerCharacter: fighter.def.id })
  if (!spectacle) {
    return
  }
  spectacle.onTransform(fighter)
  if (motionOf(fighter.def.id).magicCircle) {
    spectacle.play('magic_circle', fighter.x, y, style)
  }
}
