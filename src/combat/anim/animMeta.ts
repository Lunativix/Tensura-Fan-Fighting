/**
 * Artist metadata for a clip folder. Gameplay timings in AttackData always win.
 * This file documents fps/anchor/sheet layout; it must not silently retune combat.
 */
export type AnimMetaType = 'sequence' | 'spritesheet'

export interface AnimJsonMeta {
  id?: string
  fighterId?: string
  form?: string
  attackId?: string
  skillName?: string
  type?: AnimMetaType
  status?: string
  projectileInSprite?: boolean
  fps?: number
  frameCount?: number
  loop?: boolean
  anchorX?: number
  anchorY?: number
  scale?: number
  facing?: number
  frameWidth?: number
  frameHeight?: number
  columns?: number
  rows?: number
  frames?: number
  sheet?: string
  /** Documented only. Runtime spawn uses AttackData.startup / SkillTiming.releaseFrame. */
  startup?: number
  releaseFrame?: number
  activeStart?: number
  activeEnd?: number
  recoveryStart?: number
  hitstop?: number
  tags?: string[]
  vfx?: Record<string, string | undefined>
  sfx?: Record<string, string | undefined>
  camera?: Record<string, string | undefined>
}

export interface AnimJsonIssue {
  code: string
  detail: string
}

export function parseAnimJson(raw: unknown): { meta: AnimJsonMeta, issues: AnimJsonIssue[] } {
  const issues: AnimJsonIssue[] = []
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { meta: {}, issues: [{ code: 'MISSING_METADATA', detail: 'anim.json is not an object' }] }
  }
  const meta = raw as AnimJsonMeta
  if (meta.type === 'spritesheet') {
    if (!Number.isFinite(meta.frameWidth) || !Number.isFinite(meta.frameHeight)) {
      issues.push({ code: 'INVALID_SHEET_SIZE', detail: 'spritesheet requires frameWidth and frameHeight' })
    }
    if (!Number.isFinite(meta.frames) && !Number.isFinite(meta.frameCount)) {
      issues.push({ code: 'INVALID_SHEET_FRAMES', detail: 'spritesheet requires frames or frameCount' })
    }
  }
  if (meta.projectileInSprite === true) {
    issues.push({ code: 'PROJECTILE_IN_SPRITE', detail: 'projectile must spawn from the engine, not the character sheet' })
  }
  return { meta, issues }
}
