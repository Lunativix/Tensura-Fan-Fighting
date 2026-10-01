import type { ElementId } from './elements.ts'

export const AttackKind = {
  MELEE: 'MELEE',
  PROJECTILE: 'PROJECTILE',
  BEAM: 'BEAM',
  AREA: 'AREA',
  BUFF: 'BUFF',
  DEBUFF: 'DEBUFF',
  DEFENSIVE: 'DEFENSIVE',
  MOBILITY: 'MOBILITY',
  COUNTER: 'COUNTER',
  TRANSFORMATION: 'TRANSFORMATION',
  DASH: 'DASH',
  ULTIMATE: 'ULTIMATE',
} as const

export type AttackKindId = (typeof AttackKind)[keyof typeof AttackKind]

export interface AttackData {
  id: string
  name: string
  kind: AttackKindId
  damage: number
  knockback: number
  knockbackY: number
  stun: number
  hitstun: number
  energyGain: number
  energyCost: number
  startup: number
  active: number
  recovery: number
  hitWidth: number
  hitHeight: number
  hitOffsetX: number
  hitOffsetY: number
  projectileSpeed?: number
  projectileLife?: number
  /** When true (default for PROJECTILE/BEAM), travel to the matching arena wall. */
  reachesArenaEdge?: boolean
  /** Hard cap in px. Ignored when reachesArenaEdge is true. */
  maxDistance?: number
  /** Spawn offset from the fighter origin, in facing space. */
  castPointX?: number
  castPointY?: number
  beamWidth?: number
  instant?: boolean
  continuesThroughTarget?: boolean
  rangedShape?: 'projectile' | 'beam' | 'energyBall' | 'wave' | 'slashProjectile' | 'magicProjectile' | 'piercingProjectile' | 'homingProjectile' | 'groundProjectile'
  homingStrength?: number
  maxTurnRate?: number
  aim?: 'facing' | 'target'
  invuln?: boolean
  unguardable?: boolean
  grantEnergyOnHit?: number
  launcher?: boolean
  knockdown?: boolean
  armor?: boolean
  piercing?: number
  tracking?: number
  maxHits?: number
  element?: ElementId
  vfx?: string
  sfx?: string
  absorbOnHit?: boolean
  applyBuff?: 'attack' | 'defense' | 'speed'
}

export interface AttackInstance {
  data: AttackData
  frame: number
  connected: boolean
}
