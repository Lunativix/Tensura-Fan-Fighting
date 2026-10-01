import { audio } from '../AudioManager.ts'
import { trackById } from './catalog.ts'
import { canReplace, MUSIC_PRIORITY } from './priority.ts'
import { phaseFromBossHp, resolveMusic, sameMusicFamily } from './resolve.ts'
import { fighterMotifId } from './scales.ts'
import { MusicDeck } from './MusicSynth.ts'
import {
  BattleType,
  defaultMusicSettings,
  MusicEvent,
  MusicRole,
  type BattleTypeId,
  type MusicContext,
  type MusicDebugSnapshot,
  type MusicEventId,
  type MusicSettingsSlice,
} from './types.ts'
import type { FighterIdValue } from '../../types/game.ts'

const CROSSFADE = 1.15
const STINGER_DUCK = 0.55

export class MusicManager {
  private a: MusicDeck | null = null
  private b: MusicDeck | null = null
  private usingA = true
  private ctx: MusicContext = { role: MusicRole.SILENCE }
  private trackId: string | null = null
  private intensity = 0
  private targetIntensity = 0
  private phase = 1
  private motif = 'rimuru'
  private duck = 1
  private fading = false
  private timer: number | null = null
  private pending: MusicContext | null = null
  private settings: MusicSettingsSlice = defaultMusicSettings()
  private lastHpBump = 0
  private mix = 1
  private lastPriority = 0
  private lastSentIntensity = -1

  get snapshot(): MusicDebugSnapshot {
    return {
      track: this.trackId,
      role: this.ctx.role,
      intensity: Number((this.intensity * 5).toFixed(2)),
      phase: this.phase,
      motif: this.motif,
      volume: this.mix,
      duck: this.duck,
      fading: this.fading,
    }
  }

  applySettings(slice: Partial<MusicSettingsSlice>): void {
    this.settings = { ...this.settings, ...slice }
    this.applyMix()
  }

  playContext(next: MusicContext, force = false): void {
    this.ctx = { ...this.ctx, ...next, role: next.role }
    if (next.role === MusicRole.MENU || next.role === MusicRole.EXPLORATION || next.role === MusicRole.DIALOGUE) {
      if (next.boss === undefined) {
        this.ctx.boss = undefined
      }
      if (next.enemy === undefined) {
        this.ctx.enemy = undefined
      }
      if (next.battleType === undefined) {
        this.ctx.battleType = undefined
      }
    }
    if (next.phase !== undefined) {
      this.phase = next.phase
    }
    if (next.playerCharacter) {
      this.motif = fighterMotifId(next.playerCharacter)
    }
    if (next.intensity !== undefined) {
      this.targetIntensity = clamp01(next.intensity / 5)
      if (!this.settings.musicDynamic) {
        this.targetIntensity = 0.45
      }
    } else if (this.trackId === null) {
      this.targetIntensity = defaultIntensity(next.role) / 5
    }
    if (this.trackId === null) {
      this.intensity = this.targetIntensity
    }
    audio.unlock()
    if (!audio.context || !audio.musicOut) {
      this.pending = this.ctx
      return
    }
    this.ensureDecks()
    this.startClock()
    if (this.pending) {
      this.pending = null
    }

    const resolved = resolveMusic(this.ctx)
    if (resolved.silence) {
      this.fadeOut()
      this.trackId = null
      return
    }
    if (resolved.reason === 'keep-and-duck') {
      this.setDialogueDuck(true)
      return
    }
    if (!resolved.trackId) {
      return
    }
    const incomingPri = MUSIC_PRIORITY[this.ctx.role] ?? 20
    const family = sameMusicFamily(this.trackId, resolved.trackId)
    if (!force && this.trackId && !canReplace(this.lastPriority, incomingPri, family) && resolved.trackId !== this.trackId) {
      this.live()?.setIntensity(this.scaledIntensity(), false)
      this.live()?.setMotif(this.motif)
      return
    }
    if (resolved.trackId === this.trackId) {
      this.live()?.setMotif(this.motif)
      this.live()?.setIntensity(this.scaledIntensity(), false)
      this.applyMix()
      return
    }
    this.crossfadeTo(resolved.trackId)
    this.lastPriority = incomingPri
  }

  ensureStarted(): void {
    audio.unlock()
    if (this.pending) {
      const held = this.pending
      this.pending = null
      this.playContext(held, true)
    } else if (this.trackId && audio.context) {
      this.ensureDecks()
      this.startClock()
    }
  }

  setCombatState(playerHp: number, enemyHp: number, combo: number): void {
    if (!this.settings.musicDynamic) {
      return
    }
    const now = performance.now()
    if (now - this.lastHpBump < 180) {
      return
    }
    this.lastHpBump = now
    const danger = 1 - Math.min(playerHp, enemyHp)
    let level = 2
    if (combo >= 4 || danger > 0.35) {
      level = 3
    }
    if (playerHp < 0.3 || enemyHp < 0.3 || combo >= 8) {
      level = 4
    }
    if (playerHp < 0.18 && enemyHp < 0.4) {
      level = 5
    }
    this.targetIntensity = level / 5
    this.live()?.setIntensity(this.scaledIntensity(), false)
    if (this.ctx.boss && enemyHp > 0) {
      const nextPhase = phaseFromBossHp(enemyHp)
      if (nextPhase !== this.phase) {
        this.phase = nextPhase
        this.event(MusicEvent.BossPhaseChange)
      }
    }
  }

  setActiveCharacter(id: FighterIdValue): void {
    this.motif = fighterMotifId(id)
    this.ctx = { ...this.ctx, playerCharacter: id }
    this.live()?.setMotif(this.motif)
  }

  setBoss(id: string, hpRatio = 1): void {
    this.phase = phaseFromBossHp(hpRatio)
    this.playContext({
      ...this.ctx,
      role: MusicRole.BOSS,
      boss: id,
      enemy: id,
      battleType: id === 'clayman' ? BattleType.FINAL_BOSS : BattleType.BOSS,
      phase: this.phase,
      intensity: Math.max(this.ctx.intensity ?? 2, 3),
    })
  }

  event(kind: MusicEventId, extra: Partial<MusicContext> = {}): void {
    if (kind === MusicEvent.DialogueStart) {
      this.setDialogueDuck(true)
      return
    }
    if (kind === MusicEvent.DialogueEnd) {
      this.setDialogueDuck(false)
      return
    }
    if (kind === MusicEvent.CharacterSwitch && extra.playerCharacter) {
      this.setActiveCharacter(extra.playerCharacter)
      return
    }
    if (kind === MusicEvent.BossSpawn && extra.boss) {
      this.setBoss(extra.boss, extra.intensity !== undefined ? extra.intensity / 5 : 1)
      return
    }
    if (kind === MusicEvent.BossPhaseChange) {
      if (this.ctx.boss === 'clayman') {
        this.playContext({ ...this.ctx, role: MusicRole.BOSS, phase: this.phase, boss: 'clayman' }, true)
      } else {
        this.targetIntensity = Math.min(1, this.targetIntensity + 0.15)
        this.live()?.setIntensity(this.scaledIntensity(), false)
      }
      return
    }
    if (kind === MusicEvent.Transformation || kind === MusicEvent.Ultimate) {
      this.stinger(kind === MusicEvent.Transformation ? 'transform' : 'ultimate')
      this.targetIntensity = Math.min(1, this.targetIntensity + 0.2)
      this.live()?.setIntensity(this.scaledIntensity(), false)
      return
    }
    if (kind === MusicEvent.Victory) {
      this.playContext({ ...this.ctx, ...extra, role: MusicRole.VICTORY }, true)
      return
    }
    if (kind === MusicEvent.Defeat) {
      this.playContext({ ...this.ctx, ...extra, role: MusicRole.DEFEAT }, true)
      return
    }
    if (kind === MusicEvent.BattleStart) {
      this.playContext({
        ...this.ctx,
        ...extra,
        role: extra.boss ? MusicRole.BOSS : MusicRole.BATTLE,
        intensity: extra.intensity ?? 2,
        battleType: extra.battleType ?? BattleType.NORMAL,
      }, true)
    }
  }

  stinger(kind: 'boss' | 'transform' | 'reveal' | 'ultimate' | 'victory'): void {
    audio.unlock()
    const ctx = audio.context
    const dest = audio.musicOut
    if (!ctx || !dest) {
      return
    }
    audio.duckMusic(STINGER_DUCK, 0.9)
    const now = ctx.currentTime
    const freqs = kind === 'boss'
      ? [82, 123, 164]
      : kind === 'transform'
        ? [196, 247, 330, 392]
        : kind === 'reveal'
          ? [110, 165, 220]
          : kind === 'ultimate'
            ? [147, 220, 294, 392]
            : [262, 330, 392]
    freqs.forEach((hz, i) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = kind === 'boss' ? 'sawtooth' : 'triangle'
      osc.frequency.value = hz
      const t = now + i * 0.08
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.07, t + 0.03)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45)
      osc.connect(g)
      g.connect(dest)
      osc.start(t)
      osc.stop(t + 0.5)
    })
  }

  setDialogueDuck(on: boolean): void {
    this.duck = on ? 0.42 : 1
    if (on) {
      audio.duckMusic(0.42)
    } else {
      audio.restoreMusic()
    }
  }

  pulse(): void {
    this.ensureStarted()
  }

  stop(): void {
    this.fadeOut()
    this.trackId = null
    this.ctx = { role: MusicRole.SILENCE }
  }

  debugLine(): string {
    const snap = this.snapshot
    return `music ${snap.track ?? '—'}  ${snap.role}  i${snap.intensity}  p${snap.phase}  ${snap.motif}${snap.fading ? '  xf' : ''}`
  }

  private live(): MusicDeck | null {
    return this.usingA ? this.a : this.b
  }

  private idle(): MusicDeck | null {
    return this.usingA ? this.b : this.a
  }

  private ensureDecks(): void {
    const ctx = audio.context
    const dest = audio.musicOut
    if (!ctx || !dest) {
      return
    }
    if (!this.a) {
      this.a = new MusicDeck(ctx, dest)
    }
    if (!this.b) {
      this.b = new MusicDeck(ctx, dest)
    }
    audio.stopMusic()
  }

  private startClock(): void {
    if (this.timer !== null) {
      return
    }
    this.timer = window.setInterval(() => {
      this.intensity += (this.targetIntensity - this.intensity) * 0.08
      const sent = this.scaledIntensity()
      if (Math.abs(sent - this.lastSentIntensity) > 0.08) {
        this.lastSentIntensity = sent
        this.live()?.setIntensity(sent, false)
      }
      this.a?.tick()
      this.b?.tick()
    }, 40)
  }

  private scaledIntensity(): number {
    return Math.max(0, Math.min(5, this.intensity * 5 + 0.01))
  }

  private applyMix(): void {
    const role = this.ctx.role
    let mul = 1
    if (role === MusicRole.MENU || role === MusicRole.EXPLORATION) {
      mul = this.settings.menuMusicVolume
    } else if (role === MusicRole.CINEMATIC || role === MusicRole.VICTORY || role === MusicRole.DEFEAT) {
      mul = this.settings.cinematicMusicVolume
    } else {
      mul = this.settings.battleMusicVolume
    }
    this.mix = mul
    const deck = this.live()
    const track = this.trackId ? trackById(this.trackId) : undefined
    if (deck && track) {
      deck.fade(track.volume * mul, 0.25)
    }
  }

  private crossfadeTo(id: string): void {
    const track = trackById(id)
    const next = this.idle()
    const prev = this.live()
    if (!track || !next || !prev) {
      return
    }
    this.fading = true
    next.setTrack(track, this.motif, this.scaledIntensity())
    next.fade(track.volume * this.mixFor(track.category), CROSSFADE)
    prev.fade(0, CROSSFADE)
    this.usingA = !this.usingA
    this.trackId = id
    window.setTimeout(() => {
      this.fading = false
      prev.stop(0.05)
    }, CROSSFADE * 1000 + 40)
  }

  private mixFor(role: MusicContext['role']): number {
    if (role === MusicRole.MENU || role === MusicRole.EXPLORATION) {
      return this.settings.menuMusicVolume
    }
    if (role === MusicRole.CINEMATIC || role === MusicRole.VICTORY || role === MusicRole.DEFEAT) {
      return this.settings.cinematicMusicVolume
    }
    return this.settings.battleMusicVolume
  }

  private fadeOut(): void {
    this.a?.fade(0, 0.6)
    this.b?.fade(0, 0.6)
  }
}

function defaultIntensity(role: MusicContext['role']): number {
  if (role === MusicRole.BOSS) {
    return 3
  }
  if (role === MusicRole.BATTLE) {
    return 2
  }
  if (role === MusicRole.CINEMATIC) {
    return 2
  }
  return 1
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) {
    return 0
  }
  return Math.min(1, Math.max(0, n))
}

export const musicManager = new MusicManager()
;(window as unknown as { ensuraMusic?: MusicManager }).ensuraMusic = musicManager

export function battleTypeFrom(cpuId: string, ranked: boolean, training: boolean): BattleTypeId {
  if (training) {
    return BattleType.NORMAL
  }
  if (ranked) {
    return BattleType.HARD
  }
  if (cpuId === 'guy' || cpuId === 'milim' || cpuId === 'veldora' || cpuId === 'diablo') {
    return BattleType.ELITE
  }
  return BattleType.NORMAL
}
