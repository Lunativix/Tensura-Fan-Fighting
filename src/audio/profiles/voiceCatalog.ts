import { SfxBus, SfxPriority, type SfxRecipe } from '../SfxTypes.ts'
import { recipe, tone } from '../synth/recipe.ts'
import { SIGNATURES } from './signatures.ts'
import type { FighterIdValue } from '../../types/game.ts'
import type { DialogueEmotionId } from '../../dialogue/DialogueTypes.ts'
import { PLAYABLE_FIGHTERS } from '../../config/characters.ts'

interface VoiceColor {
  wave: OscillatorType
  sub?: OscillatorType
  baseHz: number
  offsets: readonly [number, number, number, number, number, number]
  dur: readonly [number, number]
  gain: number
  filterHz: number
  fmRatio?: number
  fmGain?: number
  group: number
}

/** Unique electronic talk palettes — not a shared blip with pitch-only variants. */
const COLOR: Record<FighterIdValue, VoiceColor> = {
  rimuru: {
    wave: 'sine', sub: 'triangle', baseHz: 428, offsets: [-28, -10, 8, 22, 40, 62],
    dur: [0.055, 0.09], gain: 0.085, filterHz: 2600, group: 3,
  },
  milim: {
    wave: 'square', sub: 'sine', baseHz: 640, offsets: [-40, -16, 10, 36, 70, 110],
    dur: [0.04, 0.07], gain: 0.07, filterHz: 3400, group: 2,
  },
  diablo: {
    wave: 'sine', sub: 'sawtooth', baseHz: 148, offsets: [-18, -6, 8, 16, 28, 42],
    dur: [0.07, 0.12], gain: 0.09, filterHz: 900, fmRatio: 3.2, fmGain: 18, group: 3,
  },
  benimaru: {
    wave: 'triangle', sub: 'sawtooth', baseHz: 276, offsets: [-22, -8, 12, 26, 44, 68],
    dur: [0.05, 0.09], gain: 0.08, filterHz: 1800, group: 3,
  },
  shion: {
    wave: 'square', sub: 'triangle', baseHz: 168, offsets: [-14, -4, 10, 20, 34, 50],
    dur: [0.08, 0.13], gain: 0.085, filterHz: 1100, group: 4,
  },
  veldora: {
    wave: 'sawtooth', sub: 'sine', baseHz: 92, offsets: [-12, -4, 6, 14, 24, 36],
    dur: [0.09, 0.15], gain: 0.1, filterHz: 700, group: 4,
  },
  hinata: {
    wave: 'sine', sub: 'triangle', baseHz: 512, offsets: [-24, -8, 10, 24, 42, 64],
    dur: [0.045, 0.085], gain: 0.075, filterHz: 3200, group: 3,
  },
  guy: {
    wave: 'sine', sub: 'triangle', baseHz: 118, offsets: [-16, -6, 8, 18, 30, 46],
    dur: [0.08, 0.14], gain: 0.09, filterHz: 1000, fmRatio: 2.4, fmGain: 12, group: 3,
  },
  shuna: {
    wave: 'sine', sub: 'sine', baseHz: 586, offsets: [-20, -8, 12, 28, 48, 72],
    dur: [0.05, 0.1], gain: 0.07, filterHz: 2800, group: 3,
  },
  souei: {
    wave: 'square', sub: 'sine', baseHz: 236, offsets: [-18, -6, 8, 18, 32, 48],
    dur: [0.04, 0.07], gain: 0.055, filterHz: 1600, group: 3,
  },
  hakurou: {
    wave: 'triangle', sub: 'sine', baseHz: 304, offsets: [-16, -6, 10, 22, 38, 54],
    dur: [0.055, 0.095], gain: 0.075, filterHz: 2200, group: 3,
  },
}

const EMOTION: Record<DialogueEmotionId, { pitch: number; volume: number; rate: number }> = {
  normal: { pitch: 1, volume: 1, rate: 1 },
  happy: { pitch: 1.08, volume: 1.05, rate: 1.12 },
  angry: { pitch: 0.92, volume: 1.12, rate: 1.18 },
  sad: { pitch: 0.86, volume: 0.82, rate: 0.78 },
  surprised: { pitch: 1.16, volume: 1.08, rate: 1.22 },
  serious: { pitch: 0.94, volume: 1, rate: 0.9 },
  scared: { pitch: 1.12, volume: 0.88, rate: 1.28 },
  excited: { pitch: 1.14, volume: 1.1, rate: 1.25 },
}

function talkPatch(id: FighterIdValue, index: number): SfxRecipe {
  const color = COLOR[id]
  const sig = SIGNATURES[id]
  const t = color.dur[0] + ((color.dur[1] - color.dur[0]) * index) / 5
  const hz = color.baseHz + color.offsets[index]!
  const layers = [
    tone(hz, t, color.gain, {
      wave: color.wave,
      attack: 0.004,
      release: 0.035,
      filterType: 'lowpass',
      filterFreq: color.filterHz,
      fmRatio: color.fmRatio,
      fmGain: color.fmGain,
    }),
  ]
  if (color.sub) {
    layers.push(tone(hz * (color.sub === 'sine' ? 2 : 0.5), t * 0.85, color.gain * 0.35, {
      wave: color.sub,
      delay: 0.006,
      attack: 0.006,
      release: 0.04,
    }))
  }
  return recipe(`${sig.pascal}_Dialogue_Talk_0${index + 1}`, layers, {
    bus: SfxBus.DIALOGUE,
    priority: SfxPriority.DIALOGUE,
    cooldownMs: 48,
    maxInstances: 1,
  })
}

const CACHE = new Map<FighterIdValue, SfxRecipe[]>()

export function talkVariants(id: FighterIdValue): SfxRecipe[] {
  let list = CACHE.get(id)
  if (!list) {
    list = [0, 1, 2, 3, 4, 5].map((index) => talkPatch(id, index))
    CACHE.set(id, list)
  }
  return list
}

export function talkGroupSize(id: FighterIdValue): number {
  return COLOR[id].group
}

export function emotionVoiceMod(emotion: DialogueEmotionId): { pitch: number; volume: number; rate: number } {
  return EMOTION[emotion]
}

export function registerAllTalkVariants(register: (key: string, recipes: SfxRecipe[]) => void): void {
  for (const id of PLAYABLE_FIGHTERS) {
    register(`talk-${id}`, talkVariants(id))
  }
}

export function talkRecipeIds(id: FighterIdValue): string[] {
  return talkVariants(id).map((item) => item.id)
}
