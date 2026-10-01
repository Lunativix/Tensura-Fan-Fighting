import { SfxBus, SfxPriority, type SkillSfxDef, type SfxRecipe, type ToneLayer } from '../SfxTypes.ts'
import { grit, noise, recipe, shimmer, sweep, thud, tone } from '../synth/recipe.ts'
import { signatureOf, type AudioSignature } from './signatures.ts'
import type { FighterIdValue } from '../../types/game.ts'

interface SkillSpec {
  key: string
  name: string
  texture: string
  power: number
}

function named(sig: AudioSignature, skill: string, layer: string): string {
  return `${sig.pascal}_${skill}_${layer}_01`
}

function lead(priority: number, duckMs?: number): Partial<SfxRecipe> {
  const bus = priority >= SfxPriority.SKILL4 ? SfxBus.LEAD : SfxBus.SFX
  return {
    bus,
    priority,
    maxInstances: priority >= SfxPriority.SKILL4 ? 1 : 2,
    cooldownMs: priority >= SfxPriority.SKILL4 ? 220 : 70,
    duckMs,
    duckAmount: duckMs ? (priority >= SfxPriority.ULTIMATE ? 0.18 : 0.32) : undefined,
  }
}

function withSig(sig: AudioSignature, layers: ToneLayer[]): ToneLayer[] {
  const extra: ToneLayer[] = [
    tone(sig.baseHz, 0.12, 0.04 * sig.weight, { wave: sig.subWave, delay: 0.008 }),
  ]
  if (sig.grit > 0.2) {
    extra.push(grit(sig.filterHz * 0.4, 0.03 * sig.grit, 0.1, sig.weight > 1.1))
  }
  return [...layers, ...extra]
}

function skill(
  sig: AudioSignature,
  spec: SkillSpec,
  priority: number,
  parts: {
    activate: ToneLayer[]
    charge?: ToneLayer[]
    release: ToneLayer[]
    travel?: ToneLayer[]
    impact: ToneLayer[]
    secondary?: ToneLayer[]
    aftermath?: ToneLayer[]
  },
): SkillSfxDef {
  const duck = priority >= SfxPriority.SKILL4 ? (priority >= SfxPriority.ULTIMATE ? 720 : 420) : undefined
  return {
    skillId: spec.key,
    name: spec.name,
    activate: recipe(named(sig, spec.key, 'Activate'), withSig(sig, parts.activate), lead(priority)),
    charge: parts.charge
      ? recipe(named(sig, spec.key, 'Charge'), parts.charge, { ...lead(priority), cooldownMs: 180, maxInstances: 1 })
      : undefined,
    release: recipe(named(sig, spec.key, 'Release'), withSig(sig, parts.release), lead(priority, duck)),
    travel: parts.travel
      ? recipe(named(sig, spec.key, 'Travel'), parts.travel, { bus: SfxBus.SFX, priority: SfxPriority.SKILL1, cooldownMs: 160, maxInstances: 1 })
      : undefined,
    impact: recipe(named(sig, spec.key, 'Impact'), withSig(sig, parts.impact), lead(Math.max(priority, SfxPriority.IMPACT))),
    secondary: parts.secondary
      ? recipe(named(sig, spec.key, 'Secondary'), parts.secondary, { priority: SfxPriority.IMPACT, cooldownMs: 80 })
      : undefined,
    aftermath: parts.aftermath
      ? recipe(named(sig, spec.key, 'Aftermath'), parts.aftermath, { priority: SfxPriority.IMPACT, cooldownMs: 200, maxInstances: 1 })
      : undefined,
  }
}

function textures(sig: AudioSignature, spec: SkillSpec, slot: number): SkillSfxDef {
  const p = slot === 4 ? SfxPriority.ULTIMATE : slot === 3 ? SfxPriority.SKILL4 : slot === 2 ? SfxPriority.SKILL3 : slot === 1 ? SfxPriority.SKILL2 : SfxPriority.SKILL1
  switch (spec.texture) {
    case 'water-blade':
      return skill(sig, spec, p, {
        activate: [shimmer(720 * sig.brightness, 0.08, 0.09), noise(1800, 0.08, 0.05, { q: 6, filterType: 'highpass' })],
        release: [sweep(1400, 420, 0.16, 0.14, { wave: 'triangle' }), noise(2200, 0.12, 0.07, { q: 8, freqEnd: 900 })],
        impact: [tone(980, 0.1, 0.12, { wave: 'sine' }), thud(140, 0.08, 0.12)],
        aftermath: [shimmer(1240, 0.05, 0.22)],
      })
    case 'black-lightning':
      return skill(sig, spec, p, {
        activate: [tone(90, 0.08, 0.1, { wave: 'square', fmRatio: 11, fmGain: 40 }), grit(400, 0.06, 0.07)],
        release: [noise(2400, 0.09, 0.16, { q: 12, color: 'white' }), sweep(180, 70, 0.2, 0.12, { wave: 'sawtooth' })],
        travel: [noise(1600, 0.14, 0.05, { q: 10, freqEnd: 700 })],
        impact: [tone(70, 0.18, 0.16, { wave: 'square' }), noise(900, 0.12, 0.1, { color: 'brown' })],
        secondary: [tone(210, 0.08, 0.06, { wave: 'square', delay: 0.04 })],
        aftermath: [sweep(120, 40, 0.28, 0.07, { wave: 'sine' })],
      })
    case 'predator':
      return skill(sig, spec, p, {
        activate: [sweep(600, 90, 0.22, 0.1, { wave: 'sine' }), tone(1760, 0.04, 0.05, { wave: 'square', delay: 0.05 })],
        charge: [sweep(200, 80, 0.35, 0.06, { wave: 'sine' })],
        release: [sweep(140, 40, 0.28, 0.14, { wave: 'sawtooth' }), noise(300, 0.24, 0.08, { color: 'brown', filterType: 'lowpass' })],
        impact: [thud(55, 0.16, 0.22), tone(1320, 0.06, 0.07, { wave: 'sine' })],
        aftermath: [shimmer(880, 0.04, 0.3)],
      })
    case 'megiddo':
      return skill(sig, spec, p, {
        activate: [tone(240, 0.16, 0.07, { wave: 'sine' }), shimmer(1560, 0.05, 0.2)],
        charge: [sweep(180, 720, 0.55, 0.08, { wave: 'sine' }), tone(90, 0.55, 0.05, { wave: 'sine' })],
        release: [sweep(2400, 880, 0.22, 0.18, { wave: 'sawtooth' }), noise(4000, 0.18, 0.08, { q: 2 })],
        impact: [thud(48, 0.18, 0.3), tone(1320, 0.14, 0.1, { wave: 'triangle' })],
        aftermath: [shimmer(2100, 0.05, 0.4), sweep(200, 50, 0.45, 0.06, { wave: 'sine' })],
      })
    case 'beelzebuth':
      return skill(sig, spec, p, {
        activate: [tone(48, 0.22, 0.12, { wave: 'sine' }), tone(1760, 0.05, 0.04, { wave: 'square', delay: 0.08 })],
        charge: [sweep(40, 28, 0.7, 0.1, { wave: 'sine' }), noise(80, 0.7, 0.06, { color: 'brown', filterType: 'lowpass' })],
        release: [thud(32, 0.22, 0.45), sweep(900, 60, 0.35, 0.14, { wave: 'sawtooth' }), noise(200, 0.4, 0.1, { color: 'brown' })],
        impact: [thud(28, 0.24, 0.5), noise(140, 0.3, 0.12, { color: 'brown' }), tone(70, 0.3, 0.1, { wave: 'sine', fmRatio: 0.5, fmGain: 18 })],
        secondary: [sweep(400, 70, 0.28, 0.08, { delay: 0.08 })],
        aftermath: [sweep(55, 22, 0.7, 0.08, { wave: 'sine' })],
      })
    case 'dragon-fist':
      return skill(sig, spec, p, {
        activate: [grit(600, 0.08, 0.07, true), sweep(420, 180, 0.1, 0.1, { wave: 'sawtooth' })],
        release: [thud(90 * sig.weight, 0.16, 0.16), noise(500, 0.1, 0.1, { color: 'white' })],
        impact: [thud(60, 0.2, 0.2), tone(sig.baseHz, 0.12, 0.1, { wave: 'sawtooth' })],
      })
    case 'magic-missile':
      return skill(sig, spec, p, {
        activate: [shimmer(980, 0.09, 0.1), tone(1560, 0.06, 0.06, { wave: 'sine' })],
        release: [sweep(1200, 640, 0.12, 0.11, { wave: 'sine' }), noise(2400, 0.1, 0.05, { q: 7 })],
        travel: [shimmer(1100, 0.04, 0.16)],
        impact: [tone(740, 0.1, 0.12, { wave: 'triangle' }), thud(110, 0.07, 0.1)],
        aftermath: [shimmer(1480, 0.04, 0.18)],
      })
    case 'dragon-kick':
      return skill(sig, spec, p, {
        activate: [sweep(300, 80, 0.1, 0.1, { wave: 'sawtooth' })],
        release: [noise(400, 0.14, 0.12, { color: 'white', freqEnd: 180 }), thud(70, 0.14, 0.16)],
        impact: [thud(42, 0.22, 0.24), grit(200, 0.1, 0.16, true)],
        aftermath: [noise(120, 0.22, 0.05, { color: 'brown', filterType: 'lowpass' })],
      })
    case 'dragon-nova':
      return skill(sig, spec, p, {
        activate: [tone(110, 0.18, 0.1, { wave: 'sawtooth' }), shimmer(640, 0.05, 0.2)],
        charge: [sweep(80, 40, 0.6, 0.1, { wave: 'sawtooth' }), tone(220, 0.6, 0.05, { wave: 'sine' })],
        release: [thud(36, 0.2, 0.4), noise(280, 0.35, 0.14, { color: 'brown' }), sweep(500, 80, 0.28, 0.12)],
        impact: [thud(30, 0.24, 0.42), noise(180, 0.3, 0.12, { color: 'brown' })],
        aftermath: [sweep(90, 28, 0.55, 0.07, { wave: 'sine' })],
      })
    case 'drago-buster':
      return skill(sig, spec, p, {
        activate: [tone(65, 0.2, 0.12, { wave: 'sawtooth' }), grit(180, 0.08, 0.16, true)],
        charge: [sweep(50, 32, 0.75, 0.12, { wave: 'sawtooth' }), noise(90, 0.75, 0.07, { color: 'brown', filterType: 'lowpass' })],
        release: [sweep(280, 55, 0.4, 0.18, { wave: 'sawtooth' }), thud(28, 0.22, 0.5), noise(220, 0.4, 0.12, { color: 'brown' })],
        impact: [thud(24, 0.26, 0.55), tone(98, 0.3, 0.1, { wave: 'sawtooth' })],
        aftermath: [sweep(70, 22, 0.8, 0.08, { wave: 'sine' })],
      })
    case 'end-of-world':
      return skill(sig, spec, p, {
        activate: [tone(70, 0.14, 0.1, { wave: 'sine', fmRatio: 3.1, fmGain: 28 }), shimmer(220, 0.04, 0.16)],
        release: [sweep(160, 45, 0.28, 0.13, { wave: 'sine' }), noise(180, 0.22, 0.08, { color: 'brown' })],
        travel: [tone(90, 0.18, 0.05, { wave: 'sine', fmRatio: 2.7, fmGain: 12 })],
        impact: [thud(40, 0.16, 0.24), tone(55, 0.22, 0.1, { wave: 'sine', fmRatio: 4, fmGain: 22 })],
        aftermath: [sweep(80, 30, 0.4, 0.06, { wave: 'sine' })],
      })
    case 'tempter':
      return skill(sig, spec, p, {
        activate: [tone(880, 0.05, 0.07, { wave: 'sine' }), tone(110, 0.12, 0.08, { wave: 'triangle' })],
        release: [sweep(700, 140, 0.12, 0.1, { wave: 'triangle' }), noise(900, 0.1, 0.06, { q: 8 })],
        impact: [tone(160, 0.14, 0.12, { wave: 'sine', fmRatio: 6, fmGain: 30 }), thud(80, 0.1, 0.14)],
      })
    case 'dark-nova':
      return skill(sig, spec, p, {
        activate: [tone(48, 0.18, 0.1, { wave: 'sine' }), grit(140, 0.06, 0.16, true)],
        charge: [sweep(70, 36, 0.45, 0.08, { wave: 'sine' })],
        release: [thud(34, 0.18, 0.32), noise(120, 0.28, 0.1, { color: 'brown' }), tone(66, 0.24, 0.08, { fmRatio: 2.2, fmGain: 20 })],
        impact: [thud(30, 0.2, 0.36), tone(44, 0.28, 0.1, { wave: 'sine' })],
        aftermath: [sweep(60, 22, 0.5, 0.07, { wave: 'sine' })],
      })
    case 'demon-form':
      return skill(sig, spec, p, {
        activate: [tone(52, 0.2, 0.1, { wave: 'sine', fmRatio: 1.5, fmGain: 16 })],
        charge: [sweep(80, 40, 0.5, 0.07, { wave: 'sine' })],
        release: [sweep(200, 50, 0.35, 0.12, { wave: 'sawtooth' }), shimmer(300, 0.04, 0.3)],
        impact: [thud(46, 0.12, 0.22), tone(98, 0.2, 0.08, { wave: 'sine' })],
        aftermath: [tone(62, 0.4, 0.05, { wave: 'sine' })],
      })
    case 'azazel':
      return skill(sig, spec, p, {
        activate: [tone(41, 0.24, 0.12, { wave: 'sine', fmRatio: 3.5, fmGain: 36 })],
        charge: [sweep(36, 24, 0.8, 0.1, { wave: 'sine' }), noise(70, 0.8, 0.05, { color: 'brown', filterType: 'lowpass' })],
        release: [thud(26, 0.22, 0.48), tone(52, 0.4, 0.12, { wave: 'sine', fmRatio: 5, fmGain: 40 }), noise(90, 0.4, 0.1, { color: 'brown' })],
        impact: [thud(22, 0.24, 0.52), tone(38, 0.4, 0.1, { wave: 'sine' })],
        aftermath: [sweep(48, 18, 0.85, 0.08, { wave: 'sine' })],
      })
    case 'flame-slash':
      return skill(sig, spec, p, {
        activate: [sweep(1600, 700, 0.08, 0.08, { wave: 'triangle' }), noise(1800, 0.07, 0.06, { q: 4 })],
        release: [sweep(1900, 320, 0.14, 0.14, { wave: 'sawtooth' }), noise(900, 0.14, 0.1, { color: 'white', freqEnd: 400 })],
        impact: [tone(880, 0.08, 0.1, { wave: 'square' }), thud(120, 0.1, 0.12), grit(500, 0.08, 0.12)],
        aftermath: [noise(350, 0.2, 0.05, { color: 'brown', filterType: 'lowpass' })],
      })
    case 'hellflare':
      return skill(sig, spec, p, {
        activate: [tone(180, 0.1, 0.09, { wave: 'sawtooth' }), grit(700, 0.06, 0.08)],
        release: [sweep(500, 140, 0.2, 0.14, { wave: 'sawtooth' }), noise(600, 0.18, 0.1, { color: 'white' })],
        travel: [noise(700, 0.16, 0.05, { freqEnd: 280, color: 'white' })],
        impact: [thud(70, 0.16, 0.2), noise(400, 0.18, 0.12, { color: 'brown' })],
        aftermath: [grit(220, 0.06, 0.28, true)],
      })
    case 'ogre-rush':
      return skill(sig, spec, p, {
        activate: [sweep(280, 90, 0.08, 0.1, { wave: 'square' })],
        release: [noise(320, 0.14, 0.1, { color: 'white' }), thud(85, 0.12, 0.14)],
        impact: [thud(64, 0.18, 0.16), tone(220, 0.1, 0.08, { wave: 'square' })],
      })
    case 'black-flame':
      return skill(sig, spec, p, {
        activate: [tone(90, 0.16, 0.1, { wave: 'sawtooth' }), grit(200, 0.07, 0.14, true)],
        charge: [sweep(110, 50, 0.4, 0.08, { wave: 'sawtooth' })],
        release: [sweep(240, 55, 0.28, 0.15, { wave: 'sawtooth' }), noise(180, 0.28, 0.12, { color: 'brown' })],
        impact: [thud(40, 0.2, 0.3), tone(70, 0.22, 0.1, { wave: 'sawtooth' })],
        aftermath: [grit(90, 0.07, 0.4, true)],
      })
    case 'prominence':
      return skill(sig, spec, p, {
        activate: [tone(110, 0.18, 0.11, { wave: 'sawtooth' }), sweep(1400, 400, 0.16, 0.08, { wave: 'triangle' })],
        charge: [sweep(70, 36, 0.65, 0.1, { wave: 'sawtooth' }), noise(240, 0.65, 0.06, { color: 'brown' })],
        release: [thud(32, 0.22, 0.42), sweep(360, 70, 0.32, 0.16, { wave: 'sawtooth' }), noise(280, 0.35, 0.12, { color: 'brown' })],
        impact: [thud(28, 0.24, 0.48), grit(160, 0.1, 0.3, true)],
        aftermath: [noise(100, 0.55, 0.07, { color: 'brown', filterType: 'lowpass' })],
      })
    case 'cleaver':
      return skill(sig, spec, p, {
        activate: [sweep(420, 80, 0.12, 0.1, { wave: 'triangle' }), tone(180, 0.08, 0.05, { wave: 'square' })],
        release: [sweep(260, 50, 0.16, 0.16, { wave: 'sawtooth' }), noise(150, 0.14, 0.1, { color: 'brown' })],
        impact: [thud(38, 0.22, 0.26), tone(140, 0.1, 0.08, { wave: 'square' })],
        secondary: [tone(90, 0.12, 0.06, { delay: 0.05, wave: 'sine' })],
      })
    case 'cook':
      return skill(sig, spec, p, {
        activate: [thud(70, 0.1, 0.1), tone(240, 0.08, 0.06, { wave: 'triangle' })],
        release: [sweep(160, 40, 0.18, 0.14, { wave: 'triangle' }), grit(180, 0.08, 0.16, true)],
        impact: [thud(34, 0.2, 0.28), noise(90, 0.18, 0.08, { color: 'brown' })],
      })
    case 'berserk':
      return skill(sig, spec, p, {
        activate: [tone(90, 0.16, 0.1, { wave: 'sawtooth' }), grit(300, 0.08, 0.14)],
        release: [sweep(140, 60, 0.28, 0.12, { wave: 'sawtooth' }), thud(50, 0.1, 0.2)],
        impact: [tone(73, 0.2, 0.1, { wave: 'sawtooth' })],
        aftermath: [tone(73, 0.4, 0.04, { wave: 'sine' })],
      })
    case 'ground-break':
      return skill(sig, spec, p, {
        activate: [thud(60, 0.1, 0.12)],
        charge: [sweep(50, 30, 0.35, 0.08, { wave: 'sine' })],
        release: [thud(28, 0.22, 0.32), noise(80, 0.28, 0.14, { color: 'brown' })],
        impact: [thud(24, 0.24, 0.36), grit(70, 0.1, 0.24, true)],
        aftermath: [noise(50, 0.4, 0.06, { color: 'brown', filterType: 'lowpass' })],
      })
    case 'tempest-fury':
      return skill(sig, spec, p, {
        activate: [tone(65, 0.18, 0.12, { wave: 'sawtooth' }), thud(40, 0.1, 0.16)],
        charge: [sweep(48, 26, 0.6, 0.1, { wave: 'triangle' })],
        release: [thud(24, 0.24, 0.45), sweep(180, 40, 0.3, 0.14, { wave: 'sawtooth' }), noise(70, 0.35, 0.12, { color: 'brown' })],
        impact: [thud(20, 0.26, 0.5), tone(55, 0.28, 0.1, { wave: 'triangle' })],
        aftermath: [sweep(40, 16, 0.7, 0.07, { wave: 'sine' })],
      })
    case 'storm-breath':
      return skill(sig, spec, p, {
        activate: [noise(180, 0.16, 0.1, { color: 'brown', filterType: 'lowpass' }), tone(70, 0.12, 0.08, { wave: 'sawtooth' })],
        release: [noise(400, 0.28, 0.14, { color: 'white', freqEnd: 120 }), sweep(90, 40, 0.3, 0.12, { wave: 'sawtooth' })],
        travel: [noise(280, 0.18, 0.06, { color: 'white', freqEnd: 90 })],
        impact: [thud(36, 0.18, 0.24), noise(150, 0.2, 0.1, { color: 'brown' })],
        aftermath: [noise(80, 0.35, 0.06, { color: 'brown', filterType: 'lowpass' })],
      })
    case 'dragon-tail':
      return skill(sig, spec, p, {
        activate: [sweep(120, 40, 0.14, 0.12, { wave: 'sawtooth' })],
        release: [thud(32, 0.2, 0.22), noise(100, 0.16, 0.1, { color: 'brown' })],
        impact: [thud(26, 0.24, 0.3), grit(90, 0.1, 0.2, true)],
      })
    case 'death-wind':
      return skill(sig, spec, p, {
        activate: [tone(55, 0.14, 0.1, { wave: 'sawtooth' }), noise(900, 0.1, 0.07, { q: 9 })],
        charge: [sweep(80, 40, 0.4, 0.08, { wave: 'sawtooth' })],
        release: [sweep(1400, 180, 0.22, 0.14, { wave: 'sawtooth' }), noise(2000, 0.16, 0.1, { q: 4 }), thud(50, 0.12, 0.2)],
        travel: [noise(1200, 0.16, 0.05, { q: 6, freqEnd: 300 })],
        impact: [thud(34, 0.2, 0.26), tone(90, 0.16, 0.1, { wave: 'square' })],
        aftermath: [sweep(200, 40, 0.4, 0.06, { wave: 'sine' })],
      })
    case 'storm-roar':
      return skill(sig, spec, p, {
        activate: [tone(48, 0.2, 0.14, { wave: 'sawtooth' })],
        charge: [sweep(40, 28, 0.5, 0.1, { wave: 'sawtooth' })],
        release: [tone(40, 0.45, 0.16, { wave: 'sawtooth' }), noise(70, 0.45, 0.12, { color: 'brown' }), thud(22, 0.16, 0.4)],
        impact: [thud(20, 0.22, 0.4), noise(60, 0.3, 0.1, { color: 'brown' })],
        aftermath: [tone(36, 0.6, 0.06, { wave: 'sine' })],
      })
    case 'storm-dragon':
      return skill(sig, spec, p, {
        activate: [tone(36, 0.24, 0.14, { wave: 'sawtooth' }), noise(80, 0.2, 0.08, { color: 'brown' })],
        charge: [sweep(32, 20, 0.85, 0.12, { wave: 'sawtooth' }), tone(55, 0.85, 0.06, { wave: 'sine' })],
        release: [thud(18, 0.26, 0.55), sweep(220, 40, 0.4, 0.16, { wave: 'sawtooth' }), noise(90, 0.5, 0.14, { color: 'brown' })],
        impact: [thud(16, 0.28, 0.6), tone(40, 0.4, 0.12, { wave: 'sawtooth' })],
        aftermath: [sweep(40, 14, 0.9, 0.08, { wave: 'sine' })],
      })
    case 'holy-cut':
      return skill(sig, spec, p, {
        activate: [shimmer(1400, 0.07, 0.07), sweep(1800, 900, 0.07, 0.08, { wave: 'triangle' })],
        release: [sweep(2200, 600, 0.1, 0.13, { wave: 'triangle' }), tone(1046, 0.08, 0.07, { wave: 'sine' })],
        impact: [tone(1320, 0.08, 0.12, { wave: 'sine' }), thud(160, 0.06, 0.08)],
      })
    case 'melt-slash':
      return skill(sig, spec, p, {
        activate: [tone(1760, 0.05, 0.08, { wave: 'sine' }), noise(3000, 0.06, 0.05, { q: 10, filterType: 'highpass' })],
        release: [sweep(2600, 400, 0.12, 0.12, { wave: 'sawtooth' }), noise(2200, 0.1, 0.08, { q: 3 })],
        impact: [tone(880, 0.1, 0.12, { wave: 'triangle' }), shimmer(2100, 0.06, 0.16)],
        aftermath: [noise(1800, 0.16, 0.04, { filterType: 'highpass' })],
      })
    case 'disintegration':
      return skill(sig, spec, p, {
        activate: [tone(523, 0.12, 0.08, { wave: 'sine' }), shimmer(2093, 0.05, 0.16)],
        charge: [sweep(400, 1200, 0.4, 0.08, { wave: 'sine' })],
        release: [sweep(2800, 700, 0.2, 0.16, { wave: 'sawtooth' }), tone(1560, 0.16, 0.08, { wave: 'sine' }), noise(4000, 0.14, 0.06)],
        travel: [shimmer(1800, 0.04, 0.14)],
        impact: [tone(1046, 0.14, 0.12, { wave: 'sine' }), thud(90, 0.1, 0.16)],
        aftermath: [shimmer(2480, 0.05, 0.35)],
      })
    case 'faith':
      return skill(sig, spec, p, {
        activate: [tone(784, 0.12, 0.08, { wave: 'sine' }), shimmer(1568, 0.05, 0.18)],
        release: [tone(523, 0.22, 0.1, { wave: 'sine' }), tone(784, 0.22, 0.06, { wave: 'sine', delay: 0.02 })],
        impact: [shimmer(1318, 0.08, 0.2)],
        aftermath: [tone(392, 0.3, 0.04, { wave: 'sine' })],
      })
    case 'chrono':
      return skill(sig, spec, p, {
        activate: [tone(1046, 0.1, 0.08, { wave: 'sine' }), tone(659, 0.12, 0.06, { wave: 'triangle' })],
        charge: [sweep(200, 80, 0.5, 0.07, { wave: 'sine' }), shimmer(1760, 0.05, 0.5)],
        release: [sweep(2200, 180, 0.28, 0.14, { wave: 'triangle' }), thud(50, 0.12, 0.3), tone(880, 0.2, 0.08, { wave: 'sine' })],
        impact: [thud(40, 0.18, 0.32), shimmer(2093, 0.08, 0.28)],
        aftermath: [sweep(400, 80, 0.55, 0.06, { wave: 'sine' })],
      })
    case 'pride-cut':
      return skill(sig, spec, p, {
        activate: [tone(110, 0.1, 0.09, { wave: 'sine' }), sweep(900, 300, 0.08, 0.07, { wave: 'triangle' })],
        release: [sweep(700, 90, 0.14, 0.13, { wave: 'sine' }), tone(82, 0.14, 0.08, { wave: 'sine' })],
        impact: [thud(50, 0.16, 0.18), tone(164, 0.1, 0.08, { wave: 'triangle' })],
      })
    case 'crimson':
      return skill(sig, spec, p, {
        activate: [tone(98, 0.12, 0.1, { wave: 'sine', fmRatio: 2.4, fmGain: 18 })],
        release: [sweep(240, 70, 0.2, 0.13, { wave: 'sine' }), shimmer(480, 0.05, 0.16)],
        travel: [tone(130, 0.16, 0.05, { wave: 'sine', fmRatio: 1.8, fmGain: 10 })],
        impact: [thud(44, 0.16, 0.22), tone(73, 0.18, 0.1, { wave: 'sine', fmRatio: 3, fmGain: 24 })],
        aftermath: [sweep(90, 32, 0.32, 0.06, { wave: 'sine' })],
      })
    case 'dominate':
      return skill(sig, spec, p, {
        activate: [tone(55, 0.16, 0.11, { wave: 'sine' }), shimmer(220, 0.04, 0.14)],
        release: [thud(36, 0.16, 0.24), tone(82, 0.2, 0.1, { wave: 'sine', fmRatio: 4.5, fmGain: 26 })],
        impact: [thud(32, 0.18, 0.28), tone(41, 0.24, 0.1, { wave: 'sine' })],
        aftermath: [tone(48, 0.4, 0.05, { wave: 'sine' })],
      })
    case 'true-dragon-lord':
      return skill(sig, spec, p, {
        activate: [tone(41, 0.22, 0.12, { wave: 'sine' }), shimmer(164, 0.04, 0.22)],
        charge: [sweep(60, 30, 0.55, 0.09, { wave: 'sine' })],
        release: [sweep(160, 40, 0.36, 0.13, { wave: 'sine' }), thud(30, 0.12, 0.28)],
        impact: [thud(28, 0.16, 0.3), tone(55, 0.3, 0.08, { wave: 'sine' })],
        aftermath: [tone(41, 0.5, 0.05, { wave: 'sine' })],
      })
    case 'world-ruin':
      return skill(sig, spec, p, {
        activate: [tone(32, 0.24, 0.14, { wave: 'sine' }), tone(96, 0.16, 0.06, { wave: 'triangle' })],
        charge: [sweep(28, 18, 0.85, 0.12, { wave: 'sine' }), noise(40, 0.85, 0.05, { color: 'brown', filterType: 'lowpass' })],
        release: [thud(18, 0.26, 0.55), tone(36, 0.45, 0.12, { wave: 'sine', fmRatio: 2.8, fmGain: 22 }), noise(55, 0.4, 0.1, { color: 'brown' })],
        impact: [thud(14, 0.28, 0.62), tone(24, 0.5, 0.12, { wave: 'sine' })],
        aftermath: [sweep(32, 12, 1.0, 0.08, { wave: 'sine' })],
      })
    case 'holy-flame':
      return skill(sig, spec, p, {
        activate: [shimmer(784, 0.08, 0.1), tone(523, 0.08, 0.06, { wave: 'sine' })],
        release: [sweep(900, 400, 0.16, 0.11, { wave: 'sine' }), noise(1400, 0.12, 0.05, { q: 5 })],
        travel: [shimmer(660, 0.04, 0.14)],
        impact: [tone(659, 0.12, 0.1, { wave: 'sine' }), thud(130, 0.06, 0.1)],
        aftermath: [shimmer(1046, 0.04, 0.22)],
      })
    case 'barrier':
      return skill(sig, spec, p, {
        activate: [tone(659, 0.1, 0.08, { wave: 'sine' }), tone(988, 0.1, 0.05, { wave: 'sine', delay: 0.03 })],
        release: [tone(523, 0.22, 0.1, { wave: 'sine' }), shimmer(1318, 0.06, 0.24)],
        impact: [shimmer(880, 0.08, 0.18)],
        aftermath: [tone(392, 0.28, 0.04, { wave: 'sine' })],
      })
    case 'bless':
      return skill(sig, spec, p, {
        activate: [tone(523, 0.12, 0.07, { wave: 'sine' }), tone(659, 0.12, 0.05, { delay: 0.04 })],
        release: [tone(784, 0.24, 0.09, { wave: 'sine' }), shimmer(1568, 0.05, 0.28)],
        impact: [shimmer(1046, 0.07, 0.22)],
        aftermath: [tone(392, 0.35, 0.04, { wave: 'sine' })],
      })
    case 'purify':
      return skill(sig, spec, p, {
        activate: [shimmer(1174, 0.07, 0.12), tone(440, 0.1, 0.06, { wave: 'sine' })],
        release: [sweep(1400, 500, 0.18, 0.12, { wave: 'sine' }), tone(880, 0.14, 0.07, { wave: 'triangle' })],
        travel: [shimmer(990, 0.04, 0.14)],
        impact: [tone(740, 0.14, 0.11, { wave: 'sine' }), thud(100, 0.07, 0.12)],
        aftermath: [shimmer(1760, 0.05, 0.28)],
      })
    case 'temple-light':
      return skill(sig, spec, p, {
        activate: [tone(392, 0.18, 0.1, { wave: 'sine' }), tone(588, 0.18, 0.06, { delay: 0.05 })],
        charge: [sweep(220, 660, 0.55, 0.08, { wave: 'sine' }), shimmer(1320, 0.05, 0.55)],
        release: [tone(523, 0.32, 0.12, { wave: 'sine' }), tone(784, 0.32, 0.08, { delay: 0.03 }), sweep(1800, 400, 0.28, 0.1, { wave: 'triangle' })],
        impact: [thud(60, 0.14, 0.28), shimmer(2093, 0.08, 0.36)],
        aftermath: [tone(261, 0.55, 0.05, { wave: 'sine' })],
      })
    case 'shadow-stab':
      return skill(sig, spec, p, {
        activate: [tone(220, 0.05, 0.06, { wave: 'square' }), noise(1800, 0.05, 0.04, { q: 8, filterType: 'highpass' })],
        release: [sweep(900, 280, 0.08, 0.1, { wave: 'triangle' }), tone(185, 0.07, 0.06, { wave: 'square' })],
        impact: [tone(310, 0.07, 0.11, { wave: 'square' }), thud(140, 0.06, 0.08)],
      })
    case 'clone':
      return skill(sig, spec, p, {
        activate: [noise(1200, 0.08, 0.06, { q: 2 }), tone(140, 0.08, 0.05, { wave: 'triangle' })],
        release: [sweep(500, 180, 0.12, 0.09, { wave: 'triangle' }), noise(800, 0.1, 0.05, { q: 3 })],
        impact: [tone(185, 0.08, 0.08, { wave: 'square' })],
      })
    case 'kunai':
      return skill(sig, spec, p, {
        activate: [tone(1480, 0.04, 0.06, { wave: 'square' })],
        release: [sweep(1600, 500, 0.08, 0.1, { wave: 'triangle' })],
        travel: [tone(980, 0.1, 0.03, { wave: 'triangle' })],
        impact: [tone(740, 0.07, 0.1, { wave: 'square' }), thud(180, 0.05, 0.07)],
      })
    case 'assassinate':
      return skill(sig, spec, p, {
        activate: [tone(90, 0.1, 0.07, { wave: 'sine' }), noise(2000, 0.06, 0.04, { filterType: 'highpass' })],
        charge: [tone(70, 0.22, 0.05, { wave: 'sine' })],
        release: [sweep(700, 90, 0.12, 0.13, { wave: 'triangle' }), thud(70, 0.12, 0.16)],
        impact: [thud(50, 0.16, 0.2), tone(220, 0.08, 0.08, { wave: 'square' })],
        aftermath: [noise(400, 0.18, 0.04, { filterType: 'lowpass' })],
      })
    case 'death-shadow':
      return skill(sig, spec, p, {
        activate: [tone(70, 0.16, 0.1, { wave: 'sine' }), noise(600, 0.12, 0.05, { q: 2 })],
        charge: [sweep(90, 40, 0.5, 0.07, { wave: 'sine' })],
        release: [sweep(240, 50, 0.28, 0.14, { wave: 'triangle' }), thud(36, 0.16, 0.3), noise(180, 0.24, 0.08, { color: 'brown' })],
        impact: [thud(30, 0.18, 0.32), tone(110, 0.16, 0.08, { wave: 'square' })],
        aftermath: [sweep(80, 24, 0.5, 0.06, { wave: 'sine' })],
      })
    case 'iai':
      return skill(sig, spec, p, {
        activate: [tone(180, 0.04, 0.04, { wave: 'sine' })],
        release: [sweep(2400, 280, 0.09, 0.15, { wave: 'triangle' }), tone(311, 0.08, 0.07, { wave: 'sine' })],
        impact: [tone(1244, 0.07, 0.12, { wave: 'sine' }), thud(150, 0.07, 0.08)],
      })
    case 'form-two':
      return skill(sig, spec, p, {
        activate: [sweep(800, 400, 0.08, 0.08, { wave: 'triangle' })],
        release: [sweep(1600, 220, 0.12, 0.13, { wave: 'triangle' }), tone(466, 0.1, 0.07, { wave: 'triangle' })],
        impact: [tone(622, 0.09, 0.11, { wave: 'triangle' }), thud(120, 0.08, 0.1)],
      })
    case 'sword-parry':
      return skill(sig, spec, p, {
        activate: [tone(988, 0.05, 0.08, { wave: 'triangle' })],
        release: [tone(1318, 0.08, 0.12, { wave: 'triangle' }), tone(659, 0.1, 0.06, { wave: 'sine' })],
        impact: [tone(1760, 0.08, 0.12, { wave: 'sine' }), thud(200, 0.06, 0.08)],
      })
    case 'secret':
      return skill(sig, spec, p, {
        activate: [tone(311, 0.1, 0.08, { wave: 'triangle' }), shimmer(1244, 0.04, 0.12)],
        charge: [tone(155, 0.28, 0.06, { wave: 'sine' })],
        release: [sweep(2000, 200, 0.16, 0.15, { wave: 'triangle' }), thud(70, 0.12, 0.18)],
        impact: [tone(933, 0.1, 0.12, { wave: 'triangle' }), thud(80, 0.12, 0.16)],
        aftermath: [shimmer(1864, 0.04, 0.22)],
      })
    case 'moon-fang':
      return skill(sig, spec, p, {
        activate: [tone(233, 0.14, 0.09, { wave: 'sine' }), shimmer(1396, 0.05, 0.16)],
        charge: [sweep(150, 80, 0.45, 0.07, { wave: 'sine' })],
        release: [sweep(2200, 180, 0.22, 0.16, { wave: 'triangle' }), thud(48, 0.14, 0.28), tone(698, 0.18, 0.08, { wave: 'sine' })],
        impact: [thud(40, 0.18, 0.3), tone(1396, 0.12, 0.1, { wave: 'sine' })],
        aftermath: [shimmer(2093, 0.05, 0.4)],
      })
    default:
      return skill(sig, spec, p, {
        activate: [tone(sig.baseHz, 0.1, 0.08, { wave: sig.wave })],
        release: [sweep(sig.baseHz * 2, sig.baseHz * 0.5, 0.16, 0.12, { wave: sig.wave })],
        impact: [thud(sig.landHz, 0.12, 0.16)],
      })
  }
}

const SPECS: Record<FighterIdValue, { skills: SkillSpec[]; ult: SkillSpec }> = {
  rimuru: {
    skills: [
      { key: 'Skill01', name: 'Water Blade', texture: 'water-blade', power: 1 },
      { key: 'Skill02', name: 'Black Lightning', texture: 'black-lightning', power: 2 },
      { key: 'Skill03', name: 'Predator', texture: 'predator', power: 3 },
      { key: 'Skill04', name: 'Megiddo', texture: 'megiddo', power: 4 },
    ],
    ult: { key: 'Ultimate', name: 'Beelzebuth', texture: 'beelzebuth', power: 5 },
  },
  milim: {
    skills: [
      { key: 'Skill01', name: 'Dragon Fist', texture: 'dragon-fist', power: 1 },
      { key: 'Skill02', name: 'Magic Missile', texture: 'magic-missile', power: 2 },
      { key: 'Skill03', name: 'Milim Kick', texture: 'dragon-kick', power: 3 },
      { key: 'Skill04', name: 'Dragon Nova', texture: 'dragon-nova', power: 4 },
    ],
    ult: { key: 'Ultimate', name: 'Drago Buster', texture: 'drago-buster', power: 5 },
  },
  diablo: {
    skills: [
      { key: 'Skill01', name: 'End of World', texture: 'end-of-world', power: 1 },
      { key: 'Skill02', name: 'Tempter Counter', texture: 'tempter', power: 2 },
      { key: 'Skill03', name: 'Dark Nova', texture: 'dark-nova', power: 3 },
      { key: 'Skill04', name: 'Demon Form', texture: 'demon-form', power: 4 },
    ],
    ult: { key: 'Ultimate', name: 'Azazel', texture: 'azazel', power: 5 },
  },
  benimaru: {
    skills: [
      { key: 'Skill01', name: 'Flame Slash', texture: 'flame-slash', power: 1 },
      { key: 'Skill02', name: 'Hellflare', texture: 'hellflare', power: 2 },
      { key: 'Skill03', name: 'Ogre Rush', texture: 'ogre-rush', power: 3 },
      { key: 'Skill04', name: 'Black Flame', texture: 'black-flame', power: 4 },
    ],
    ult: { key: 'Ultimate', name: 'Prominence', texture: 'prominence', power: 5 },
  },
  shion: {
    skills: [
      { key: 'Skill01', name: 'Chef Cleaver', texture: 'cleaver', power: 1 },
      { key: 'Skill02', name: 'Cook Throw', texture: 'cook', power: 2 },
      { key: 'Skill03', name: 'Berserk', texture: 'berserk', power: 3 },
      { key: 'Skill04', name: 'Ground Break', texture: 'ground-break', power: 4 },
    ],
    ult: { key: 'Ultimate', name: 'Tempest Fury', texture: 'tempest-fury', power: 5 },
  },
  veldora: {
    skills: [
      { key: 'Skill01', name: 'Storm Breath', texture: 'storm-breath', power: 1 },
      { key: 'Skill02', name: 'Dragon Tail', texture: 'dragon-tail', power: 2 },
      { key: 'Skill03', name: 'Death-Heralding Wind', texture: 'death-wind', power: 3 },
      { key: 'Skill04', name: 'Storm Roar', texture: 'storm-roar', power: 4 },
    ],
    ult: { key: 'Ultimate', name: 'Storm Dragon', texture: 'storm-dragon', power: 5 },
  },
  hinata: {
    skills: [
      { key: 'Skill01', name: 'Holy Cut', texture: 'holy-cut', power: 1 },
      { key: 'Skill02', name: 'Melt Slash', texture: 'melt-slash', power: 2 },
      { key: 'Skill03', name: 'Disintegration', texture: 'disintegration', power: 3 },
      { key: 'Skill04', name: 'Faith Guard', texture: 'faith', power: 4 },
    ],
    ult: { key: 'Ultimate', name: 'Chrono-Saltation', texture: 'chrono', power: 5 },
  },
  guy: {
    skills: [
      { key: 'Skill01', name: 'Pride Cut', texture: 'pride-cut', power: 1 },
      { key: 'Skill02', name: 'Crimson Magic', texture: 'crimson', power: 2 },
      { key: 'Skill03', name: 'Dominate', texture: 'dominate', power: 3 },
      { key: 'Skill04', name: 'True Dragon Lord', texture: 'true-dragon-lord', power: 4 },
    ],
    ult: { key: 'Ultimate', name: 'World Ruin', texture: 'world-ruin', power: 5 },
  },
  shuna: {
    skills: [
      { key: 'Skill01', name: 'Holy Flame', texture: 'holy-flame', power: 1 },
      { key: 'Skill02', name: 'Barrier', texture: 'barrier', power: 2 },
      { key: 'Skill03', name: 'Blessing', texture: 'bless', power: 3 },
      { key: 'Skill04', name: 'Purify', texture: 'purify', power: 4 },
    ],
    ult: { key: 'Ultimate', name: 'Temple Light', texture: 'temple-light', power: 5 },
  },
  souei: {
    skills: [
      { key: 'Skill01', name: 'Shadow Stab', texture: 'shadow-stab', power: 1 },
      { key: 'Skill02', name: 'Clone Dash', texture: 'clone', power: 2 },
      { key: 'Skill03', name: 'Shadow Kunai', texture: 'kunai', power: 3 },
      { key: 'Skill04', name: 'Assassinate', texture: 'assassinate', power: 4 },
    ],
    ult: { key: 'Ultimate', name: 'Death Shadow', texture: 'death-shadow', power: 5 },
  },
  hakurou: {
    skills: [
      { key: 'Skill01', name: 'Iai', texture: 'iai', power: 1 },
      { key: 'Skill02', name: 'Second Form', texture: 'form-two', power: 2 },
      { key: 'Skill03', name: 'Sword Parry', texture: 'sword-parry', power: 3 },
      { key: 'Skill04', name: 'Secret Art', texture: 'secret', power: 4 },
    ],
    ult: { key: 'Ultimate', name: 'Moon Fang', texture: 'moon-fang', power: 5 },
  },
}

export function skillsFor(id: FighterIdValue): { skills: SkillSfxDef[]; ultimate: SkillSfxDef } {
  const sig = signatureOf(id)
  const spec = SPECS[id]
  return {
    skills: spec.skills.map((item, index) => textures(sig, item, index)),
    ultimate: textures(sig, spec.ult, 4),
  }
}

export function skillTextureId(id: FighterIdValue, slot: number): string {
  const spec = SPECS[id]
  if (slot >= 4) {
    return spec.ult.texture
  }
  return spec.skills[slot]?.texture ?? spec.skills[0]!.texture
}
