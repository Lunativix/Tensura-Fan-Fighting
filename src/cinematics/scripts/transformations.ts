import { def } from '../scriptUtil.ts'
import type { CinematicContext, CinematicDef } from '../types.ts'

export function transformGeneric(ctx: CinematicContext): CinematicDef {
  return def('transform', 2800, [
    [0, (api) => {
      const who = ctx.attacker ?? api.player()
      api.letterbox(true, 140)
      api.audio.duck(0.22)
      api.freezeFrame(70)
      api.camera.slamZoom(who.x, who.y - 36, 1.75)
      api.audio.stinger('charge')
    }],
    [180, (api) => {
      const who = ctx.attacker ?? api.player()
      api.fx.aura(who.x, who.y - 50, who.def.accent)
      api.slowMotion(0.3, 700)
    }],
    [500, (api) => {
      const who = ctx.attacker ?? api.player()
      api.fx.transformBurst(who.x, who.y - 40)
      api.fx.energy(who.x, who.y - 40)
    }],
    [1100, (api) => {
      api.camera.flash(140, 0xfff59d)
      api.audio.stinger('transform')
      api.fx.shockwave((ctx.attacker ?? api.player()).x, (ctx.attacker ?? api.player()).y)
    }],
    [1400, (api) => {
      const who = ctx.attacker ?? api.player()
      api.fx.title(who.def.name.toUpperCase(), { y: 180, size: 40, color: '#ffd54f', duration: 700 })
      api.camera.focus(who.x, who.y - 50, { zoom: 1.45, duration: 280 })
    }],
    [2300, (api) => {
      api.slowMotion(1, 180)
      api.letterbox(false, 180)
    }],
  ], { commit: 'transform' })
}
