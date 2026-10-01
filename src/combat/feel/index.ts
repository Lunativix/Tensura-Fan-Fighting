/**
 * Combat animation layers — extend CombatSpectacle / HitStop / ImpactCatalog.
 *
 * New fighter feel:
 *   1. MotionProfile (afterimage, weight, idle)
 *   2. CombatStyle (energy/trail/aura colors)
 *   3. kitFor() skills (canon techniques only)
 *   4. Optional AttackData.vfx / sfx consumed on active frames
 *
 * Finishers fire on Ultimate + low HP / KO. Themes are story pairs only.
 * Transformations: Diablo Demon Form, Guy True Dragon Lord (kits) + story `transform` beats.
 */
export { motionOf, idleVariant, ANIM_PRIORITY, type MotionProfile } from './MotionProfile.ts'
export { attackPhase, enteredPhase, type AttackPhase } from './FrameEvents.ts'
export { isFinisherHit, finisherTheme } from './FinisherDirector.ts'
export { playTransformFeel } from './TransformFeel.ts'
export { CameraImpactManager, type CameraImpactLevel } from './CameraImpact.ts'
export { clipForState, animLayer, canInterrupt } from './AnimationStateMachine.ts'
export { AnimationVariationManager } from './AnimationVariationManager.ts'
export { consumeBossPhase2 } from './BossPhaseManager.ts'
export { attackVfxId } from './signatureVfx.ts'
