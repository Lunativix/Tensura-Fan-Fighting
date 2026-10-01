import { MUSIC_TRACKS, trackById } from './catalog.ts'
import { TEMPEST_FIGHTERS } from './scales.ts'
import { BattleType, MusicRole, type MusicContext, type MusicResolveResult, type MusicTrackDef } from './types.ts'

const FALLBACK = {
  menu: 'menu.main',
  explore: 'explore.jura',
  battle: 'battle.normal',
  boss: 'boss.orc_disaster',
  victory: 'victory.normal',
  defeat: 'defeat.normal',
} as const

function family(id: string): string {
  const dot = id.indexOf('.')
  return dot >= 0 ? id.slice(0, dot) : id
}

export function claymanTrackForPhase(phase: number): string {
  if (phase >= 3) {
    return 'boss.clayman_final'
  }
  if (phase >= 2) {
    return 'boss.clayman_p2'
  }
  return 'boss.clayman_p1'
}

export function phaseFromBossHp(ratio: number): number {
  if (ratio <= 0.3) {
    return 3
  }
  if (ratio <= 0.6) {
    return 2
  }
  return 1
}

function tempestTeam(ctx: MusicContext): boolean {
  const team = ctx.team ?? (ctx.playerCharacter ? [ctx.playerCharacter] : [])
  let n = 0
  for (const id of team) {
    if (TEMPEST_FIGHTERS.has(id)) {
      n += 1
    }
  }
  return n >= 2
}

function score(track: MusicTrackDef, ctx: ScoreCtx): number {
  let pts = 0
  if (track.category !== ctx.role && !(ctx.role === MusicRole.BOSS && track.category === MusicRole.BOSS)) {
    if (ctx.role === MusicRole.BATTLE && track.category === MusicRole.BATTLE) {
      pts += 4
    } else if (ctx.role === MusicRole.EXPLORATION && track.category === MusicRole.EXPLORATION) {
      pts += 4
    } else if (ctx.role === MusicRole.MENU && track.category === MusicRole.MENU) {
      pts += 4
    } else if (ctx.role === MusicRole.CINEMATIC && track.category === MusicRole.CINEMATIC) {
      pts += 4
    } else {
      return -1
    }
  } else {
    pts += 8
  }
  if (ctx.boss && track.boss === ctx.boss) {
    pts += 50
  }
  if (ctx.phase && track.phase === ctx.phase) {
    pts += 20
  }
  if (ctx.battleType && track.battleType === ctx.battleType) {
    pts += 12
  }
  if (ctx.location && track.location === ctx.location) {
    pts += 14
  }
  if (ctx.stageId && track.location === ctx.stageId) {
    pts += 10
  }
  if (ctx.arc && track.arc === ctx.arc) {
    pts += 10
  }
  if (ctx.character && track.character === ctx.character) {
    pts += 16
  }
  if (ctx.minIntensityNeed && (track.minIntensity ?? 0) > ctx.minIntensityNeed) {
    pts -= 8
  }
  return pts
}

interface ScoreCtx extends MusicContext {
  minIntensityNeed?: number
}

function best(ctx: ScoreCtx, ids: string[], role: MusicContext['role']): MusicResolveResult {
  let winner: MusicTrackDef | null = null
  let bestPts = -1
  const pool = ids.length > 0
    ? ids.map((id) => trackById(id)).filter((track): track is MusicTrackDef => Boolean(track))
    : MUSIC_TRACKS.filter((track) => track.category === role)
  for (const track of pool) {
    const pts = score(track, { ...ctx, role })
    if (pts > bestPts) {
      bestPts = pts
      winner = track
    }
  }
  if (!winner) {
    return { trackId: fallbackFor(role), silence: false, reason: 'fallback' }
  }
  return { trackId: winner.id, silence: false, reason: winner.id }
}

function fallbackFor(role: MusicContext['role']): string {
  if (role === MusicRole.MENU) {
    return FALLBACK.menu
  }
  if (role === MusicRole.BATTLE) {
    return FALLBACK.battle
  }
  if (role === MusicRole.BOSS) {
    return FALLBACK.boss
  }
  if (role === MusicRole.VICTORY) {
    return FALLBACK.victory
  }
  if (role === MusicRole.DEFEAT) {
    return FALLBACK.defeat
  }
  return FALLBACK.explore
}

export function resolveMusic(ctx: MusicContext): MusicResolveResult {
  if (ctx.role === MusicRole.SILENCE) {
    return { trackId: null, silence: true, reason: 'silence' }
  }

  if (ctx.role === MusicRole.VICTORY) {
    if (ctx.battleType === BattleType.BOSS || ctx.battleType === BattleType.FINAL_BOSS || ctx.boss) {
      return { trackId: 'victory.boss', silence: false, reason: 'victory-boss' }
    }
    if (ctx.arc) {
      return { trackId: 'victory.story', silence: false, reason: 'victory-story' }
    }
    return { trackId: 'victory.normal', silence: false, reason: 'victory' }
  }
  if (ctx.role === MusicRole.DEFEAT) {
    return { trackId: ctx.arc ? 'defeat.story' : 'defeat.normal', silence: false, reason: 'defeat' }
  }

  if ((ctx.role === MusicRole.BOSS || ctx.role === MusicRole.BATTLE) && (ctx.boss === 'clayman' || ctx.enemy === 'clayman')) {
    return { trackId: claymanTrackForPhase(ctx.phase ?? 1), silence: false, reason: 'clayman-phase' }
  }
  if ((ctx.role === MusicRole.BOSS || ctx.role === MusicRole.BATTLE) && (ctx.boss === 'orc_disaster' || ctx.enemy === 'orc_disaster')) {
    return { trackId: 'boss.orc_disaster', silence: false, reason: 'orc-disaster' }
  }
  if ((ctx.role === MusicRole.BOSS || ctx.role === MusicRole.BATTLE) && (ctx.boss === 'charybdis' || ctx.enemy === 'charybdis')) {
    return { trackId: 'boss.charybdis', silence: false, reason: 'charybdis' }
  }

  if (ctx.role === MusicRole.BOSS) {
    return best(ctx, [], MusicRole.BOSS)
  }

  if (ctx.role === MusicRole.CINEMATIC) {
    if (ctx.character === 'veldora' || ctx.storyEvent === 'veldora') {
      return { trackId: 'theme.veldora', silence: false, reason: 'veldora' }
    }
    if (ctx.character === 'diablo' || ctx.storyEvent === 'diablo') {
      return { trackId: 'theme.diablo', silence: false, reason: 'diablo' }
    }
    if (ctx.character === 'milim' || ctx.storyEvent === 'milim') {
      return { trackId: 'theme.milim', silence: false, reason: 'milim' }
    }
    if (ctx.arc === 'demon_lord' || ctx.storyEvent === 'harvest') {
      return { trackId: 'theme.rimuru_evolution', silence: false, reason: 'harvest' }
    }
    if (ctx.location === 'walpurgis' || ctx.arc === 'walpurgis') {
      return { trackId: 'walpurgis.entrance', silence: false, reason: 'walpurgis' }
    }
    return best(ctx, [], MusicRole.CINEMATIC)
  }

  if (ctx.role === MusicRole.MENU) {
    if (ctx.storyEvent === 'boot') {
      return { trackId: 'menu.boot', silence: false, reason: 'boot' }
    }
    if (ctx.storyEvent === 'story-select') {
      return { trackId: 'menu.story', silence: false, reason: 'story-menu' }
    }
    if (ctx.storyEvent === 'character-select') {
      return { trackId: 'menu.select', silence: false, reason: 'select' }
    }
    if (ctx.storyEvent === 'shop') {
      return { trackId: 'menu.shop', silence: false, reason: 'shop' }
    }
    if (ctx.storyEvent === 'collection') {
      return { trackId: 'menu.select', silence: false, reason: 'collection' }
    }
    if (ctx.storyEvent === 'summon') {
      return { trackId: 'menu.summon', silence: false, reason: 'summon' }
    }
    return { trackId: 'menu.main', silence: false, reason: 'menu' }
  }

  if (ctx.role === MusicRole.DIALOGUE) {
    if (ctx.location === 'walpurgis' || ctx.arc === 'walpurgis') {
      return { trackId: 'walpurgis.dialogue', silence: false, reason: 'walpurgis-talk' }
    }
    return { trackId: null, silence: false, reason: 'keep-and-duck' }
  }

  if (ctx.role === MusicRole.BATTLE) {
    if (ctx.arc === 'ogres') {
      return { trackId: 'battle.ogres', silence: false, reason: 'ogres' }
    }
    if (ctx.arc === 'sealed_cave' || ctx.location === 'sealed_cave') {
      return { trackId: 'battle.first', silence: false, reason: 'first-battle' }
    }
    if (tempestTeam(ctx) || ctx.location === 'tempest_city' || ctx.arc === 'tempest') {
      return { trackId: 'battle.tempest', silence: false, reason: 'tempest-team' }
    }
    if (ctx.battleType === BattleType.PVE_WAVE) {
      return { trackId: 'battle.pve', silence: false, reason: 'pve-wave' }
    }
    return { trackId: 'battle.normal', silence: false, reason: 'battle' }
  }

  if (ctx.arc === 'prologue') {
    return { trackId: 'explore.prologue', silence: false, reason: 'prologue' }
  }
  if (ctx.location === 'sealed_cave' || ctx.stageId === 'sealed_cave' || ctx.arc === 'sealed_cave') {
    if ((ctx.intensity ?? 0) >= 2) {
      return { trackId: 'explore.sealed_cave_danger', silence: false, reason: 'cave-danger' }
    }
    return { trackId: 'explore.sealed_cave', silence: false, reason: 'cave' }
  }
  if (ctx.arc === 'goblins') {
    return { trackId: 'explore.goblin', silence: false, reason: 'goblins' }
  }
  if (ctx.arc === 'falmuth' || ctx.location === 'tempest_invasion' || ctx.stageId === 'tempest_invasion') {
    return { trackId: 'explore.farmus', silence: false, reason: 'farmus' }
  }
  if (ctx.arc === 'walpurgis' || ctx.location === 'walpurgis' || ctx.stageId === 'walpurgis') {
    if ((ctx.intensity ?? 0) >= 2) {
      return { trackId: 'walpurgis.tension', silence: false, reason: 'walpurgis-tension' }
    }
    return { trackId: 'walpurgis.entrance', silence: false, reason: 'walpurgis-explore' }
  }
  if (ctx.arc === 'clayman') {
    return { trackId: 'theme.clayman', silence: false, reason: 'clayman-map' }
  }
  if (ctx.location === 'tempest_city' || ctx.stageId === 'tempest_city') {
    if (ctx.arc === 'tempest') {
      return { trackId: 'explore.tempest_village', silence: false, reason: 'village' }
    }
    return { trackId: 'explore.tempest_city', silence: false, reason: 'city' }
  }
  if (ctx.character === 'clayman') {
    return { trackId: 'theme.clayman', silence: false, reason: 'clayman-theme' }
  }

  return best(ctx, [], ctx.role === MusicRole.EXPLORATION ? MusicRole.EXPLORATION : ctx.role)
}

export function sameMusicFamily(a: string | null, b: string | null): boolean {
  if (!a || !b) {
    return false
  }
  return family(a) === family(b)
}

export { FALLBACK }
