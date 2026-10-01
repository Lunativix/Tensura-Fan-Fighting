import { VFX_LIBRARY } from '../../vfx/VfxEngine.ts'
import { profileFor } from '../../audio/profiles/CharacterAudio.ts'
import type { FighterIdValue } from '../../types/game.ts'
import type { SkillVfxHooks } from './types.ts'

/** Named CombatSpectacle cases. Unknown ids are VFX_MISSING, never a generic IMPACT fill. */
export const KNOWN_SKILL_VFX = new Set([
  'dash', 'dash_afterimage', 'afterimage', 'teleport', 'speed_lines', 'trail',
  'energy_charge', 'charge', 'aura', 'water_flash', 'water_mist', 'energy_burst',
  'energy_beam', 'magic_circle', 'shockwave', 'dust', 'debris', 'ground_impact',
  'magic_explosion', 'explosion', 'flash',
  'impact_light', 'impact_medium', 'impact_heavy', 'impact_critical', 'impact_ultimate',
])

export type HookFlag = 'VFX_READY' | 'VFX_MISSING' | 'SFX_READY' | 'SFX_MISSING' | 'CAMERA_READY' | 'CAMERA_MISSING'

export function vfxHookFlag(id: string | undefined): 'VFX_READY' | 'VFX_MISSING' {
  if (!id) {
    return 'VFX_MISSING'
  }
  if (KNOWN_SKILL_VFX.has(id)) {
    return 'VFX_READY'
  }
  if (VFX_LIBRARY[id.toUpperCase()]) {
    return 'VFX_READY'
  }
  return 'VFX_MISSING'
}

export function vfxHooksFlags(hooks: SkillVfxHooks): Record<keyof SkillVfxHooks, 'VFX_READY' | 'VFX_MISSING'> {
  return {
    cast: vfxHookFlag(hooks.cast),
    release: vfxHookFlag(hooks.release),
    travel: vfxHookFlag(hooks.travel),
    impact: vfxHookFlag(hooks.impact),
    recovery: vfxHookFlag(hooks.recovery),
  }
}

export function sfxHookFlag(fighterId: FighterIdValue, slot: 0 | 1 | 2 | 3 | 4): 'SFX_READY' | 'SFX_MISSING' {
  const profile = profileFor(fighterId)
  if (slot === 4) {
    return profile.ultimate.release ? 'SFX_READY' : 'SFX_MISSING'
  }
  return profile.skills[slot]?.release ? 'SFX_READY' : 'SFX_MISSING'
}
