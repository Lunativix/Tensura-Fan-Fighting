import { SfxBus, SfxPriority, type SfxRecipe } from '../SfxTypes.ts'
import { click, grit, noise, recipe, shimmer, sweep, thud, tone } from '../synth/recipe.ts'
import { signatureOf } from './signatures.ts'
import type { FighterIdValue } from '../../types/game.ts'

function pack(n: number, make: (i: number) => SfxRecipe): SfxRecipe[] {
  return Array.from({ length: n }, (_, i) => make(i))
}

export const COMMON_HITS = {
  light: pack(4, (i) =>
    recipe(`Common_Hit_Light_0${i + 1}`, [
      tone(420 + i * 55, 0.055, 0.09, { wave: 'triangle' }),
      thud(150 - i * 12, 0.05, 0.07),
    ], { priority: SfxPriority.IMPACT, cooldownMs: 28, maxInstances: 3 }),
  ),
  medium: pack(4, (i) =>
    recipe(`Common_Hit_Medium_0${i + 1}`, [
      tone(280 + i * 40, 0.08, 0.11, { wave: 'triangle' }),
      thud(90 - i * 8, 0.08, 0.11),
      grit(400, 0.04, 0.07),
    ], { priority: SfxPriority.IMPACT, cooldownMs: 40, maxInstances: 2 }),
  ),
  heavy: pack(4, (i) =>
    recipe(`Common_Hit_Heavy_0${i + 1}`, [
      thud(58 - i * 6, 0.16, 0.18),
      tone(180 + i * 24, 0.1, 0.08, { wave: 'sawtooth' }),
      grit(220, 0.07, 0.12, true),
    ], { priority: SfxPriority.IMPACT, cooldownMs: 60, maxInstances: 2 }),
  ),
  critical: pack(3, (i) =>
    recipe(`Common_Hit_Critical_0${i + 1}`, [
      thud(42, 0.18, 0.22),
      tone(880 - i * 80, 0.1, 0.1, { wave: 'square' }),
      noise(700, 0.12, 0.08, { q: 3 }),
    ], { bus: SfxBus.LEAD, priority: SfxPriority.SPECIAL, cooldownMs: 90, maxInstances: 1 }),
  ),
}

export const COMMON_GUARD = pack(4, (i) =>
  recipe(`Common_Guard_0${i + 1}`, [
    tone(240 + i * 30, 0.07, 0.09, { wave: 'triangle' }),
    thud(120, 0.05, 0.08),
  ], { priority: SfxPriority.SPECIAL, cooldownMs: 50, maxInstances: 2 }),
)

export const COMMON_PERFECT = recipe('Common_PerfectGuard_01', [
  tone(988, 0.1, 0.12, { wave: 'sine' }),
  tone(1480, 0.08, 0.08, { wave: 'triangle', delay: 0.02 }),
  shimmer(1760, 0.06, 0.18),
], { bus: SfxBus.LEAD, priority: SfxPriority.SPECIAL, cooldownMs: 140, maxInstances: 1, duckMs: 180, duckAmount: 0.4 })

export const COMMON_PARRY = pack(3, (i) =>
  recipe(`Common_Parry_0${i + 1}`, [
    tone(1320 + i * 80, 0.08, 0.13, { wave: 'triangle' }),
    sweep(1800, 600, 0.1, 0.08, { wave: 'sine' }),
  ], { bus: SfxBus.LEAD, priority: SfxPriority.SPECIAL, cooldownMs: 120, maxInstances: 1 }),
)

export const COMMON_COUNTER = pack(3, (i) =>
  recipe(`Common_Counter_0${i + 1}`, [
    tone(196 + i * 20, 0.1, 0.1, { wave: 'sawtooth' }),
    thud(70, 0.1, 0.14),
    shimmer(880, 0.05, 0.12),
  ], { bus: SfxBus.LEAD, priority: SfxPriority.SPECIAL, cooldownMs: 120, maxInstances: 1 }),
)

export const COMMON_CLASH = {
  small: recipe('Common_Clash_Small_01', [tone(500, 0.08, 0.1, { wave: 'triangle' }), thud(100, 0.06, 0.08)], { priority: SfxPriority.SPECIAL }),
  medium: recipe('Common_Clash_Medium_01', [thud(70, 0.12, 0.14), tone(400, 0.1, 0.09, { wave: 'square' })], { priority: SfxPriority.SKILL2 }),
  heavy: recipe('Common_Clash_Heavy_01', [thud(40, 0.18, 0.22), noise(200, 0.16, 0.08, { color: 'brown' })], { bus: SfxBus.LEAD, priority: SfxPriority.SKILL3, duckMs: 160 }),
  massive: recipe('Common_Clash_Massive_01', [thud(26, 0.22, 0.32), noise(90, 0.24, 0.1, { color: 'brown' }), tone(80, 0.2, 0.08, { wave: 'sawtooth' })], { bus: SfxBus.LEAD, priority: SfxPriority.SKILL4, duckMs: 280 }),
  ultimate: recipe('Common_Clash_Ultimate_01', [thud(18, 0.26, 0.45), tone(36, 0.35, 0.12, { wave: 'sine' }), noise(60, 0.35, 0.1, { color: 'brown' })], { bus: SfxBus.LEAD, priority: SfxPriority.ULTIMATE, duckMs: 500, duckAmount: 0.2 }),
}

export const COMMON_KO = recipe('Common_KO_01', [
  thud(36, 0.16, 0.28),
  sweep(200, 50, 0.3, 0.08, { wave: 'sine' }),
], { bus: SfxBus.LEAD, priority: SfxPriority.SPECIAL, cooldownMs: 400, maxInstances: 1 })

export const COMMON_SWITCH = {
  normal: recipe('Character_Switch_01', [sweep(420, 180, 0.12, 0.1, { wave: 'triangle' }), click(880, 0.06)], { bus: SfxBus.LEAD, priority: SfxPriority.SPECIAL, cooldownMs: 180 }),
  fast: recipe('Character_Switch_Fast_01', [sweep(700, 240, 0.08, 0.1, { wave: 'triangle' }), click(1200, 0.05)], { bus: SfxBus.LEAD, priority: SfxPriority.SPECIAL }),
  combo: recipe('Character_Switch_Combo_01', [sweep(500, 160, 0.1, 0.1, { wave: 'sawtooth' }), thud(90, 0.07, 0.1)], { bus: SfxBus.LEAD, priority: SfxPriority.SPECIAL }),
  attack: recipe('Character_Switch_Attack_01', [sweep(360, 120, 0.12, 0.11, { wave: 'sawtooth' }), grit(300, 0.05, 0.1)], { bus: SfxBus.LEAD, priority: SfxPriority.SPECIAL }),
  ko: recipe('Character_Switch_KO_01', [thud(50, 0.12, 0.18), sweep(200, 80, 0.16, 0.08, { wave: 'sine' })], { bus: SfxBus.LEAD, priority: SfxPriority.SPECIAL }),
  assist: recipe('Character_Assist_01', [click(760, 0.07), shimmer(1100, 0.05, 0.14)], { bus: SfxBus.LEAD, priority: SfxPriority.SPECIAL }),
  entry: recipe('Character_Entry_01', [tone(330, 0.14, 0.08, { wave: 'sine' }), shimmer(880, 0.04, 0.18)], { bus: SfxBus.LEAD, priority: SfxPriority.SPECIAL }),
}

export const COMMON_INTERRUPT = recipe('Common_Skill_Interrupted_01', [
  noise(500, 0.08, 0.07, { q: 2 }),
  sweep(300, 80, 0.1, 0.07, { wave: 'triangle' }),
], { priority: SfxPriority.SKILL1, cooldownMs: 120 })

export const UI_RECIPES: Record<string, SfxRecipe> = {
  confirm: recipe('UI_Confirm_01', [click(760, 0.1), tone(1140, 0.07, 0.05, { wave: 'sine', delay: 0.03 })], { bus: SfxBus.UI, priority: SfxPriority.UI, cooldownMs: 40 }),
  back: recipe('UI_Back_01', [click(280, 0.09), tone(180, 0.08, 0.05, { wave: 'sine' })], { bus: SfxBus.UI, priority: SfxPriority.UI }),
  move: recipe('UI_Move_01', [click(620, 0.05)], { bus: SfxBus.UI, priority: SfxPriority.UI, cooldownMs: 50, maxInstances: 1 }),
  error: recipe('UI_Error_01', [tone(140, 0.14, 0.1, { wave: 'square' }), thud(70, 0.06, 0.1)], { bus: SfxBus.UI, priority: SfxPriority.UI }),
  tab: recipe('UI_Tab_01', [click(520, 0.06), shimmer(900, 0.03, 0.1)], { bus: SfxBus.UI, priority: SfxPriority.UI }),
  skill: recipe('UI_SkillSelect_01', [tone(440, 0.08, 0.07, { wave: 'triangle' }), click(880, 0.04)], { bus: SfxBus.UI, priority: SfxPriority.UI }),
  victory: recipe('UI_Victory_01', [tone(523, 0.18, 0.1, { wave: 'sine' }), tone(784, 0.2, 0.08, { delay: 0.08 }), shimmer(1046, 0.05, 0.3)], { bus: SfxBus.UI, priority: SfxPriority.SPECIAL }),
  defeat: recipe('UI_Defeat_01', [sweep(220, 70, 0.35, 0.1, { wave: 'sine' }), thud(50, 0.08, 0.2)], { bus: SfxBus.UI, priority: SfxPriority.SPECIAL }),
  buy: recipe('UI_Buy_01', [click(980, 0.08), tone(1318, 0.1, 0.06, { delay: 0.04 })], { bus: SfxBus.UI, priority: SfxPriority.UI }),
  unlock: recipe('UI_Unlock_01', [shimmer(1200, 0.08, 0.22), tone(659, 0.14, 0.07, { wave: 'sine' })], { bus: SfxBus.UI, priority: SfxPriority.UI }),
  notify: recipe('UI_Notify_01', [click(840, 0.07), shimmer(1260, 0.04, 0.12)], { bus: SfxBus.UI, priority: SfxPriority.UI }),
  rare: recipe('UI_RareReveal_01', [shimmer(1480, 0.1, 0.22), tone(784, 0.16, 0.08, { wave: 'sine' }), tone(1175, 0.12, 0.06, { delay: 0.08 })], { bus: SfxBus.UI, priority: SfxPriority.SPECIAL }),
  legendary: recipe('UI_LegendaryReveal_01', [thud(48, 0.12, 0.16), tone(523, 0.2, 0.1, { wave: 'sine' }), shimmer(1568, 0.08, 0.35)], { bus: SfxBus.LEAD, priority: SfxPriority.SPECIAL, duckMs: 220 }),
  mythic: recipe('UI_MythicReveal_01', [thud(28, 0.2, 0.28), sweep(80, 40, 0.4, 0.1, { wave: 'sawtooth' }), shimmer(1860, 0.1, 0.4)], { bus: SfxBus.LEAD, priority: SfxPriority.ULTIMATE, duckMs: 380 }),
  chest: recipe('UI_ChestOpen_01', [thud(70, 0.1, 0.12), sweep(180, 420, 0.22, 0.08, { wave: 'triangle' }), click(980, 0.06)], { bus: SfxBus.UI, priority: SfxPriority.SPECIAL }),
  newItem: recipe('UI_NewItem_01', [click(920, 0.07), tone(988, 0.12, 0.07, { wave: 'sine', delay: 0.04 })], { bus: SfxBus.UI, priority: SfxPriority.UI }),
  ready: recipe('UI_Ready_01', [tone(392, 0.12, 0.08, { wave: 'triangle' }), click(784, 0.05)], { bus: SfxBus.UI, priority: SfxPriority.UI }),
  fight: recipe('UI_Fight_01', [thud(80, 0.1, 0.14), tone(660, 0.12, 0.08, { wave: 'sawtooth' })], { bus: SfxBus.LEAD, priority: SfxPriority.SPECIAL }),
  charge: recipe('Cinematic_Charge_01', [sweep(120, 320, 0.35, 0.08, { wave: 'sine' })], { bus: SfxBus.LEAD, priority: SfxPriority.SKILL3 }),
  flash: recipe('Cinematic_Flash_01', [tone(1400, 0.08, 0.1, { wave: 'sine' }), noise(3000, 0.06, 0.05, { q: 2 })], { bus: SfxBus.LEAD, priority: SfxPriority.SKILL3 }),
  whoosh: recipe('Cinematic_Whoosh_01', [noise(900, 0.16, 0.08, { freqEnd: 200, q: 2 })], { bus: SfxBus.SFX, priority: SfxPriority.ATTACK }),
  impact: recipe('Cinematic_Impact_01', [thud(40, 0.16, 0.22), grit(180, 0.08, 0.14, true)], { bus: SfxBus.LEAD, priority: SfxPriority.SKILL3 }),
  transform: recipe('Cinematic_Transform_01', [sweep(80, 40, 0.4, 0.1, { wave: 'sawtooth' }), shimmer(600, 0.05, 0.3)], { bus: SfxBus.LEAD, priority: SfxPriority.SKILL4, duckMs: 280 }),
  boot: recipe('Boot_Spark_01', [tone(196, 0.22, 0.07, { wave: 'sine' }), shimmer(880, 0.04, 0.16)], { bus: SfxBus.UI, priority: SfxPriority.UI, cooldownMs: 400, maxInstances: 1 }),
  bootCreator: recipe('Boot_Creator_01', [tone(392, 0.16, 0.08, { wave: 'sine' }), shimmer(1174, 0.05, 0.18), tone(784, 0.12, 0.05, { wave: 'triangle', delay: 0.06 })], { bus: SfxBus.UI, priority: SfxPriority.SPECIAL, cooldownMs: 400, maxInstances: 1 }),
  bootStudio: recipe('Boot_Studio_01', [tone(330, 0.14, 0.06, { wave: 'sine' }), click(920, 0.04)], { bus: SfxBus.UI, priority: SfxPriority.UI, cooldownMs: 400, maxInstances: 1 }),
  bootDone: recipe('Boot_Complete_01', [sweep(180, 520, 0.22, 0.08, { wave: 'sine' }), thud(48, 0.1, 0.14), tone(988, 0.1, 0.06, { wave: 'sine', delay: 0.08 })], { bus: SfxBus.LEAD, priority: SfxPriority.SPECIAL, cooldownMs: 600, maxInstances: 1, duckMs: 180 }),
}

export function movementDash(id: FighterIdValue, air: boolean): SfxRecipe {
  const sig = signatureOf(id)
  const hz = air ? sig.dashHz * 1.25 : sig.dashHz
  return recipe(`${sig.pascal}_Dash_${air ? 'Air' : '01'}`, [
    noise(hz, air ? 0.12 : 0.1, 0.07 * sig.weight, { freqEnd: hz * 0.35, q: 2.2 }),
    tone(sig.baseHz * 0.5, 0.08, 0.04 * sig.weight, { wave: sig.wave }),
  ], { priority: SfxPriority.MOVEMENT, cooldownMs: 90, maxInstances: 1 })
}

export function movementJump(id: FighterIdValue): SfxRecipe {
  const sig = signatureOf(id)
  return recipe(`${sig.pascal}_Jump_01`, [
    sweep(sig.stepHz, sig.stepHz * 1.6, 0.08, 0.06 * sig.weight, { wave: 'sine' }),
    noise(500, 0.07, 0.03, { q: 2 }),
  ], { priority: SfxPriority.MOVEMENT, cooldownMs: 120, maxInstances: 1 })
}

export function movementLand(id: FighterIdValue): SfxRecipe {
  const sig = signatureOf(id)
  return recipe(`${sig.pascal}_Land_01`, [
    thud(sig.landHz, 0.08 * sig.weight, 0.1 + sig.weight * 0.04),
    grit(sig.landHz * 2, 0.03 * sig.grit, 0.08, sig.weight > 1.1),
  ], { priority: SfxPriority.MOVEMENT, cooldownMs: 140, maxInstances: 1 })
}

export function movementStep(id: FighterIdValue, run: boolean): SfxRecipe {
  const sig = signatureOf(id)
  return recipe(`${sig.pascal}_${run ? 'Run' : 'Walk'}_01`, [
    thud(sig.stepHz * (run ? 0.7 : 1), run ? 0.045 : 0.03 * sig.weight, 0.06),
  ], { priority: SfxPriority.MOVEMENT, cooldownMs: run ? 160 : 240, maxInstances: 1 })
}

export function swingOf(id: FighterIdValue, heavy: boolean): SfxRecipe {
  const sig = signatureOf(id)
  const hz = heavy ? sig.baseHz * 0.7 : sig.baseHz * 1.4
  return recipe(`${sig.pascal}_Swing_${heavy ? 'Heavy' : 'Light'}_01`, [
    sweep(hz * 2.2, hz * 0.6, heavy ? 0.12 : 0.07, heavy ? 0.09 : 0.06, { wave: sig.wave }),
    ...(sig.impact === 'light-blade' || sig.impact === 'searing slash' || sig.impact === 'single clean cut'
      ? [tone(hz * 3, 0.05, 0.04, { wave: 'triangle' })]
      : [grit(hz, 0.03 * sig.grit, 0.07)]),
  ], { priority: SfxPriority.ATTACK, cooldownMs: 40, maxInstances: 2 })
}

export function characterHitLayer(id: FighterIdValue, power: number): SfxRecipe {
  const sig = signatureOf(id)
  return recipe(`${sig.pascal}_ImpactLayer_01`, [
    tone(sig.baseHz, 0.07, 0.045, { wave: sig.subWave }),
    ...(sig.grit > 0.25 ? [grit(sig.filterHz * 0.3, 0.03 * sig.grit, 0.08)] : [shimmer(sig.baseHz * sig.brightness, 0.03, 0.1)]),
    ...(power > 140 ? [thud(sig.landHz, 0.06, 0.12)] : []),
  ], { priority: SfxPriority.IMPACT, cooldownMs: 30, maxInstances: 3 })
}

export function transformOf(id: FighterIdValue): SfxRecipe {
  const sig = signatureOf(id)
  return recipe(`${sig.pascal}_Transform_01`, [
    sweep(sig.baseHz, sig.baseHz * 0.4, 0.45, 0.12, { wave: sig.wave }),
    thud(sig.landHz, 0.1, 0.28),
    shimmer(sig.baseHz * 2, 0.05, 0.35),
  ], { bus: SfxBus.LEAD, priority: SfxPriority.SKILL4, duckMs: 320, cooldownMs: 400, maxInstances: 1 })
}

export function koOf(id: FighterIdValue): SfxRecipe {
  const sig = signatureOf(id)
  return recipe(`${sig.pascal}_KO_01`, [
    thud(sig.landHz * 0.7, 0.14 * sig.weight, 0.28),
    sweep(sig.baseHz, sig.baseHz * 0.25, 0.35, 0.08, { wave: sig.subWave }),
  ], { bus: SfxBus.LEAD, priority: SfxPriority.SPECIAL, cooldownMs: 500, maxInstances: 1 })
}

export function envOf(stageId: string): SfxRecipe {
  const table: Record<string, SfxRecipe> = {
    jura_forest: recipe('Env_JuraForest_01', [noise(400, 1.8, 0.04, { color: 'white', q: 0.7, filterType: 'lowpass', filterFreq: 800 })], { bus: SfxBus.ENV, priority: SfxPriority.ENV, cooldownMs: 1600, maxInstances: 1 }),
    sealed_cave: recipe('Env_SealedCave_01', [tone(70, 1.6, 0.03, { wave: 'sine' }), noise(180, 1.6, 0.03, { color: 'brown', filterType: 'lowpass' })], { bus: SfxBus.ENV, priority: SfxPriority.ENV, cooldownMs: 1500, maxInstances: 1 }),
    dwargon: recipe('Env_Dwargon_01', [thud(55, 0.03, 0.4), noise(120, 1.4, 0.03, { color: 'brown', filterType: 'lowpass' })], { bus: SfxBus.ENV, priority: SfxPriority.ENV, cooldownMs: 1800, maxInstances: 1 }),
    tempest_arena: recipe('Env_Arena_01', [noise(900, 1.2, 0.025, { q: 0.8, filterType: 'lowpass' })], { bus: SfxBus.ENV, priority: SfxPriority.ENV, cooldownMs: 1400, maxInstances: 1 }),
    walpurgis: recipe('Env_Walpurgis_01', [tone(48, 1.8, 0.035, { wave: 'sine' }), shimmer(180, 0.02, 1.6)], { bus: SfxBus.ENV, priority: SfxPriority.ENV, cooldownMs: 1700, maxInstances: 1 }),
    frost_palace: recipe('Env_Frost_01', [noise(2400, 1.5, 0.02, { filterType: 'highpass', q: 0.6 }), tone(90, 1.5, 0.025, { wave: 'sine' })], { bus: SfxBus.ENV, priority: SfxPriority.ENV, cooldownMs: 1600, maxInstances: 1 }),
    tempest_invasion: recipe('Env_Invasion_01', [noise(200, 1.4, 0.035, { color: 'brown', filterType: 'lowpass' }), thud(40, 0.02, 0.3)], { bus: SfxBus.ENV, priority: SfxPriority.ENV, cooldownMs: 1500, maxInstances: 1 }),
  }
  return table[stageId] ?? recipe('Env_Tempest_01', [noise(600, 1.6, 0.02, { q: 0.6, filterType: 'lowpass', filterFreq: 1000 })], { bus: SfxBus.ENV, priority: SfxPriority.ENV, cooldownMs: 1800, maxInstances: 1 })
}
