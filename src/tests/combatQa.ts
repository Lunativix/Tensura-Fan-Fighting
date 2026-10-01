import { CHARACTERS } from '../config/characters.ts'
import { kitFor } from '../config/skills.ts'
import { computeHit } from '../combat/DamageSystem.ts'
import { AbsorptionBank } from '../powers/AbsorptionBank.ts'
import { createTransform, startTransform, tickTransform } from '../powers/TransformSystem.ts'
import { FighterId, type FighterIdValue } from '../types/game.ts'
import type { CheckResult } from './foundationChecks.ts'
import { styleFor } from '../vfx/CombatStyle.ts'
import { impactFeel } from '../vfx/ImpactCatalog.ts'
import { profileFor } from '../audio/profiles/CharacterAudio.ts'
import { motionOf } from '../combat/feel/MotionProfile.ts'
import { attackPhase, enteredPhase } from '../combat/feel/FrameEvents.ts'
import { isFinisherHit, finisherTheme } from '../combat/feel/FinisherDirector.ts'
import { canInterrupt } from '../combat/feel/AnimationStateMachine.ts'
import { AnimationVariationManager } from '../combat/feel/AnimationVariationManager.ts'
import { ARENA_LEFT, ARENA_RIGHT, distanceToArenaEdge } from '../combat/ArenaBounds.ts'
import { AttackKind } from '../combat/Attack.ts'
import { hitboxOverlaps } from '../combat/Hitbox.ts'
import { resolveRangedPlan, resolveRangedShape } from '../combat/ranged.ts'
import { allSkillAnimDefs, normalsOf, skillAnimOf, allOwnNormalSlots } from '../combat/anim/registry.ts'
import { resolveSkillAnim, isGenericCombatClip } from '../combat/anim/resolveSkillAnim.ts'
import { formatMissingSkillAnim } from '../combat/anim/missingLog.ts'
import { pngExistsFor } from '../combat/anim/audit.ts'
import { attackOf, deriveArtStatus, skillSlotOf } from '../combat/anim/pipeline.ts'
import { skillArtBriefs, normalArtBriefs, ultimateArtBriefs, formArtBriefs, artProgressCounts } from '../combat/anim/contracts.ts'
import { versusAnimForm, clipKeysFor, isCinematicOnlyForm } from '../combat/anim/forms.ts'
import { keepArtistPixels } from '../combat/anim/artistPixels.ts'
import { sortFrameFiles, missingFrameGaps } from '../combat/anim/frameFiles.ts'
import { parseAnimJson } from '../combat/anim/animMeta.ts'
import { ultimateIsConfirmed } from '../combat/ultimates/confirmation.ts'
import { formatSkillTimeline } from '../combat/anim/timeline.ts'
import { SKILL_SLOT_FOLDERS, NORMAL_SLOT_FOLDERS } from '../combat/anim/skillSlotIndex.ts'
import { SPRITE_CLIP_INDEX } from '../sprites/spriteClipIndex.ts'
import { session } from '../game/GameState.ts'

function assert(ok: boolean, message: string, result: CheckResult): void {
  if (ok) {
    result.passed += 1
  } else {
    result.failed.push(message)
  }
}

export function runCombatQa(result: CheckResult): void {
  const ids = Object.keys(CHARACTERS) as FighterIdValue[]
  for (const id of ids) {
    const kit = kitFor(id)
    assert(kit.lights.length === 3, `${id} lights`, result)
    assert(kit.skills.length === 4, `${id} skills`, result)
    assert(Number.isFinite(kit.ultimate.damage), `${id} ult finite`, result)
    assert(kit.ultimate.damage >= 0, `${id} ult damage`, result)
    const style = styleFor(id)
    assert(Boolean(style.energyType && style.trailType && style.auraType), `${id} combat style`, result)
    assert(style.glow > 0, `${id} glow`, result)
    for (const skill of kit.skills) {
      assert(skill.id.length > 0 && skill.name.length > 0, `${id} skill named`, result)
      assert(Number.isFinite(skill.damage) && Number.isFinite(skill.energyCost), `${id} skill numbers`, result)
    }
    const audio = profileFor(id)
    assert(audio.skills.length === 4, `${id} audio skills`, result)
    assert(audio.ultimate.release.id.includes('Ultimate'), `${id} ult sfx named`, result)
    const names = audio.skills.map((skill) => skill.release.id)
    assert(new Set(names).size === 4, `${id} 4 distinct skill releases`, result)
  }
  const sample = kitFor(FighterId.rimuru).lights[0]
  const hit = computeHit(1000, sample, {
    guarding: false, perfectGuard: false, armor: false, defense: 10, comboHits: 2, attackMul: 1.2,
  })
  assert(hit.dealt > 0 && Number.isFinite(hit.dealt), 'scaled hit', result)
  const bank = new AbsorptionBank()
  bank.absorb(sample)
  assert(bank.stored?.id.startsWith('absorbed-') === true, 'absorb store', result)
  const form = createTransform()
  startTransform(form, 100, 1.5, 1.2)
  tickTransform(form, 50)
  assert(form.active, 'transform active', result)
  tickTransform(form, 60)
  assert(!form.active, 'transform end', result)
  const ultFeel = impactFeel(320, true, false, false)
  assert(ultFeel.tier === 'extreme' && ultFeel.hitStop >= 80 && ultFeel.zoom > 0, 'ultimate impact feel', result)
  const lightFeel = impactFeel(28, false, false, false)
  assert(lightFeel.tier === 'light' && lightFeel.hitStop >= 6 && lightFeel.hitStop <= 12, 'light impact short freeze', result)
  for (const id of ids) {
    const motion = motionOf(id)
    assert(Boolean(motion.weight) && motion.dashGhosts >= 0, `${id} motion profile`, result)
  }
  assert(attackPhase({ data: sample, frame: 0, connected: false }) === 'startup', 'attack startup phase', result)
  assert(attackPhase({ data: sample, frame: sample.startup + 1, connected: false }) === 'active', 'attack active phase', result)
  assert(attackPhase({ data: sample, frame: sample.startup + sample.active + 1, connected: false }) === 'recovery', 'attack recovery phase', result)
  assert(enteredPhase(-1, { data: sample, frame: 0, connected: false }, 'startup'), 'enter startup', result)
  assert(enteredPhase(sample.startup - 1, { data: sample, frame: sample.startup, connected: false }, 'active'), 'enter active', result)
  assert(isFinisherHit({ kind: 'ULTIMATE', power: 300, killing: true, attackerId: 'rimuru' }, 0.1), 'finisher ult kill', result)
  assert(!isFinisherHit({ kind: 'MELEE', power: 40, killing: true, attackerId: 'rimuru' }, 0.05), 'no finisher on light', result)
  assert(finisherTheme('hakurou', 'rimuru') === 'moon-fang', 'hakurou finisher theme', result)
  assert(finisherTheme('rimuru', 'veldora') === 'beelzebuth-storm', 'cave pair finisher', result)
  assert(canInterrupt('IDLE', 'ATTACK'), 'attack interrupts idle', result)
  assert(!canInterrupt('ULTIMATE', 'WALK'), 'walk cannot interrupt ult', result)
  assert(AnimationVariationManager.idle('rimuru', 0) === 0, 'idle variant start', result)
  assert(AnimationVariationManager.intro('rimuru', 'diablo', 'interaction_rimuru_diablo') === 'interaction_rimuru_diablo', 'contextual intro', result)
  assert(AnimationVariationManager.intro('rimuru', 'shion', null) === 'battle_intro', 'generic intro', result)

  const blade = kitFor(FighterId.rimuru).skills[0]
  const bolt = kitFor(FighterId.rimuru).skills[1]
  assert(blade.kind === AttackKind.PROJECTILE && blade.reachesArenaEdge === true, 'water blade is ranged to edge', result)
  assert(bolt.kind === AttackKind.BEAM && (bolt.continuesThroughTarget || (bolt.piercing ?? 0) > 1), 'black lightning pierces', result)
  const near = resolveRangedPlan(blade, 420, 700, 1, 500)
  const mid = resolveRangedPlan(blade, 420, 700, 1, 960)
  const far = resolveRangedPlan(blade, 420, 700, 1, 1700)
  const miss = resolveRangedPlan(blade, 420, 700, 1)
  const left = resolveRangedPlan(blade, 1500, 700, -1, 400)
  assert(near.endX === ARENA_RIGHT && mid.endX === ARENA_RIGHT && far.endX === ARENA_RIGHT, 'slash reaches right wall', result)
  assert(miss.endX === ARENA_RIGHT && miss.length >= distanceToArenaEdge(miss.startX, 1) - 1, 'miss still reaches edge', result)
  assert(left.endX === ARENA_LEFT && left.facing < 0, 'facing left aims at left wall', result)
  const beam = resolveRangedPlan(bolt, 360, 700, 1, 900)
  assert(beam.shape === 'beam' && beam.length > 800 && beam.continuesThroughTarget, 'beam spans toward edge through target', result)
  const stop = resolveRangedPlan({ ...bolt, piercing: 1, continuesThroughTarget: false }, 360, 700, 1, 900)
  assert(stop.endX === 900, 'non-piercing beam can stop on target', result)
  const boxA = { x: beam.startX, y: beam.startY - 20, width: beam.length, height: 40 }
  const foeNear = { x: 500, y: 680, width: 64, height: 132 }
  const foeFar = { x: 1600, y: 680, width: 64, height: 132 }
  const foeTwo = { x: 1100, y: 680, width: 64, height: 132 }
  assert(hitboxOverlaps(boxA, foeNear) && hitboxOverlaps(boxA, foeFar) && hitboxOverlaps(boxA, foeTwo), 'beam hitbox covers near mid and far', result)
  assert(resolveRangedShape(bolt) === 'beam', 'lightning shape is beam', result)
  assert(resolveRangedShape(blade) === 'slashProjectile', 'water blade shape is slash', result)

  for (const id of ids) {
    const kit = kitFor(id)
    const traveling = kit.skills.filter((skill) => skill.kind === AttackKind.PROJECTILE || skill.kind === AttackKind.BEAM)
    assert(traveling.length > 0, `${id} has a traveling skill`, result)
    const first = traveling[0]!
    const right = resolveRangedPlan(first, 420, 700, 1, undefined, 'sprite')
    const leftAim = resolveRangedPlan(first, 1500, 700, -1, undefined, 'sprite')
    assert(right.endX === ARENA_RIGHT, `${id} ${first.id} reaches right wall`, result)
    assert(leftAim.endX === ARENA_LEFT && leftAim.facing < 0, `${id} ${first.id} reaches left wall`, result)
    if (first.castPointY === undefined) {
      assert(right.startY <= 640, `${id} ${first.id} casts above the feet`, result)
    }
  }
  const wallCast = resolveRangedPlan(blade, 1800, 700, 1, undefined, 'slime')
  assert(wallCast.startX < ARENA_RIGHT && wallCast.startX > ARENA_LEFT, 'spawn stays inside arena', result)
  assert(wallCast.endX === ARENA_RIGHT, 'edge spawn still aims at right wall', result)

  assert(allSkillAnimDefs().length === ids.length * 5, 'every fighter has 5 skill anim ids', result)
  assert(allSkillAnimDefs().length === 55, '55 skill defs', result)
  assert(SKILL_SLOT_FOLDERS.length === 55, '55 skill folders indexed', result)
  assert(SKILL_SLOT_FOLDERS.every((slot) => slot.hasAnimJson), '55 anim.json present', result)
  assert(NORMAL_SLOT_FOLDERS.length === ids.length * 8, 'normal slots per fighter', result)
  assert(allOwnNormalSlots().length === ids.length * 8, 'own normal ids', result)
  for (const def of allSkillAnimDefs()) {
    const mapped = SKILL_SLOT_FOLDERS.find((slot) => slot.animId === def.animId && slot.fighterId === def.fighterId)
    assert(Boolean(mapped), `${def.animId} folder recorded`, result)
    const slot = skillSlotOf(def.fighterId, def.attackId)
    const attack = attackOf(def.fighterId, def.attackId)
    assert(Boolean(slot && attack), `${def.fighterId} ${def.attackId} slot`, result)
    if (slot && attack) {
      assert(slot.timing.releaseFrame === attack.startup, `${def.animId} release = startup`, result)
      assert(slot.projectileInSprite === false, `${def.animId} projectile not in sprite`, result)
      const hasPng = pngExistsFor(def.fighterId, versusAnimForm(def.fighterId), def.animId)
      const status = deriveArtStatus(hasPng)
      assert(status === 'ready-for-art' || status === 'art-complete', `${def.animId} art status`, result)
      assert((status as string) !== 'done', `${def.animId} never auto done`, result)
      if (!hasPng) {
        assert(status === 'ready-for-art', `${def.animId} ready for art without png`, result)
      } else if (def.animId === 'rimuru_water_blade' || def.animId === 'rimuru_black_lightning' || def.animId === 'rimuru_predator') {
        assert(status === 'art-complete', `${def.animId} art complete not done`, result)
      }
    }
  }
  assert(deriveArtStatus(false) === 'ready-for-art', 'no png is ready-for-art', result)
  assert(deriveArtStatus(true) === 'art-complete', 'png sequence is art-complete', result)
  assert((deriveArtStatus(true) as string) !== 'done', 'art-complete is never done', result)
  for (const id of ids) {
    const kit = kitFor(id)
    const attacks = [...kit.skills, kit.ultimate]
    for (const attack of attacks) {
      const mapped = skillAnimOf(id, attack.id)
      assert(Boolean(mapped), `${id} ${attack.id} has anim id`, result)
      const resolved = resolveSkillAnim(id, 'default', attack, () => false)
      assert(Boolean(resolved), `${id} ${attack.id} resolves`, result)
      assert(resolved ? !isGenericCombatClip(resolved.animId) : false, `${id} ${attack.id} not generic clip name`, result)
      assert(resolved?.clipKey !== 'skill' && resolved?.clipKey !== 'attack', `${id} ${attack.id} never skill/attack`, result)
      assert(resolved?.executionFrame === attack.startup, `${id} ${attack.id} execution = startup`, result)
      assert(resolved?.timing.releaseFrame === attack.startup, `${id} ${attack.id} releaseFrame = startup`, result)
      assert(resolved?.clipKey === null, `${id} ${attack.id} no png clip`, result)
      assert(resolved?.artStatus === 'ready-for-art', `${id} ${attack.id} ready for art`, result)
      assert((resolved?.artStatus as string) !== 'done', `${id} ${attack.id} never done`, result)
    }
    const normals = normalsOf(id)
    if (id === 'rimuru' || id === 'milim') {
      assert(normals.source === 'own', `${id} owns normals`, result)
    } else {
      assert(normals.source === 'fallback-rimuru' || normals.source === 'fallback-milim', `${id} normals fallback tagged`, result)
    }
  }
  const png = resolveSkillAnim(FighterId.rimuru, 'rimuru-shizu', blade, (_id, key) => key === 'rimuru-shizu__rimuru_water_blade')
  assert(png?.source === 'png' && png.clipKey === 'rimuru-shizu__rimuru_water_blade' && png.animId === 'rimuru_water_blade', 'png clip wins', result)
  assert(png?.artStatus === 'art-complete', 'png resolve is art-complete not done', result)
  assert((png?.artStatus as string) !== 'done', 'png resolve never done', result)
  assert(png?.durationFrames === 28, 'water blade duration matches 8+6+14', result)
  assert(png?.executionFrame === 8, 'water blade spawn is release frame', result)
  assert(png?.timing.releaseFrame === 8, 'water blade releaseFrame', result)
  assert(Boolean(png?.events.some((event) => event.kind === 'camera' && event.frame === 8 && event.camera === 'light')), 'water blade release camera', result)
  assert(blade.vfx === 'water_flash', 'water blade uses water flash not slash trail', result)
  assert(blade.startup === 8 && blade.active === 6 && blade.recovery === 14, 'water blade original timings', result)
  const slimeResolve = resolveSkillAnim(FighterId.rimuru, 'rimuru-slime', blade, () => true)
  assert(slimeResolve?.clipKey === null && slimeResolve.source === 'missing', 'slime form has no combat clip', result)
  assert(isCinematicOnlyForm('rimuru-slime'), 'slime is cinematic-only', result)
  assert(clipKeysFor('rimuru-slime', 'rimuru_water_blade').length === 0, 'slime combat clip keys are empty', result)
  const ownBlade = SPRITE_CLIP_INDEX.rimuru?.['rimuru-shizu__rimuru_water_blade'] ?? []
  assert(ownBlade.length === 28, 'roster water blade has 28 png frames', result)
  assert((SPRITE_CLIP_INDEX.rimuru?.rimuru_water_blade ?? []).length === 0, 'human water blade is not the slime fallback', result)
  const blPng = resolveSkillAnim(FighterId.rimuru, 'rimuru-shizu', bolt, (_id, key) => key === 'rimuru-shizu__rimuru_black_lightning')
  assert(blPng?.source === 'png' && blPng.clipKey === 'rimuru-shizu__rimuru_black_lightning', 'black lightning png clip', result)
  assert(blPng?.durationFrames === 32, 'black lightning duration matches 10+4+18', result)
  assert(blPng?.executionFrame === 10 && blPng?.timing.releaseFrame === 10, 'black lightning spawn is release frame', result)
  assert(bolt.startup === 10 && bolt.active === 4 && bolt.recovery === 18, 'black lightning original timings', result)
  const ownBolt = SPRITE_CLIP_INDEX.rimuru?.['rimuru-shizu__rimuru_black_lightning'] ?? []
  assert(ownBolt.length === 32, 'roster black lightning has 32 png frames', result)
  assert((SPRITE_CLIP_INDEX.rimuru?.rimuru_black_lightning ?? []).length === 0, 'black lightning is not the slime fallback', result)
  const predator = kitFor(FighterId.rimuru).skills[2]
  const predPng = resolveSkillAnim(FighterId.rimuru, 'rimuru-shizu', predator, (_id, key) => key === 'rimuru-shizu__rimuru_predator')
  assert(predPng?.source === 'png' && predPng.clipKey === 'rimuru-shizu__rimuru_predator', 'predator png clip', result)
  assert(predPng?.durationFrames === 36, 'predator duration matches 10+6+20', result)
  assert(predPng?.executionFrame === 10 && predPng?.timing.releaseFrame === 10, 'predator contact is release frame', result)
  assert(predator.startup === 10 && predator.active === 6 && predator.recovery === 20, 'predator original timings', result)
  const ownPredator = SPRITE_CLIP_INDEX.rimuru?.['rimuru-shizu__rimuru_predator'] ?? []
  assert(ownPredator.length === 36, 'roster predator has 36 png frames', result)
  assert((SPRITE_CLIP_INDEX.rimuru?.rimuru_predator ?? []).length === 0, 'predator is not the slime fallback', result)
  assert(clipKeysFor('rimuru-demon-lord', 'rimuru_water_blade').includes('rimuru-shizu__rimuru_water_blade'), 'demon-lord aliases shizu sheets', result)
  assert(!clipKeysFor('rimuru-slime', 'rimuru_water_blade').includes('rimuru-shizu__rimuru_water_blade'), 'slime does not use shizu sheets', result)
  const missingAnim = {
    fighterId: FighterId.rimuru,
    characterName: 'Rimuru',
    form: 'rimuru-slime',
    attackId: 'water-blade',
    skillName: 'Water Blade',
    animId: 'rimuru_water_blade',
    slot: 0 as const,
    clipKey: null,
    source: 'missing' as const,
    artStatus: 'ready-for-art' as const,
    timing: png!.timing,
    executionFrame: 8,
    durationFrames: 28,
    events: [],
  }
  const missText = formatMissingSkillAnim(missingAnim)
  assert(missText.includes('[MISSING SKILL ANIMATION]'), 'missing header', result)
  assert(missText.includes('Character: Rimuru'), 'missing character', result)
  assert(missText.includes('Form: rimuru-slime'), 'missing form', result)
  assert(missText.includes('Skill: Water Blade'), 'missing skill name', result)
  assert(missText.includes('Anim: rimuru_water_blade'), 'missing anim id', result)

  const sorted = sortFrameFiles(['010.png', 'frame_002.png', '001.png'])
  assert(sorted.map((item) => item.index).join(',') === '1,2,10', 'numeric frame sort', result)
  assert(missingFrameGaps(sortFrameFiles(['001.png', '003.png'])).includes(2), 'gap detects 002', result)
  const sheetMeta = parseAnimJson({ type: 'spritesheet' })
  assert(sheetMeta.issues.some((item) => item.code === 'INVALID_SHEET_SIZE'), 'sheet requires size', result)
  const inSprite = parseAnimJson({ projectileInSprite: true })
  assert(inSprite.issues.some((item) => item.code === 'PROJECTILE_IN_SPRITE'), 'projectile stays in engine', result)
  assert(deriveArtStatus(false, true) === 'art-invalid', 'invalid sequence', result)
  assert(skillArtBriefs().length === 55, '55 skill briefs', result)
  assert(normalArtBriefs().length === 88, '88 normal briefs', result)
  assert(ultimateArtBriefs().length === 11, '11 ultimate briefs', result)
  assert(formArtBriefs().length >= 11, 'form briefs cover roster', result)
  assert(keepArtistPixels('rimuru_water_blade') && keepArtistPixels('rimuru-slime__rimuru_water_blade'), 'skill png kept as authored', result)
  assert(keepArtistPixels('rimuru_light_1') && !keepArtistPixels('idle'), 'own normals kept, idle still punchable', result)
  const wbBrief = skillArtBriefs().find((item) => item.id === 'rimuru_water_blade')
  assert(wbBrief?.releaseFrame === 8 && wbBrief.projectile === true, 'water blade brief', result)
  const progress = artProgressCounts()
  assert(progress.skillsComplete === 3, 'water blade, black lightning and predator are completed skill art', result)
  assert(progress.skillsTotal === 55 && progress.normalsTotal === 88 && progress.ultimatesTotal === 11, 'roster counts', result)
  const ult = kitFor(FighterId.rimuru).ultimate
  assert(!ultimateIsConfirmed({ data: ult, frame: 0, connected: false }), 'ult interruptible before confirm', result)
  assert(ultimateIsConfirmed({ data: ult, frame: ult.startup, connected: false }), 'ult confirmed at startup', result)
  const line = formatSkillTimeline(png!.timing, { projectile: true })
  assert(line.includes('RELEASE 8') && line.includes('PROJECTILE@8'), 'timeline marks release', result)
  assert(session.playerTeam.length === 3 && session.cpuTeam.length === 3, '3v3 benches', result)
}
