import { victoryLine } from '../../dialogue/combatBanter.ts'
import { def } from '../scriptUtil.ts'
import type { CinematicContext, CinematicDef } from '../types.ts'
import { AnimationVariationManager } from '../../combat/feel/AnimationVariationManager.ts'

export function victoryCinematic(ctx: CinematicContext): CinematicDef {
  const variant = AnimationVariationManager.victory(ctx.winner?.def.id ?? 'rimuru', ctx.target?.def.id)
  const zoom = 1.55 + variant * 0.08
  return def('victory', 2600, [
    [0, (api) => {
      const winner = ctx.winner ?? (api.player().alive ? api.player() : api.cpu())
      api.letterbox(true, 200)
      api.audio.duck(0.3)
      api.camera.slamZoom(winner.x, winner.y - 40, zoom)
      api.fx.victoryAura(winner.x, winner.y - 50)
      api.audio.stinger('confirm')
    }],
    [400, (api) => {
      const winner = ctx.winner ?? (api.player().alive ? api.player() : api.cpu())
      api.fx.aura(winner.x, winner.y - 40, winner.def.accent)
      api.fx.title(winner.def.name.toUpperCase(), { y: 200, size: 48, color: '#ffd54f', duration: 900 })
      api.dialogue.show({
        speaker: winner.def.name,
        speakerId: winner.def.id,
        text: victoryLine(winner.def.id),
        emotion: 'happy',
        duration: 1400,
      })
    }],
    [1100, (api) => {
      api.fx.title('VICTORY', { size: 96, color: '#eaf6ff', duration: 900 })
      api.camera.flash(80)
    }],
    [2100, (api) => {
      api.letterbox(false, 240)
      api.camera.fade(240, true)
    }],
  ])
}
