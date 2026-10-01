import { CHARACTERS } from '../../config/characters.ts'
import { ultLine } from '../../dialogue/combatBanter.ts'
import { def } from '../scriptUtil.ts'
import type { CinematicContext, CinematicDef } from '../types.ts'

function speakerOf(ctx: CinematicContext, fallback: string): string {
  if (ctx.attacker) {
    return ctx.attacker.def.name
  }
  if (ctx.attackerId) {
    return CHARACTERS[ctx.attackerId]?.name ?? fallback
  }
  return fallback
}

export function ultimateGeneric(ctx: CinematicContext): CinematicDef {
  const line = ultLine(ctx.attacker?.def.id ?? ctx.attackerId)
  return def('ultimate', 3200, [
    [0, (api) => {
      const who = ctx.attacker ?? api.player()
      api.letterbox(true, 120)
      api.audio.duck(0.18)
      api.freezeFrame(80)
      api.camera.slamZoom(who.x, who.y - 48, 1.85)
      api.audio.stinger('charge')
    }],
    [120, (api) => {
      const who = ctx.attacker ?? api.player()
      api.fx.aura(who.x, who.y - 50, who.def.accent)
      api.slowMotion(0.22, 900)
    }],
    [400, (api) => {
      const who = ctx.attacker ?? api.player()
      api.dialogue.show({
        speaker: speakerOf(ctx, 'Fighter'),
        speakerId: who.def.id,
        text: line,
        emotion: line.endsWith('!') ? 'excited' : 'serious',
        duration: 1200,
      })
    }],
    [1400, (api) => {
      const who = ctx.attacker ?? api.player()
      api.fx.ultimateFlash(who.x, who.y - 40)
      api.camera.flash(70)
      api.audio.stinger('flash')
    }],
    [1680, (api) => {
      const who = ctx.attacker ?? api.player()
      const foe = ctx.target ?? api.cpu()
      api.fx.afterimage(who.x, who.y, who.def.color)
      api.camera.focus((who.x + foe.x) / 2, (who.y + foe.y) / 2 - 30, { zoom: 1.35, duration: 180 })
      api.audio.stinger('whoosh')
    }],
    [2000, (api) => {
      const foe = ctx.target ?? api.cpu()
      api.fx.impact(foe.x, foe.y - 40)
      api.fx.shockwave(foe.x, foe.y - 20)
      api.freezeFrame(90)
      api.audio.stinger('impact')
    }],
    [2140, (api) => {
      api.camera.flash(90)
      api.camera.impact(0.018, 260)
      api.fx.dust((ctx.target ?? api.cpu()).x, (ctx.target ?? api.cpu()).y)
    }],
    [2600, (api) => {
      api.slowMotion(1, 200)
      api.letterbox(false, 200)
    }],
  ], { commit: 'ultimate' })
}

export function ultimateRimuru(ctx: CinematicContext): CinematicDef {
  const base = ultimateGeneric(ctx)
  return { ...base, id: 'ultimate_rimuru' }
}

export function ultimateMilim(ctx: CinematicContext): CinematicDef {
  const base = ultimateGeneric(ctx)
  return { ...base, id: 'ultimate_milim' }
}
