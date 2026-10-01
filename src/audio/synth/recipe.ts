import type { SfxRecipe, ToneLayer } from '../SfxTypes.ts'
import { SfxBus, SfxPriority } from '../SfxTypes.ts'

export function recipe(
  id: string,
  layers: ToneLayer[],
  extra: Partial<Omit<SfxRecipe, 'id' | 'layers'>> = {},
): SfxRecipe {
  return {
    id,
    bus: extra.bus ?? SfxBus.SFX,
    priority: extra.priority ?? SfxPriority.IMPACT,
    layers,
    maxInstances: extra.maxInstances ?? 2,
    cooldownMs: extra.cooldownMs ?? 40,
    duckMs: extra.duckMs,
    duckAmount: extra.duckAmount,
  }
}

export function tone(freq: number, duration: number, gain: number, extra: Partial<ToneLayer> = {}): ToneLayer {
  return { freq, duration, gain, wave: extra.wave ?? 'triangle', ...extra }
}

export function sweep(
  freq: number,
  freqEnd: number,
  duration: number,
  gain: number,
  extra: Partial<ToneLayer> = {},
): ToneLayer {
  return { freq, freqEnd, duration, gain, wave: extra.wave ?? 'sawtooth', attack: 0.006, release: 0.08, ...extra }
}

export function noise(
  freq: number,
  duration: number,
  gain: number,
  extra: Partial<ToneLayer> & { color?: 'white' | 'brown' } = {},
): ToneLayer {
  const { color, ...rest } = extra
  return {
    noise: color ?? 'white',
    freq,
    duration,
    gain,
    filterType: rest.filterType ?? 'bandpass',
    filterFreq: rest.filterFreq ?? freq,
    q: rest.q ?? 3.2,
    attack: 0.004,
    release: 0.1,
    ...rest,
  }
}

export function click(freq: number, gain = 0.12): ToneLayer {
  return tone(freq, 0.055, gain, { wave: 'square', attack: 0.001, decay: 0.02, sustain: 0.15, release: 0.03 })
}

export function thud(freq: number, gain: number, duration = 0.18): ToneLayer {
  return sweep(freq, Math.max(28, freq * 0.35), duration, gain, {
    wave: 'sine',
    attack: 0.002,
    release: 0.12,
  })
}

export function shimmer(freq: number, gain: number, duration = 0.22): ToneLayer {
  return tone(freq, duration, gain, { wave: 'sine', attack: 0.01, release: 0.14, delay: 0.01 })
}

export function grit(freq: number, gain: number, duration = 0.16, brown = false): ToneLayer {
  return noise(freq, duration, gain, { color: brown ? 'brown' : 'white', q: 1.8, filterType: 'lowpass', filterFreq: freq })
}
