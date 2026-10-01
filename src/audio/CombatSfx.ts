import type { Fighter } from '../characters/Fighter.ts'
import { AttackKind, type AttackData } from '../combat/Attack.ts'
import type { FighterIdValue } from '../types/game.ts'
import { audio } from './AudioManager.ts'
import { sfxEngine } from './SfxEngine.ts'
import type { AudioCue, CombatSfxContext, SkillSfxDef } from './SfxTypes.ts'
import { profileFor } from './profiles/CharacterAudio.ts'
import {
  COMMON_CLASH,
  COMMON_COUNTER,
  COMMON_GUARD,
  COMMON_HITS,
  COMMON_INTERRUPT,
  COMMON_KO,
  COMMON_PARRY,
  COMMON_PERFECT,
  COMMON_SWITCH,
  UI_RECIPES,
  characterHitLayer,
  envOf,
  movementDash,
  movementJump,
  movementLand,
  movementStep,
  swingOf,
} from './profiles/commonCatalog.ts'
import { FighterState } from '../combat/FighterState.ts'
import type { Projectile } from '../combat/Projectile.ts'
import { slotForAttack } from '../combat/anim/registry.ts'

let envStage = 'tempest_city'
let lastEnv = 0
let lastStep = new Map<string, number>()

function skillDef(id: FighterIdValue, slot: number | null, attack?: AttackData | null): SkillSfxDef | undefined {
  const profile = profileFor(id)
  if (attack) {
    const mapped = slotForAttack(id, attack)
    if (mapped === 4) {
      return profile.ultimate
    }
    if (mapped !== null) {
      return profile.skills[mapped]
    }
  }
  if (attack?.kind === AttackKind.ULTIMATE || slot === 4) {
    return profile.ultimate
  }
  if (slot === null || slot < 0) {
    return undefined
  }
  return profile.skills[Math.min(3, slot)]
}

function slotOf(fighter: Fighter, attack?: AttackData | null): number | null {
  if (fighter.lastSkillSlot !== null) {
    return fighter.lastSkillSlot
  }
  if (!attack) {
    return null
  }
  if (attack.kind === AttackKind.ULTIMATE || attack === fighter.kit.ultimate) {
    return 4
  }
  const index = fighter.kit.skills.findIndex((item) => item.id === attack.id)
  return index >= 0 ? index : null
}

export class CombatSfx {
  constructor() {
    sfxEngine.registerVariants('hit-light', COMMON_HITS.light)
    sfxEngine.registerVariants('hit-medium', COMMON_HITS.medium)
    sfxEngine.registerVariants('hit-heavy', COMMON_HITS.heavy)
    sfxEngine.registerVariants('hit-critical', COMMON_HITS.critical)
    sfxEngine.registerVariants('guard', COMMON_GUARD)
    sfxEngine.registerVariants('parry', COMMON_PARRY)
    sfxEngine.registerVariants('counter', COMMON_COUNTER)
    audio.bindSfx((id) => this.named(id))
  }

  named(id: string): void {
    const ui = UI_RECIPES[id]
    if (ui) {
      sfxEngine.play(ui)
    }
  }

  setEnvironment(stageId: string): void {
    envStage = stageId
    lastEnv = 0
  }

  tickEnvironment(): void {
    const now = performance.now()
    if (now - lastEnv < 1400) {
      return
    }
    lastEnv = now
    sfxEngine.play(envOf(envStage), { volume: 0.55 })
  }

  cue(fighter: Fighter, kind: AudioCue): void {
    const x = fighter.x
    const id = fighter.def.id
    if (kind === 'dash' || kind === 'airdash') {
      sfxEngine.play(movementDash(id, kind === 'airdash' || !fighter.grounded), { x })
      return
    }
    if (kind === 'jump') {
      sfxEngine.play(movementJump(id), { x })
      return
    }
    if (kind === 'land') {
      sfxEngine.play(movementLand(id), { x })
      return
    }
    if (kind === 'guard_start') {
      sfxEngine.playPick('guard', { x, volume: 0.6 })
      return
    }
    if (kind === 'interrupt') {
      sfxEngine.play(COMMON_INTERRUPT, { x })
      return
    }
    if (kind === 'ko') {
      this.ko(fighter)
      return
    }
    if (kind === 'footstep') {
      this.footstep(fighter)
      return
    }
    if (kind === 'attack' || kind === 'skill' || kind === 'ultimate') {
      this.attackStart(fighter)
    }
  }

  attackStart(fighter: Fighter): void {
    const attack = fighter.attack?.data ?? fighter.lastUsedAttack
    if (!attack) {
      return
    }
    const slot = slotOf(fighter, attack)
    const skill = skillDef(fighter.def.id, slot, attack)
    const x = fighter.x
    if (skill) {
      sfxEngine.play(skill.activate, { x })
      if (skill.charge && attack.startup >= 10) {
        sfxEngine.play(skill.charge, { x })
      }
      const ctx = audio.context
      if (ctx && skill.release) {
        sfxEngine.play(skill.release, { x, when: ctx.currentTime + attack.startup / 60 })
      }
      return
    }
    sfxEngine.play(swingOf(fighter.def.id, attack.damage >= 70), { x })
  }

  impact(ctx: CombatSfxContext): void {
    const x = ctx.x
    if (ctx.perfect) {
      sfxEngine.play(COMMON_PERFECT, { x })
      return
    }
    if (ctx.blocked) {
      sfxEngine.playPick('guard', { x })
      sfxEngine.play(characterHitLayer(ctx.fighterId, ctx.power * 0.3), { x, volume: 0.45 })
      return
    }
    if (ctx.counter) {
      if (ctx.fighterId === 'hinata' || ctx.fighterId === 'hakurou') {
        sfxEngine.playPick('parry', { x })
      } else {
        sfxEngine.playPick('counter', { x })
      }
    }
    const skill = skillDef(ctx.fighterId, ctx.slot)
    if (skill) {
      sfxEngine.play(skill.impact, { x, pitch: ctx.airborne ? 1.08 : ctx.grounded ? 1 : 1.03 })
      if (skill.secondary) {
        sfxEngine.play(skill.secondary, { x })
      }
      if (skill.aftermath && (ctx.slot === 3 || ctx.slot === 4 || ctx.killing)) {
        sfxEngine.play(skill.aftermath, { x })
      }
    }
    if (ctx.killing) {
      sfxEngine.play(COMMON_KO, { x, volume: 0.7 })
    }
    if (ctx.combo >= 6 || ctx.power >= 200) {
      sfxEngine.playPick('hit-critical', { x })
    } else if (ctx.power >= 110) {
      sfxEngine.playPick('hit-heavy', { x })
    } else if (ctx.power >= 50) {
      sfxEngine.playPick('hit-medium', { x })
    } else {
      sfxEngine.playPick('hit-light', { x })
    }
    const comboPitch = 1 + Math.min(ctx.combo, 10) * 0.012
    sfxEngine.play(characterHitLayer(ctx.fighterId, ctx.power), { x, pitch: comboPitch, volume: ctx.airborne ? 0.85 : 1 })
  }

  clash(power: number, ultimate: boolean, x: number): void {
    if (ultimate || power >= 280) {
      sfxEngine.play(COMMON_CLASH.ultimate, { x })
    } else if (power >= 180) {
      sfxEngine.play(COMMON_CLASH.massive, { x })
    } else if (power >= 120) {
      sfxEngine.play(COMMON_CLASH.heavy, { x })
    } else if (power >= 70) {
      sfxEngine.play(COMMON_CLASH.medium, { x })
    } else {
      sfxEngine.play(COMMON_CLASH.small, { x })
    }
  }

  parry(x: number): void {
    sfxEngine.playPick('parry', { x })
  }

  switch(kind: 'normal' | 'fast' | 'combo' | 'attack' | 'ko' | 'assist' | 'entry', x: number): void {
    sfxEngine.play(COMMON_SWITCH[kind], { x })
  }

  ko(fighter: Fighter): void {
    sfxEngine.play(profileFor(fighter.def.id).ko, { x: fighter.x })
  }

  transform(fighter: Fighter): void {
    sfxEngine.play(profileFor(fighter.def.id).transform, { x: fighter.x })
  }

  projectileTravel(shot: Projectile): void {
    const owner = shot.owner
    const attack = shot.attack
    if (!owner || !attack) {
      return
    }
    const slot = slotOf(owner, attack)
    const skill = skillDef(owner.def.id, slot, attack)
    if (skill?.travel) {
      sfxEngine.play(skill.travel, { x: shot.x, volume: 0.55 })
    }
  }

  footstep(fighter: Fighter): void {
    const run = fighter.state === FighterState.RUN
    const walk = fighter.state === FighterState.WALK
    if (!walk && !run) {
      return
    }
    const key = `${fighter.side}`
    const now = performance.now()
    const wait = run ? 170 : 260
    if (now - (lastStep.get(key) ?? 0) < wait) {
      return
    }
    lastStep.set(key, now)
    sfxEngine.play(movementStep(fighter.def.id, run), { x: fighter.x, volume: 0.55 })
  }

  victory(): void {
    sfxEngine.play(UI_RECIPES.victory!)
  }

  defeat(): void {
    sfxEngine.play(UI_RECIPES.defeat!)
  }
}

export const combatSfx = new CombatSfx()
