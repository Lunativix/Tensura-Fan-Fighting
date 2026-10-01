import type { FighterIdValue } from '../../types/game.ts'
import type { ScaleId } from './types.ts'

export const SCALES: Record<ScaleId, number[]> = {
  majorPenta: [0, 2, 4, 7, 9],
  minorPenta: [0, 3, 5, 7, 10],
  yo: [0, 2, 5, 7, 9],
  hirajoshi: [0, 2, 3, 7, 8],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
}

export function degreeToHz(rootHz: number, scale: ScaleId, degree: number, octave: number): number {
  if (degree <= 0) {
    return 0
  }
  const steps = SCALES[scale]
  const index = degree - 1
  const wrap = Math.floor(index / steps.length)
  const pc = steps[index - wrap * steps.length] ?? 0
  return rootHz * (2 ** (octave + wrap + pc / 12))
}

/** Original 4–6 note signatures. Not Tensura OST material. */
export const LEITMOTIFS: Record<string, { scale: ScaleId; rootHz: number; degrees: number[] }> = {
  rimuru: { scale: 'dorian', rootHz: 146.83, degrees: [1, 3, 4, 5, 3, 1] },
  veldora: { scale: 'lydian', rootHz: 65.41, degrees: [1, 5, 1, 6, 5, 8] },
  tempest: { scale: 'yo', rootHz: 196, degrees: [1, 2, 3, 5, 3, 2] },
  milim: { scale: 'lydian', rootHz: 329.63, degrees: [1, 5, 4, 6, 5, 8] },
  diablo: { scale: 'phrygian', rootHz: 130.81, degrees: [1, 2, 1, 5, 4] },
  clayman: { scale: 'harmonicMinor', rootHz: 185, degrees: [1, 7, 6, 7, 3, 2] },
  benimaru: { scale: 'harmonicMinor', rootHz: 220, degrees: [5, 4, 3, 1, 5] },
  shion: { scale: 'minorPenta', rootHz: 164.81, degrees: [1, 5, 6, 5, 3] },
  shuna: { scale: 'majorPenta', rootHz: 261.63, degrees: [1, 3, 2, 5, 3] },
  souei: { scale: 'hirajoshi', rootHz: 185, degrees: [5, 3, 1, 3, 5] },
  hakurou: { scale: 'yo', rootHz: 174.61, degrees: [1, 2, 5, 4, 2] },
  hinata: { scale: 'dorian', rootHz: 246.94, degrees: [1, 4, 5, 4, 1] },
  guy: { scale: 'phrygian', rootHz: 110, degrees: [1, 5, 4, 7, 5] },
  ranga: { scale: 'minorPenta', rootHz: 98, degrees: [1, 5, 8, 5, 3] },
  gobta: { scale: 'majorPenta', rootHz: 293.66, degrees: [1, 3, 5, 3, 1] },
  geld: { scale: 'dorian', rootHz: 87.31, degrees: [1, 2, 5, 4, 1] },
  gabiru: { scale: 'lydian', rootHz: 233.08, degrees: [1, 5, 3, 5, 8] },
}

export function motifFor(id: string): { scale: ScaleId; rootHz: number; degrees: number[] } {
  return LEITMOTIFS[id] ?? LEITMOTIFS.tempest!
}

export function fighterMotifId(id: FighterIdValue): string {
  return LEITMOTIFS[id] ? id : 'tempest'
}

export const TEMPEST_FIGHTERS = new Set<string>([
  'rimuru',
  'benimaru',
  'shion',
  'shuna',
  'souei',
  'hakurou',
])
