import { allOwnNormalSlots, allSkillAnimDefs } from './registry.ts'

/**
 * Drop-in skill / unique-normal frames must play as authored.
 * Idle/walk/attack studio sheets may still punch a white backdrop.
 */
export function keepArtistPixels(clip: string): boolean {
  const slash = clip.replace(/\\/g, '/')
  const afterDir = slash.includes('/') ? slash.slice(slash.lastIndexOf('/') + 1) : slash
  const animId = afterDir.includes('__') ? afterDir.slice(afterDir.lastIndexOf('__') + 2) : afterDir
  return allSkillAnimDefs().some((def) => def.animId === animId)
    || allOwnNormalSlots().some((slot) => slot.animId === animId)
}
