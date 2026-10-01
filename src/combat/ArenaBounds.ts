import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../engine/Time.ts'

export const ARENA_LEFT = 110
export const ARENA_RIGHT = 1810
export const ARENA_TOP = 72
export const ARENA_BOTTOM = 900

export interface ArenaBounds {
  left: number
  right: number
  top: number
  bottom: number
  width: number
  height: number
}

export function arenaBounds(): ArenaBounds {
  return {
    left: ARENA_LEFT,
    right: ARENA_RIGHT,
    top: ARENA_TOP,
    bottom: ARENA_BOTTOM,
    width: ARENA_RIGHT - ARENA_LEFT,
    height: ARENA_BOTTOM - ARENA_TOP,
  }
}

export function arenaEdgeX(facing: number): number {
  return facing >= 0 ? ARENA_RIGHT : ARENA_LEFT
}

/** Distance from a cast point to the matching arena wall. */
export function distanceToArenaEdge(originX: number, facing: number): number {
  const edge = arenaEdgeX(facing)
  return Math.max(0, facing >= 0 ? edge - originX : originX - edge)
}

export function clampToArenaX(x: number): number {
  return Math.max(ARENA_LEFT, Math.min(ARENA_RIGHT, x))
}

export function pointPastArena(x: number, y: number): 'left' | 'right' | 'top' | 'bottom' | null {
  if (x <= ARENA_LEFT) {
    return 'left'
  }
  if (x >= ARENA_RIGHT) {
    return 'right'
  }
  if (y <= ARENA_TOP) {
    return 'top'
  }
  if (y >= ARENA_BOTTOM + 24) {
    return 'bottom'
  }
  return null
}

export function logicalArena(): { width: number, height: number } {
  return { width: LOGICAL_WIDTH, height: LOGICAL_HEIGHT }
}
