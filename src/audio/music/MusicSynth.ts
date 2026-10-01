import { audio } from '../AudioManager.ts'
import { degreeToHz, motifFor } from './scales.ts'
import type { LayerPattern, MusicTrackDef } from './types.ts'

const LOOKAHEAD = 0.14
const MAX_VOICES = 14
const LAYERS = ['BASE', 'PERCUSSION', 'BRASS', 'CHOIR', 'MOTIF', 'CLIMAX'] as const

export class MusicDeck {
  readonly out: GainNode
  private readonly layers = new Map<string, GainNode>()
  private track: MusicTrackDef | null = null
  private motifId = 'rimuru'
  private intensity = 1
  private step = 0
  private nextTime = 0
  private voices = 0
  private noise: AudioBuffer | null = null
  private running = false

  constructor(ctx: AudioContext, dest: AudioNode) {
    this.out = ctx.createGain()
    this.out.gain.value = 0
    this.out.connect(dest)
    for (const id of LAYERS) {
      const g = ctx.createGain()
      g.gain.value = 0
      g.connect(this.out)
      this.layers.set(id, g)
    }
  }

  get currentId(): string | null {
    return this.track?.id ?? null
  }

  isRunning(): boolean {
    return this.running
  }

  setTrack(track: MusicTrackDef, motifId: string, intensity: number): void {
    this.track = track
    this.motifId = motifId
    this.intensity = intensity
    this.step = Math.floor(track.loopStart * 16)
    const ctx = audio.context
    if (ctx) {
      this.nextTime = ctx.currentTime + 0.05
      this.ensureNoise(ctx)
    }
    this.running = true
    this.applyLayerGains(true)
  }

  setIntensity(value: number, immediate = false): void {
    this.intensity = value
    this.applyLayerGains(immediate)
  }

  setMotif(id: string): void {
    this.motifId = id
  }

  fade(to: number, seconds: number): void {
    const ctx = audio.context
    if (!ctx) {
      return
    }
    const g = this.out.gain
    const now = ctx.currentTime
    g.cancelScheduledValues(now)
    g.setValueAtTime(g.value, now)
    g.linearRampToValueAtTime(Math.max(0, to), now + Math.max(0.05, seconds))
  }

  stop(seconds = 0.4): void {
    this.fade(0, seconds)
    this.running = false
    this.track = null
  }

  tick(): void {
    if (!this.running || !this.track) {
      return
    }
    const ctx = audio.context
    if (!ctx) {
      return
    }
    const track = this.track
    const stepDur = 60 / track.bpm / 4
    const horizon = ctx.currentTime + LOOKAHEAD
    while (this.nextTime < horizon) {
      this.schedule(ctx, track, this.nextTime, this.step)
      this.step += 1
      const loopSteps = track.bars * 16
      const loopStart = track.loopStart * 16
      if (this.step >= loopSteps) {
        this.step = loopStart
      }
      this.nextTime += stepDur
    }
  }

  private applyLayerGains(immediate: boolean): void {
    const ctx = audio.context
    if (!ctx) {
      return
    }
    const i = this.intensity
    const now = ctx.currentTime
    const set = (id: string, target: number): void => {
      const g = this.layers.get(id)
      if (!g) {
        return
      }
      g.gain.cancelScheduledValues(now)
      g.gain.setValueAtTime(g.gain.value, now)
      if (immediate) {
        g.gain.value = target
      } else {
        g.gain.linearRampToValueAtTime(target, now + 0.9)
      }
    }
    set('BASE', 1)
    set('PERCUSSION', i >= 1 ? Math.min(1, 0.35 + i * 0.18) : 0)
    set('BRASS', i >= 3 ? Math.min(1, (i - 2) * 0.4) : 0)
    set('CHOIR', i >= 4 ? Math.min(1, (i - 3) * 0.45) : 0)
    set('MOTIF', 0.55 + Math.min(0.45, i * 0.08))
    set('CLIMAX', i >= 5 ? 1 : 0)
  }

  private schedule(ctx: AudioContext, track: MusicTrackDef, time: number, step: number): void {
    const index = step % 16
    for (const layer of track.layers) {
      if (this.intensity + 0.01 < layer.minIntensity) {
        continue
      }
      const dest = this.layers.get(layer.id)
      if (!dest) {
        continue
      }
      const value = layer.steps[index] ?? 0
      if (value <= 0) {
        continue
      }
      if (layer.kind === 'perc') {
        this.hit(ctx, dest, value, time, (layer.gain ?? 1) * track.volume)
        continue
      }
      if (layer.kind === 'motif') {
        this.playMotif(ctx, dest, track, layer, index, time)
        continue
      }
      if (layer.kind === 'pad' && index === 0) {
        this.pad(ctx, dest, track, layer, time)
        continue
      }
      if (layer.kind === 'pad') {
        continue
      }
      const hz = degreeToHz(track.rootHz, track.scale, value, layer.octave)
      if (hz <= 0) {
        continue
      }
      const wave: OscillatorType = layer.kind === 'bass'
        ? 'triangle'
        : layer.kind === 'brass'
          ? 'sawtooth'
          : layer.kind === 'choir'
            ? 'sine'
            : 'triangle'
      const dur = layer.kind === 'bass' ? 0.22 : layer.kind === 'choir' ? 0.55 : 0.16
      this.tone(ctx, dest, hz, time, dur, (layer.gain ?? 1) * track.volume * 0.22, wave)
    }
  }

  private playMotif(ctx: AudioContext, dest: GainNode, track: MusicTrackDef, layer: LayerPattern, index: number, time: number): void {
    const motif = motifFor(this.motifId)
    const degree = motif.degrees[index % motif.degrees.length] ?? 0
    const gate = layer.steps[index] ?? 0
    if (gate <= 0 || degree <= 0) {
      return
    }
    const hz = degreeToHz(motif.rootHz, motif.scale, degree, layer.octave)
    this.tone(ctx, dest, hz, time, 0.28, (layer.gain ?? 1) * track.volume * 0.2, 'sine')
  }

  private pad(ctx: AudioContext, dest: GainNode, track: MusicTrackDef, layer: LayerPattern, time: number): void {
    const bar = 60 / track.bpm * 4 * 0.92
    const degrees = [1, 3, 5]
    for (const degree of degrees) {
      const hz = degreeToHz(track.rootHz, track.scale, degree, layer.octave)
      this.tone(ctx, dest, hz, time, bar, (layer.gain ?? 1) * track.volume * 0.08, 'sawtooth', 720)
    }
  }

  private hit(ctx: AudioContext, dest: GainNode, kind: number, time: number, amp: number): void {
    if (kind === 1 || kind === 5) {
      this.tone(ctx, dest, 78, time, 0.18, amp * 0.35, 'sine')
    }
    if (kind === 3) {
      this.tone(ctx, dest, 64, time, 0.28, amp * 0.4, 'sine')
      this.noiseBurst(ctx, dest, time, 0.12, amp * 0.18, 420, 1.2)
    }
    if (kind === 2) {
      this.noiseBurst(ctx, dest, time, 0.1, amp * 0.22, 1800, 0.7)
    }
    if (kind === 4 || kind === 5) {
      this.noiseBurst(ctx, dest, time, 0.04, amp * 0.1, 7000, 0.4)
    }
  }

  private tone(
    ctx: AudioContext,
    dest: AudioNode,
    hz: number,
    time: number,
    dur: number,
    amp: number,
    wave: OscillatorType,
    filterHz?: number,
  ): void {
    if (this.voices >= MAX_VOICES) {
      return
    }
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = wave
    osc.frequency.setValueAtTime(hz, time)
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, amp), time + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur)
    if (filterHz) {
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = filterHz
      osc.connect(filter)
      filter.connect(gain)
    } else {
      osc.connect(gain)
    }
    gain.connect(dest)
    osc.start(time)
    osc.stop(time + dur + 0.02)
    this.voices += 1
    osc.onended = () => {
      this.voices = Math.max(0, this.voices - 1)
      osc.disconnect()
      gain.disconnect()
    }
  }

  private noiseBurst(ctx: AudioContext, dest: AudioNode, time: number, dur: number, amp: number, freq: number, q: number): void {
    if (!this.noise || this.voices >= MAX_VOICES) {
      return
    }
    const src = ctx.createBufferSource()
    src.buffer = this.noise
    const filter = ctx.createBiquadFilter()
    filter.type = freq > 4000 ? 'highpass' : 'bandpass'
    filter.frequency.value = freq
    filter.Q.value = q
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(amp, time)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur)
    src.connect(filter)
    filter.connect(gain)
    gain.connect(dest)
    src.start(time)
    src.stop(time + dur + 0.02)
    this.voices += 1
    src.onended = () => {
      this.voices = Math.max(0, this.voices - 1)
    }
  }

  private ensureNoise(ctx: AudioContext): void {
    if (this.noise) {
      return
    }
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1
    }
    this.noise = buffer
  }
}
