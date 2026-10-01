export type BootLoadPhase = 'assets' | 'characters' | 'animations' | 'audio' | 'vfx' | 'story' | 'ui'

export interface BootLoadState {
  /** Phaser file loader 0–1 (stages, FX sheets, portraits). */
  phaser: number
  manifests: boolean
  /** Punched sprite clips 0–1. */
  sprites: number
  /** True only when boot may leave for the menu. */
  ready: boolean
}

export function bootLoadPercent(state: BootLoadState): number {
  if (state.ready) {
    return 100
  }
  const phaser = clamp01(state.phaser)
  const sprites = clamp01(state.sprites)
  const raw = phaser * 0.28 + (state.manifests ? 0.07 : 0) + sprites * 0.65
  return Math.min(99, Math.floor(raw * 100))
}

export function bootLoadPhase(state: BootLoadState): BootLoadPhase {
  if (state.ready) {
    return 'ui'
  }
  if (state.phaser < 0.4) {
    return 'assets'
  }
  if (state.phaser < 0.78) {
    return 'vfx'
  }
  if (!state.manifests) {
    return 'characters'
  }
  if (state.sprites < 0.32) {
    return 'animations'
  }
  if (state.sprites < 0.68) {
    return 'characters'
  }
  if (state.sprites < 0.82) {
    return 'audio'
  }
  if (state.sprites < 0.94) {
    return 'story'
  }
  return 'ui'
}

export class LoadProgress {
  phaser = 0
  manifests = false
  sprites = 0
  ready = false

  snapshot(): BootLoadState {
    return {
      phaser: this.phaser,
      manifests: this.manifests,
      sprites: this.sprites,
      ready: this.ready,
    }
  }

  get percent(): number {
    return bootLoadPercent(this.snapshot())
  }

  get phase(): BootLoadPhase {
    return bootLoadPhase(this.snapshot())
  }
}

function clamp01(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0
  }
  return value >= 1 ? 1 : value
}
