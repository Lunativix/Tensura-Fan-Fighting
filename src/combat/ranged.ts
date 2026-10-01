import { AttackKind, type AttackData } from './Attack.ts'
import { ARENA_BOTTOM, ARENA_LEFT, ARENA_RIGHT, ARENA_TOP, arenaEdgeX, clampToArenaX, distanceToArenaEdge } from './ArenaBounds.ts'

export type RangedCasterBody = 'sprite' | 'slime'

const CAST_SLIME = { x: 56, y: -16 }
const CAST_SPRITE = { x: 92, y: -78 }
const SPAWN_INSET = 12

export const RangedShape = {
  Projectile: 'projectile',
  Beam: 'beam',
  EnergyBall: 'energyBall',
  Wave: 'wave',
  SlashProjectile: 'slashProjectile',
  MagicProjectile: 'magicProjectile',
  PiercingProjectile: 'piercingProjectile',
  HomingProjectile: 'homingProjectile',
  GroundProjectile: 'groundProjectile',
} as const

export type RangedShapeId = (typeof RangedShape)[keyof typeof RangedShape]

export interface RangedPlan {
  shape: RangedShapeId
  startX: number
  startY: number
  endX: number
  endY: number
  length: number
  facing: number
  speed: number
  beamWidth: number
  hitWidth: number
  hitHeight: number
  instant: boolean
  piercing: number
  continuesThroughTarget: boolean
  reachesArenaEdge: boolean
  travelMs: number
}

export function isRangedAttack(attack: AttackData): boolean {
  return attack.kind === AttackKind.PROJECTILE || attack.kind === AttackKind.BEAM
}

export function resolveRangedShape(attack: AttackData): RangedShapeId {
  if (attack.rangedShape) {
    return attack.rangedShape
  }
  if (attack.kind === AttackKind.BEAM) {
    return RangedShape.Beam
  }
  if ((attack.tracking ?? 0) > 1 || (attack.homingStrength ?? 0) > 0) {
    return RangedShape.HomingProjectile
  }
  if ((attack.piercing ?? 1) > 1 || attack.continuesThroughTarget) {
    return RangedShape.PiercingProjectile
  }
  if (attack.vfx === 'trail') {
    return RangedShape.SlashProjectile
  }
  return RangedShape.EnergyBall
}

export function rangedCastOffsets(body: RangedCasterBody, attack: AttackData): { x: number, y: number } {
  const fallback = body === 'slime' ? CAST_SLIME : CAST_SPRITE
  return {
    x: attack.castPointX ?? fallback.x,
    y: attack.castPointY ?? fallback.y,
  }
}

export function resolveRangedPlan(
  attack: AttackData,
  casterX: number,
  casterY: number,
  facing: number,
  targetX?: number,
  body: RangedCasterBody = 'sprite',
): RangedPlan {
  const dir = facing >= 0 ? 1 : -1
  const cast = rangedCastOffsets(body, attack)
  const startX = Math.max(ARENA_LEFT + SPAWN_INSET, Math.min(ARENA_RIGHT - SPAWN_INSET, casterX + dir * cast.x))
  const startY = Math.max(ARENA_TOP + SPAWN_INSET, Math.min(ARENA_BOTTOM - SPAWN_INSET, casterY + cast.y))
  const shape = resolveRangedShape(attack)
  const beamLike = shape === RangedShape.Beam || shape === RangedShape.Wave
  const reaches = attack.reachesArenaEdge ?? true
  const pierce = Math.max(1, attack.piercing ?? (attack.continuesThroughTarget ? 8 : 1))
  const through = Boolean(attack.continuesThroughTarget || pierce > 1)
  let endX = reaches ? arenaEdgeX(dir) : startX + dir * (attack.maxDistance ?? 720)
  if (!through && typeof targetX === 'number' && beamLike) {
    const toward = dir * (targetX - startX)
    if (toward > 48) {
      endX = targetX
    }
  }
  endX = clampToArenaX(endX)
  if (dir > 0 && endX < startX) {
    endX = startX
  }
  if (dir < 0 && endX > startX) {
    endX = startX
  }
  const length = Math.max(8, Math.abs(endX - startX))
  const speed = Math.max(120, attack.projectileSpeed ?? (beamLike ? 4200 : 760))
  const instant = Boolean(attack.instant)
  const growMs = (length / Math.max(120, speed)) * 1000
  const travelMs = instant
    ? Math.max(220, (attack.active ?? 8) * (1000 / 60) + 100)
    : attack.projectileLife && attack.projectileLife > 0
      ? attack.projectileLife
      : growMs + 220
  const beamWidth = attack.beamWidth ?? (beamLike ? Math.max(28, attack.hitHeight) : attack.hitHeight)
  return {
    shape,
    startX,
    startY,
    endX,
    endY: startY,
    length,
    facing: dir,
    speed,
    beamWidth,
    hitWidth: attack.hitWidth,
    hitHeight: attack.hitHeight,
    instant,
    piercing: pierce,
    continuesThroughTarget: through,
    reachesArenaEdge: reaches || length >= distanceToArenaEdge(startX, dir) - 4,
    travelMs,
  }
}

export function areaSpanToEdge(
  casterX: number,
  facing: number,
  offsetX: number,
  fallbackWidth: number,
  reachesEdge: boolean,
): { offsetX: number, width: number } {
  if (!reachesEdge) {
    return { offsetX, width: fallbackWidth }
  }
  const dir = facing >= 0 ? 1 : -1
  const start = casterX + dir * offsetX
  const edge = arenaEdgeX(dir)
  const width = Math.max(fallbackWidth, Math.abs(edge - start))
  return { offsetX, width }
}
