/**
 * Effets en planche (spritesheets additifs, fond noir) : 8 frames de 384x384 en grille 4x2.
 * Charges via PreloadScene, joues via vfxEngine.playSheet().
 */
export const FX_FRAME_SIZE = 384
export const FX_FRAME_COUNT = 8

export interface FxSheetDef {
  id: string
  file: string
  fps: number
  loop: boolean
  /** echelle par defaut a l'ecran (1 = 384px) */
  scale: number
}

export const FX_SHEETS: FxSheetDef[] = [
  // --- systeme 3v3 ---
  { id: 'SWITCH_IN', file: 'fx_switch_in.png', fps: 18, loop: false, scale: 0.9 },
  { id: 'SWITCH_OUT', file: 'fx_switch_out.png', fps: 16, loop: false, scale: 0.9 },
  { id: 'ASSIST', file: 'fx_assist.png', fps: 20, loop: false, scale: 0.8 },
  { id: 'EMERGENCY', file: 'fx_emergency.png', fps: 16, loop: false, scale: 1.0 },
  // --- etats de puissance ---
  { id: 'CHARGE_AURA', file: 'fx_charge.png', fps: 12, loop: true, scale: 0.75 },
  { id: 'RAGE', file: 'fx_rage.png', fps: 14, loop: false, scale: 0.85 },
  { id: 'TRANSFORM', file: 'fx_transform.png', fps: 14, loop: false, scale: 1.0 },
  { id: 'ULTIMATE_FLASH', file: 'fx_ultimate_flash.png', fps: 18, loop: false, scale: 1.1 },
  { id: 'ULTIMATE_IMPACT', file: 'fx_ultimate_impact.png', fps: 14, loop: false, scale: 1.3 },
  { id: 'LOW_HP', file: 'fx_low_hp.png', fps: 10, loop: true, scale: 0.6 },
  { id: 'VICTORY_AURA', file: 'fx_victory.png', fps: 10, loop: true, scale: 0.85 },
]

export function fxTextureKey(id: string): string {
  return `fx-${id.toLowerCase()}`
}

export function fxAnimKey(id: string): string {
  return `fxanim-${id.toLowerCase()}`
}

export function fxById(id: string): FxSheetDef | undefined {
  return FX_SHEETS.find((f) => f.id === id)
}
