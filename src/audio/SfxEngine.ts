import { audio } from './AudioManager.ts'
import type { SfxBusId, SfxPlayOpts, SfxRecipe, ToneLayer } from './SfxTypes.ts'
import { LOGICAL_WIDTH } from '../engine/Time.ts'

interface LiveVoice {
  stopAt: number
  priority: number
  bus: SfxBusId
  stop: () => void
}

const MAX_VOICES = 18
const PITCH_JITTER = 0.035
const VOL_JITTER = 0.07

export class SfxEngine {
  private voices: LiveVoice[] = []
  private lastPlayed = new Map<string, number>()
  private liveCount = new Map<string, number>()
  private bags = new Map<string, number[]>()
  private lastPick = new Map<string, number>()
  private white: AudioBuffer | null = null
  private brown: AudioBuffer | null = null
  private variants = new Map<string, SfxRecipe[]>()

  registerVariants(key: string, recipes: SfxRecipe[]): void {
    this.variants.set(key, recipes)
  }

  pickVariant(key: string): SfxRecipe | undefined {
    const list = this.variants.get(key)
    if (!list || list.length === 0) {
      return undefined
    }
    const index = this.nextIndex(key, list.length)
    return list[index]
  }

  play(patch: SfxRecipe, opts: SfxPlayOpts = {}): void {
    audio.unlock()
    const ctx = audio.context
    const dest = audio.bus(patch.bus)
    if (!ctx || !dest) {
      return
    }
    const nowMs = performance.now()
    const last = this.lastPlayed.get(patch.id) ?? -9999
    if (nowMs - last < (patch.cooldownMs ?? 40)) {
      return
    }
    const living = this.liveCount.get(patch.id) ?? 0
    if (living >= (patch.maxInstances ?? 2)) {
      return
    }
    this.prune(ctx.currentTime)
    const layerBudget = patch.layers.length
    if (this.voiceLoad() + layerBudget > MAX_VOICES) {
      this.steal(patch.priority)
      if (this.voiceLoad() + layerBudget > MAX_VOICES) {
        return
      }
    }
    if (patch.duckMs) {
      audio.duckGameplay(patch.duckAmount ?? 0.28, patch.duckMs)
    }
    const pitch = (opts.pitch ?? 1) * (1 + (Math.random() * 2 - 1) * PITCH_JITTER)
    const vol = (opts.volume ?? 1) * (1 + (Math.random() * 2 - 1) * VOL_JITTER)
    const pan = panFromX(opts.x)
    const when = opts.when ?? ctx.currentTime
    const nodes: Array<{ stop: () => void }> = []
    let end = when
    for (const layer of patch.layers) {
      const started = this.spawnLayer(ctx, dest, layer, when, pan, pitch, vol)
      if (started) {
        nodes.push(started)
        end = Math.max(end, started.stopAt)
      }
    }
    if (nodes.length === 0) {
      return
    }
    this.lastPlayed.set(patch.id, nowMs)
    this.liveCount.set(patch.id, living + 1)
    let released = false
    const release = (): void => {
      if (released) {
        return
      }
      released = true
      this.liveCount.set(patch.id, Math.max(0, (this.liveCount.get(patch.id) ?? 1) - 1))
    }
    const voice: LiveVoice = {
      stopAt: end,
      priority: patch.priority,
      bus: patch.bus,
      stop: () => {
        for (const node of nodes) {
          node.stop()
        }
        release()
      },
    }
    this.voices.push(voice)
    window.setTimeout(release, Math.max(30, (end - ctx.currentTime) * 1000))
  }

  playPick(key: string, opts: SfxPlayOpts = {}): void {
    const patch = this.pickVariant(key)
    if (patch) {
      this.play(patch, opts)
    }
  }

  stopBus(bus: SfxBusId): void {
    const doomed = this.voices.filter((voice) => voice.bus === bus)
    for (const voice of doomed) {
      voice.stop()
    }
    this.voices = this.voices.filter((voice) => voice.bus !== bus)
  }

  nextIndex(key: string, n: number): number {
    if (n <= 1) {
      return 0
    }
    let bag = this.bags.get(key)
    if (!bag || bag.length === 0) {
      bag = shuffled(n)
      const prev = this.lastPick.get(key)
      if (prev !== undefined && bag[bag.length - 1] === prev && bag.length > 1) {
        const swap = bag[0]!
        bag[0] = prev
        bag[bag.length - 1] = swap
      }
      this.bags.set(key, bag)
    }
    const pick = bag.pop() ?? 0
    this.lastPick.set(key, pick)
    return pick
  }

  private voiceLoad(): number {
    return this.voices.length
  }

  private prune(now: number): void {
    this.voices = this.voices.filter((voice) => voice.stopAt > now - 0.02)
  }

  private steal(priority: number): void {
    let weakest: LiveVoice | undefined
    for (const voice of this.voices) {
      if (voice.priority < priority && (!weakest || voice.priority < weakest.priority || voice.stopAt < weakest.stopAt)) {
        weakest = voice
      }
    }
    if (!weakest) {
      weakest = this.voices[0]
    }
    if (!weakest) {
      return
    }
    weakest.stop()
    this.voices = this.voices.filter((voice) => voice !== weakest)
  }

  private spawnLayer(
    ctx: AudioContext,
    dest: GainNode,
    layer: ToneLayer,
    when: number,
    pan: number,
    pitch: number,
    vol: number,
  ): { stop: () => void; stopAt: number } | null {
    const t0 = when + (layer.delay ?? 0)
    const dur = Math.max(0.03, layer.duration)
    const stopAt = t0 + dur + 0.03
    const panner = ctx.createStereoPanner()
    panner.pan.value = pan
    const env = ctx.createGain()
    env.connect(panner)
    panner.connect(dest)
    const peak = Math.max(0.0008, layer.gain * vol)
    const atk = layer.attack ?? 0.006
    const dec = layer.decay ?? 0.04
    const sus = Math.max(0.0008, (layer.sustain ?? 0.45) * peak)
    env.gain.setValueAtTime(0.0001, t0)
    env.gain.exponentialRampToValueAtTime(peak, t0 + atk)
    env.gain.exponentialRampToValueAtTime(sus, t0 + atk + dec)
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)

    const stoppers: Array<() => void> = []
    if (layer.noise) {
      const src = ctx.createBufferSource()
      src.buffer = this.noiseBuffer(ctx, layer.noise)
      src.loop = true
      const filter = ctx.createBiquadFilter()
      filter.type = layer.filterType ?? 'bandpass'
      const f0 = Math.max(40, (layer.filterFreq ?? layer.freq ?? 800) * pitch)
      filter.frequency.setValueAtTime(f0, t0)
      if (layer.filterFreqEnd || layer.freqEnd) {
        filter.frequency.exponentialRampToValueAtTime(
          Math.max(40, (layer.filterFreqEnd ?? layer.freqEnd ?? f0) * pitch),
          t0 + dur,
        )
      }
      filter.Q.value = layer.q ?? 2.6
      src.connect(filter)
      filter.connect(env)
      src.start(t0)
      src.stop(stopAt)
      stoppers.push(() => {
        try {
          src.stop()
        } catch {
          // already stopped
        }
      })
    } else {
      const osc = ctx.createOscillator()
      osc.type = layer.wave ?? 'sine'
      const f0 = Math.max(20, (layer.freq ?? 220) * pitch)
      osc.frequency.setValueAtTime(f0, t0)
      if (layer.freqEnd) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, layer.freqEnd * pitch), t0 + dur)
      }
      if (layer.fmRatio && layer.fmGain) {
        const mod = ctx.createOscillator()
        const modGain = ctx.createGain()
        mod.frequency.value = f0 * layer.fmRatio
        modGain.gain.value = layer.fmGain
        mod.connect(modGain)
        modGain.connect(osc.frequency)
        mod.start(t0)
        mod.stop(stopAt)
        stoppers.push(() => {
          try {
            mod.stop()
          } catch {
            // already stopped
          }
        })
      }
      if (layer.filterType) {
        const filter = ctx.createBiquadFilter()
        filter.type = layer.filterType
        filter.frequency.value = (layer.filterFreq ?? f0) * pitch
        if (layer.filterFreqEnd) {
          filter.frequency.exponentialRampToValueAtTime(Math.max(40, layer.filterFreqEnd * pitch), t0 + dur)
        }
        filter.Q.value = layer.q ?? 1.2
        osc.connect(filter)
        filter.connect(env)
      } else {
        osc.connect(env)
      }
      osc.start(t0)
      osc.stop(stopAt)
      stoppers.push(() => {
        try {
          osc.stop()
        } catch {
          // already stopped
        }
      })
    }

    return {
      stopAt,
      stop: () => {
        for (const stop of stoppers) {
          stop()
        }
        try {
          env.disconnect()
          panner.disconnect()
        } catch {
          // already disconnected
        }
      },
    }
  }

  private noiseBuffer(ctx: AudioContext, kind: 'white' | 'brown'): AudioBuffer {
    if (kind === 'brown') {
      if (!this.brown || this.brown.sampleRate !== ctx.sampleRate) {
        this.brown = makeBrown(ctx)
      }
      return this.brown
    }
    if (!this.white || this.white.sampleRate !== ctx.sampleRate) {
      this.white = makeWhite(ctx)
    }
    return this.white
  }
}

function panFromX(x: number | undefined): number {
  if (x === undefined) {
    return 0
  }
  return Math.max(-0.85, Math.min(0.85, (x / LOGICAL_WIDTH) * 2 - 1))
}

function shuffled(n: number): number[] {
  const items = Array.from({ length: n }, (_, i) => i)
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const a = items[i]!
    items[i] = items[j]!
    items[j] = a
  }
  return items
}

function makeWhite(ctx: AudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1
  }
  return buffer
}

function makeBrown(ctx: AudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  let last = 0
  for (let i = 0; i < data.length; i += 1) {
    const white = Math.random() * 2 - 1
    last = (last + 0.02 * white) / 1.02
    data[i] = last * 3.5
  }
  return buffer
}

export const sfxEngine = new SfxEngine()
