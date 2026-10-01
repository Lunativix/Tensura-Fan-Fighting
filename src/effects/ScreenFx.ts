import { saveManager } from '../save/SaveManager.ts'

export function screenFxEnabled(): boolean {
  return saveManager.load().settings.screenFx !== false
}

export function vfxBudget(): number {
  const q = saveManager.load().settings.quality
  if (q === 'low') {
    return 8
  }
  if (q === 'medium') {
    return 16
  }
  return 24
}
