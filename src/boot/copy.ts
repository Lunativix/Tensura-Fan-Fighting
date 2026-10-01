import type { BootLoadPhase } from './LoadProgress.ts'
import { BOOT_BRANDING } from './branding.ts'
import { t } from '../i18n/strings.ts'

const PHASE_KEY: Record<BootLoadPhase, 'loadAssets' | 'loadCharacters' | 'loadAnimations' | 'loadAudio' | 'loadVfx' | 'loadStory' | 'loadUi'> = {
  assets: 'loadAssets',
  characters: 'loadCharacters',
  animations: 'loadAnimations',
  audio: 'loadAudio',
  vfx: 'loadVfx',
  story: 'loadStory',
  ui: 'loadUi',
}

export function bootLoadingLabel(): string {
  if (BOOT_BRANDING.loadingText) {
    return BOOT_BRANDING.loadingText
  }
  return t('loading')
}

export function bootPhaseLabel(phase: BootLoadPhase): string {
  return t(PHASE_KEY[phase])
}

export function loadingDots(count: number): string {
  const n = ((count % 4) + 4) % 4
  return '.'.repeat(n)
}
