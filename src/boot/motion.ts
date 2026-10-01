import { saveManager } from '../save/SaveManager.ts'
import { screenFxEnabled } from '../effects/ScreenFx.ts'

export function bootReducedMotion(): boolean {
  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return true
  }
  if (!screenFxEnabled()) {
    return true
  }
  return saveManager.load().settings.quality === 'low'
}

export function bootParticleCap(density: number, reduced: boolean): number {
  if (reduced) {
    return 4
  }
  const quality = saveManager.load().settings.quality
  const base = quality === 'medium' ? 14 : 22
  return Math.max(6, Math.min(28, Math.round(base * density)))
}
