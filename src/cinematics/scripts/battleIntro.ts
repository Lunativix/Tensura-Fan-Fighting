import { CHARACTERS } from '../../config/characters.ts'
import { introLine, introReply } from '../../dialogue/combatBanter.ts'
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../../engine/Time.ts'
import { def } from '../scriptUtil.ts'
import type { CinematicContext, CinematicDef } from '../types.ts'
import type { FighterIdValue } from '../../types/game.ts'

function names(ids: FighterIdValue[]): string {
  return ids.map((id) => CHARACTERS[id]?.name ?? id).join('   ·   ')
}

export function battleIntro(ctx: CinematicContext): CinematicDef {
  const p = ctx.playerTeam
  const c = ctx.cpuTeam
  const playerId = p[0]
  const cpuId = c[0]
  return def('battle_intro', 7600, [
    [0, (api) => {
      api.letterbox(true, 280)
      api.fx.dimScreen(0.55)
      api.audio.duck(0.2)
      api.audio.stinger('whoosh')
    }],
    [280, (api) => {
      api.fx.clearDim()
      api.fx.dimScreen(0.28)
      api.fx.title('TEAM 1', { y: 220, size: 36, color: '#7ec8ff', duration: 900 })
    }],
    [520, (api) => {
      api.fx.title(names(p), { y: 300, size: 42, color: '#eaf6ff', duration: 1100 })
    }],
    [1100, (api) => {
      const fighter = api.player()
      api.camera.slamZoom(fighter.x, fighter.y - 40, 1.55)
      api.fx.aura(fighter.x, fighter.y - 50, fighter.def.accent)
    }],
    [1900, (api) => {
      api.fx.title('VS', { y: LOGICAL_HEIGHT / 2 - 20, size: 96, color: '#ffd54f', duration: 700 })
      api.audio.stinger('confirm')
    }],
    [2500, (api) => {
      api.fx.title('TEAM 2', { y: 220, size: 36, color: '#ff9ec4', duration: 900 })
    }],
    [2740, (api) => {
      api.fx.title(names(c), { y: 300, size: 42, color: '#eaf6ff', duration: 1100 })
    }],
    [3300, (api) => {
      const fighter = api.cpu()
      api.camera.slamZoom(fighter.x, fighter.y - 40, 1.55)
      api.fx.aura(fighter.x, fighter.y - 50, fighter.def.accent)
    }],
    [4100, (api) => {
      api.camera.focus(LOGICAL_WIDTH / 2, 620, { zoom: 1.05, duration: 360 })
      api.fx.aura(api.player().x, api.player().y - 40, api.player().def.color)
      api.fx.aura(api.cpu().x, api.cpu().y - 40, api.cpu().def.color)
      if (playerId) {
        api.dialogue.show({
          speaker: CHARACTERS[playerId].name,
          speakerId: playerId,
          text: introLine(playerId),
          emotion: 'serious',
          side: 'left',
          duration: 1400,
        })
      }
    }],
    [5300, (api) => {
      if (cpuId) {
        api.dialogue.show({
          speaker: CHARACTERS[cpuId].name,
          speakerId: cpuId,
          text: introReply(cpuId),
          emotion: 'serious',
          side: 'right',
          duration: 1400,
        })
      }
    }],
    [6400, (api) => {
      api.dialogue.hide()
    }],
    [6500, (api) => {
      api.fx.title('READY', { size: 88, color: '#ffd54f', duration: 420 })
      api.audio.stinger('ready')
    }],
    [7000, (api) => {
      api.fx.title('FIGHT', { size: 108, color: '#eaf6ff', duration: 420 })
      api.audio.stinger('fight')
      api.camera.flash(90)
      api.camera.impact(0.01, 160)
    }],
    [7300, (api) => {
      api.letterbox(false, 200)
      api.fx.clearDim()
    }],
  ])
}

export function characterIntro(ctx: CinematicContext): CinematicDef {
  return def('character_intro', 1400, [
    [0, (api) => {
      const who = ctx.attacker ?? api.player()
      api.letterbox(true, 140)
      api.camera.slamZoom(who.x, who.y - 30, 1.7)
      api.fx.aura(who.x, who.y - 50, who.def.accent)
      api.audio.stinger('charge')
    }],
    [700, (api) => {
      const who = ctx.attacker ?? api.player()
      api.fx.title(who.def.name.toUpperCase(), { y: 200, size: 48, duration: 500 })
    }],
    [1200, (api) => {
      api.letterbox(false, 160)
    }],
  ])
}
