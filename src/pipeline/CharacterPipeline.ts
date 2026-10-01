import type { FighterIdValue } from '../types/game.ts'
import { FighterId } from '../types/game.ts'
import { saveManager } from '../save/SaveManager.ts'

export const COMBAT_ANIMS = [
  'Idle', 'Walk', 'Run', 'Dash', 'Jump', 'Fall',
  'LightAttack', 'MediumAttack', 'HeavyAttack',
  'Skill1', 'Skill2', 'Skill3', 'Skill4',
  'Hit', 'Block', 'Knockdown', 'GetUp', 'Transform', 'Ultimate', 'Victory', 'Defeat',
] as const

export interface MeshyManifest {
  fighterId: string
  source: 'placeholder' | 'meshy' | 'external'
  format: 'glb' | 'gltf'
  lod: { lod0?: string, lod1: string, lod2?: string, lod3?: string }
  scale: number
  yOffset: number
  facing: number
  skeleton: string
  materials: readonly string[]
  animations: Record<string, string>
}

export const SKELETON_BONES = [
  'Root', 'Spine', 'Chest', 'Neck', 'Head',
  'Arm_L', 'Arm_R', 'Leg_L', 'Leg_R',
] as const

export const PIPELINE_STEPS = [
  'CONCEPT',
  'GENERATION',
  'CLEANUP',
  'RETOPOLOGY',
  'UV',
  'TEXTURES',
  'RIG',
  'WEIGHTS',
  'ANIMATIONS',
  'LOD',
  'EXPORT',
  'WEB',
  'QA',
] as const

export function modelBasePath(id: FighterIdValue): string {
  return `./models/${id}`
}

export function lodFile(manifest: MeshyManifest): string {
  const quality = saveManager.load().settings.quality
  if (quality === 'low') {
    return manifest.lod.lod2 ?? manifest.lod.lod1
  }
  if (quality === 'high') {
    return manifest.lod.lod0 ?? manifest.lod.lod1
  }
  return manifest.lod.lod1
}

export function glbUrl(id: FighterIdValue, file: string): string {
  return `${modelBasePath(id)}/${file}`
}

export interface CharacterAssets {
  fighterId: string
  format: 'glb' | 'gltf' | 'placeholder' | 'sprite2d'
  model?: string
  skeleton?: string
  animations: readonly string[]
  lod: readonly string[]
}

export function placeholderAssets(fighterId: string): CharacterAssets {
  return {
    fighterId,
    format: 'sprite2d',
    animations: COMBAT_ANIMS,
    lod: ['sprite'],
  }
}

export async function loadManifest(id: FighterIdValue): Promise<MeshyManifest | null> {
  try {
    const res = await fetch(`${modelBasePath(id)}/manifest.json`)
    if (!res.ok) {
      return null
    }
    return res.json() as Promise<MeshyManifest>
  } catch {
    return null
  }
}

export async function preloadRosterGlbs(): Promise<number> {
  const ids = Object.values(FighterId)
  let ok = 0
  await Promise.all(ids.map(async (id) => {
    const manifest = await loadManifest(id)
    if (!manifest) {
      return
    }
    const url = glbUrl(id, lodFile(manifest))
    try {
      const res = await fetch(url)
      if (res.ok) {
        ok += 1
      }
    } catch {
      // fallback silhouette remains
    }
  }))
  return ok
}

export function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}
