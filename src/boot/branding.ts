/** Identity + timing for the boot signature. Change names here, not in the animation. */
export const BOOT_BRANDING = {
  creatorName: 'Furin@',
  studioName: 'WyzixSoftware',
  /** Empty = locale string (`CHARGEMENT` / `LOADING`). */
  loadingText: '',
  animationDuration: 2100,
  particleDensity: 1,
  music: 'menu.boot',
  sfx: {
    boot: 'boot',
    creator: 'bootCreator',
    studio: 'bootStudio',
    complete: 'bootDone',
  },
  blackMs: 260,
  energyMs: 480,
  creatorMs: 760,
  studioMs: 400,
  finishMs: 480,
} as const

export type BootVariation = 'particles' | 'circle' | 'core' | 'lines'

export const BOOT_VARIATIONS: readonly BootVariation[] = ['particles', 'circle', 'core', 'lines']

export function pickBootVariation(): BootVariation {
  const index = Math.floor(Math.random() * BOOT_VARIATIONS.length)
  return BOOT_VARIATIONS[index] ?? 'particles'
}

export function bootIntroMs(): number {
  return BOOT_BRANDING.blackMs + BOOT_BRANDING.energyMs + BOOT_BRANDING.creatorMs + BOOT_BRANDING.studioMs
}

let hubHandoff = false

export function markBootHandoff(): void {
  hubHandoff = true
}

export function consumeBootHandoff(): boolean {
  const next = hubHandoff
  hubHandoff = false
  return next
}
