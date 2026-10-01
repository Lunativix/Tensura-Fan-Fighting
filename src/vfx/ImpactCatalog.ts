export type ImpactTier = 'light' | 'medium' | 'heavy' | 'extreme'

export interface ShakePreset {
  duration: number
  intensity: number
}

export const SHAKE = {
  LIGHT: { duration: 70, intensity: 0.0035 },
  MEDIUM: { duration: 90, intensity: 0.0065 },
  HEAVY: { duration: 120, intensity: 0.011 },
  ULTIMATE: { duration: 170, intensity: 0.016 },
} as const satisfies Record<string, ShakePreset>

export interface ImpactFeel {
  tier: ImpactTier
  hitStop: number
  shake: ShakePreset
  zoom: number
  flashMs: number
  flashColor: number
  rumble: number
}

export function impactTier(power: number, ultimate: boolean, blocked: boolean): ImpactTier {
  if (blocked) {
    return power >= 120 ? 'medium' : 'light'
  }
  if (ultimate || power >= 220) {
    return 'extreme'
  }
  if (power >= 110) {
    return 'heavy'
  }
  if (power >= 48) {
    return 'medium'
  }
  return 'light'
}

export function impactFeel(power: number, ultimate: boolean, blocked: boolean, perfect: boolean): ImpactFeel {
  const tier = impactTier(power, ultimate, blocked || perfect)
  if (tier === 'extreme') {
    return { tier, hitStop: 92, shake: SHAKE.ULTIMATE, zoom: 0.16, flashMs: 70, flashColor: 0xffffff, rumble: 0.7 }
  }
  if (tier === 'heavy') {
    return { tier, hitStop: 56, shake: SHAKE.HEAVY, zoom: 0.1, flashMs: 48, flashColor: 0xffe082, rumble: 0.4 }
  }
  if (tier === 'medium') {
    return { tier, hitStop: 34, shake: SHAKE.MEDIUM, zoom: 0.045, flashMs: 32, flashColor: 0xffffff, rumble: 0.22 }
  }
  return { tier, hitStop: 8, shake: SHAKE.LIGHT, zoom: 0, flashMs: 18, flashColor: 0xffffff, rumble: 0.12 }
}
