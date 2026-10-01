import type Phaser from 'phaser'
import { PLAYABLE_FIGHTERS } from '../config/characters.ts'
import {
  ACTION_FOLDERS,
  LOOPING_CLIPS,
  hasActionFrames,
  spriteAnimKey,
  spriteFolder,
  spriteFrameKey,
  spritePackKey,
  spriteSheetKey,
  type SpriteManifest,
} from './SpriteManifest.ts'
import { SPRITE_CLIP_INDEX } from './spriteClipIndex.ts'
import { SPRITE_SHEET_INDEX } from './spriteSheetIndex.ts'
import { addPunchedTexture, canvasFromPunchedImage, loadHtmlImage } from './punchBackdrop.ts'
import type { FighterIdValue } from '../types/game.ts'
import { skillAnimDefsOf, ownNormalAnimIds } from '../combat/anim/registry.ts'
import { keepArtistPixels } from '../combat/anim/artistPixels.ts'
import { formsOf } from '../combat/anim/forms.ts'

const manifests = new Map<FighterIdValue, SpriteManifest>()
const existsCache = new Map<string, Promise<boolean>>()
const MAX_FRAMES = 48
const PROBE_MS = 900
const PUNCH_BATCH = 8

export interface PunchLoadOpts {
  signal?: AbortSignal
  onProgress?: (done: number, total: number) => void
}

export function sceneHasFighterClip(scene: Phaser.Scene, id: FighterIdValue, clip: string): boolean {
  if (scene.anims.exists(spriteAnimKey(id, clip))) {
    return true
  }
  if (scene.textures.exists(spriteFrameKey(id, clip, 0))) {
    return true
  }
  return scene.textures.exists(spritePackKey(id, clip))
}

export function hasSpriteSheet(id: FighterIdValue): boolean {
  return manifests.has(id)
}

export function getSpriteManifest(id: FighterIdValue): SpriteManifest | undefined {
  return manifests.get(id)
}

function firstFrameOf(scene: Phaser.Scene, key: string): string | number {
  const tex = scene.textures.get(key)
  if (tex.has('0')) {
    return 0
  }
  if (tex.has('0')) {
    return '0'
  }
  const names = tex.getFrameNames()
  return names[0] ?? 0
}

/** First punched / packed frame already in the texture cache. Independent of the in-memory manifest map. */
export function findLoadedFighterTexture(
  scene: Phaser.Scene,
  id: FighterIdValue,
): { key: string, frame: string | number } | null {
  const man = manifests.get(id)
  const clips = ['idle', 'walk', 'attack', 'run', ...(man?.clips ? Object.keys(man.clips) : ACTION_FOLDERS)]
  const seen = new Set<string>()
  for (const clip of clips) {
    if (seen.has(clip)) {
      continue
    }
    seen.add(clip)
    const frame0 = spriteFrameKey(id, clip, 0)
    if (scene.textures.exists(frame0)) {
      return { key: frame0, frame: firstFrameOf(scene, frame0) }
    }
    const pack = spritePackKey(id, clip)
    if (scene.textures.exists(pack)) {
      return { key: pack, frame: firstFrameOf(scene, pack) }
    }
  }
  const prefix = `fighter-frame-${id}-`
  const packPrefix = `fighter-pack-${id}-`
  for (const key of scene.textures.getTextureKeys()) {
    if (key.startsWith(prefix) || key.startsWith(packPrefix)) {
      return { key, frame: firstFrameOf(scene, key) }
    }
  }
  return null
}

function gameAlive(scene: Phaser.Scene): boolean {
  return Boolean(scene.game && scene.game.isRunning)
}

async function urlExists(url: string): Promise<boolean> {
  const cached = existsCache.get(url)
  if (cached) {
    return cached
  }
  const job = probeUrl(url)
  existsCache.set(url, job)
  return job
}

async function probeUrl(url: string): Promise<boolean> {
  const ctrl = new AbortController()
  const timer = window.setTimeout(() => ctrl.abort(), PROBE_MS)
  try {
    const head = await fetch(url, { method: 'HEAD', signal: ctrl.signal })
    if (head.ok) {
      return true
    }
    if (head.status !== 405 && head.status !== 501) {
      return false
    }
    const ranged = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-0' },
      signal: ctrl.signal,
    })
    return ranged.ok || ranged.status === 206
  } catch {
    return false
  } finally {
    window.clearTimeout(timer)
  }
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function pad3(n: number): string {
  return String(n).padStart(3, '0')
}

type NameFn = (n: number) => string

async function collectSequence(folder: string, makeRel: NameFn): Promise<string[] | null> {
  if (!await urlExists(`${folder}/${makeRel(1)}`)) {
    return null
  }
  const files: string[] = []
  for (let i = 1; i <= MAX_FRAMES; i += 1) {
    const rel = makeRel(i)
    if (!await urlExists(`${folder}/${rel}`)) {
      break
    }
    files.push(rel)
  }
  return files.length > 0 ? files : null
}

async function discoverRelFolder(id: FighterIdValue, relDir: string): Promise<string[] | undefined> {
  const folder = spriteFolder(id)
  const patterns: NameFn[] = [
    (n) => `${relDir}/${pad3(n)}.png`,
    (n) => `${relDir}/frame_${pad3(n)}.png`,
    (n) => `${relDir}/frame_${pad2(n)}.png`,
    (n) => `${relDir}/${pad2(n)}.png`,
    (n) => `${relDir}/${n}.png`,
  ]
  for (const pattern of patterns) {
    const files = await collectSequence(folder, pattern)
    if (files) {
      return files
    }
  }
  return undefined
}

async function discoverClipFolder(id: FighterIdValue, clip: string): Promise<string[] | undefined> {
  return discoverRelFolder(id, clip)
}

async function discoverRegisteredSkillClips(id: FighterIdValue, clips: Record<string, string[]>): Promise<void> {
  await Promise.all(skillAnimDefsOf(id).map(async (def) => {
    if ((clips[def.animId]?.length ?? 0) === 0) {
      const files = await discoverRelFolder(id, def.animId)
      if (files && files.length > 0) {
        clips[def.animId] = files
      }
    }
    await Promise.all(formsOf(id).map(async (form) => {
      const key = `${form}__${def.animId}`
      if ((clips[key]?.length ?? 0) > 0) {
        return
      }
      const nested = await discoverRelFolder(id, `${form}/${def.animId}`)
      if (nested && nested.length > 0) {
        clips[key] = nested
      }
    }))
  }))
  await Promise.all(ownNormalAnimIds(id).map(async (animId) => {
    if ((clips[animId]?.length ?? 0) > 0) {
      return
    }
    const files = await discoverRelFolder(id, animId) ?? await discoverRelFolder(id, `normals/${animId}`)
    if (files && files.length > 0) {
      clips[animId] = files
    }
  }))
}

function clipsFromIndex(id: FighterIdValue): Record<string, string[]> {
  const packed = SPRITE_CLIP_INDEX[id]
  const clips: Record<string, string[]> = {}
  if (packed) {
    for (const [clip, files] of Object.entries(packed)) {
      if (files && files.length > 0) {
        clips[clip] = files
      }
    }
  }
  const sheets = SPRITE_SHEET_INDEX[id]
  if (sheets) {
    for (const [clip, meta] of Object.entries(sheets)) {
      if ((clips[clip]?.length ?? 0) > 0) {
        continue
      }
      if (meta.frameWidth > 0 && meta.frameHeight > 0 && meta.frames > 0) {
        clips[clip] = Array.from({ length: meta.frames }, (_, i) => `${meta.file}#${i}`)
      }
    }
  }
  return clips
}

export async function loadSpriteManifests(): Promise<SpriteManifest[]> {
  const found: SpriteManifest[] = []
  await Promise.all(PLAYABLE_FIGHTERS.map(async (id) => {
    let json: Partial<SpriteManifest> = {}
    if (!SPRITE_CLIP_INDEX[id]) {
      try {
        const res = await fetch(`${spriteFolder(id)}/manifest.json`)
        if (res.ok) {
          json = await res.json() as SpriteManifest
        }
      } catch {
        json = {}
      }
    }

    const clips: Record<string, string[]> = clipsFromIndex(id)
    await discoverRegisteredSkillClips(id, clips)
    if (json.clips) {
      for (const [clip, files] of Object.entries(json.clips)) {
        if (files && files.length > 0) {
          clips[clip] = files
        }
      }
    }
    const folder = spriteFolder(id)
    const indexed = Object.keys(clips).length > 0
    const likelyArt = indexed
      || Boolean(json.clips)
      || await urlExists(`${folder}/attack/001.png`)
      || await urlExists(`${folder}/attack/01.png`)
      || await urlExists(`${folder}/idle/001.png`)
    if (likelyArt && !indexed) {
      await Promise.all(ACTION_FOLDERS.map(async (clip) => {
        if ((clips[clip]?.length ?? 0) > 0) {
          return
        }
        const files = await discoverClipFolder(id, clip)
        if (files && files.length > 0) {
          clips[clip] = files
        }
      }))
      if (!clips.attack) {
        const melee = await discoverClipFolder(id, 'melee') ?? await discoverClipFolder(id, 'punch')
        if (melee) {
          clips.attack = melee
        }
      }
      if (!clips.hit) {
        const stun = await discoverClipFolder(id, 'stun')
        if (stun) {
          clips.hit = stun
        }
      }
    }

    if (json.melee && json.melee.length > 0 && !clips.attack) {
      clips.attack = json.melee
    }

    const hasSheet = Boolean(json.image && (json.atlas || (json.frameWidth && json.frameHeight)))
    const data: SpriteManifest = {
      ...json,
      fighterId: id,
      clips,
      melee: clips.attack,
    }
    if (!hasActionFrames(data) && !hasSheet) {
      return
    }
    manifests.set(id, data)
    found.push(data)
  }))
  return found
}

export async function loadPunchedClips(
  scene: Phaser.Scene,
  list: SpriteManifest[],
  opts: PunchLoadOpts = {},
): Promise<void> {
  const jobs: Array<() => Promise<void>> = []
  for (const man of list) {
    const id = man.fighterId as FighterIdValue
    const folder = spriteFolder(id)
    if (!man.clips) {
      continue
    }
    for (const [clip, files] of Object.entries(man.clips)) {
      if (files?.length && files.every((rel) => rel.includes('#'))) {
        jobs.push(async () => {
          if (opts.signal?.aborted || !gameAlive(scene)) {
            return
          }
          await loadSheetFrames(scene, id, clip, folder)
        })
        continue
      }
      files?.forEach((rel, index) => {
        const key = spriteFrameKey(id, clip, index)
        const url = `${folder}/${rel}`
        jobs.push(async () => {
          try {
            const img = await loadHtmlImage(url)
            if (opts.signal?.aborted || !gameAlive(scene)) {
              return
            }
            const canvas = keepArtistPixels(clip)
              ? canvasFromRawImage(img)
              : canvasFromPunchedImage(img)
            addPunchedTexture(scene, key, canvas)
          } catch (error) {
            console.warn('[sprites] punch load failed', url, error)
          }
        })
      })
    }
  }

  const total = jobs.length
  let done = 0
  for (let i = 0; i < jobs.length; i += PUNCH_BATCH) {
    if (opts.signal?.aborted || !gameAlive(scene)) {
      break
    }
    const batch = jobs.slice(i, i + PUNCH_BATCH)
    await Promise.all(batch.map((job) => job()))
    done = Math.min(total, i + batch.length)
    opts.onProgress?.(done, total)
    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve())
    })
  }
}

function canvasFromRawImage(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, img.naturalWidth || img.width)
  canvas.height = Math.max(1, img.naturalHeight || img.height)
  const ctx = canvas.getContext('2d', { alpha: true })
  ctx?.drawImage(img, 0, 0)
  return canvas
}

async function loadSheetFrames(
  scene: Phaser.Scene,
  id: FighterIdValue,
  clip: string,
  folder: string,
): Promise<void> {
  const meta = SPRITE_SHEET_INDEX[id]?.[clip]
  if (!meta || meta.frameWidth <= 0 || meta.frameHeight <= 0 || meta.frames <= 0) {
    return
  }
  const img = await loadHtmlImage(`${folder}/${meta.file}`)
  const cols = meta.columns > 0 ? meta.columns : Math.max(1, Math.floor(img.width / meta.frameWidth))
  for (let i = 0; i < meta.frames; i += 1) {
    const key = spriteFrameKey(id, clip, i)
    if (scene.textures.exists(key)) {
      continue
    }
    const canvas = document.createElement('canvas')
    canvas.width = meta.frameWidth
    canvas.height = meta.frameHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      continue
    }
    const sx = (i % cols) * meta.frameWidth
    const sy = Math.floor(i / cols) * meta.frameHeight
    ctx.drawImage(img, sx, sy, meta.frameWidth, meta.frameHeight, 0, 0, meta.frameWidth, meta.frameHeight)
    scene.textures.addCanvas(key, canvas)
  }
}

function defaultFrameRate(clip: string): number {
  if (clip === 'idle') {
    return 8
  }
  if (clip === 'walk') {
    return 10
  }
  if (clip === 'run' || clip === 'attack' || clip === 'skill') {
    return 12
  }
  if (clip.includes('_')) {
    return 12
  }
  return 10
}

export function createSpriteAnims(scene: Phaser.Scene): void {
  for (const [id, man] of manifests) {
    if (man.clips) {
      for (const [clip, files] of Object.entries(man.clips)) {
        if (!files || files.length === 0) {
          continue
        }
        const key = spriteAnimKey(id, clip)
        if (scene.anims.exists(key)) {
          continue
        }
        const frames = files
          .map((_, index) => ({ key: spriteFrameKey(id, clip, index) }))
          .filter((frame) => scene.textures.exists(frame.key))
        if (frames.length === 0) {
          continue
        }
        scene.anims.create({
          key,
          frames,
          frameRate: man.frameRate ?? defaultFrameRate(clip),
          repeat: LOOPING_CLIPS.has(clip) ? -1 : 0,
        })
      }
      const idleKey = spriteAnimKey(id, 'idle')
      if (!scene.anims.exists(idleKey)) {
        const attack0 = spriteFrameKey(id, 'attack', 0)
        if (scene.textures.exists(attack0)) {
          scene.anims.create({
            key: idleKey,
            frames: [{ key: attack0 }],
            frameRate: 1,
            repeat: -1,
          })
        }
      }
    }

    const sheet = spriteSheetKey(id)
    if (!scene.textures.exists(sheet) || !man.animations) {
      continue
    }
    for (const [clip, def] of Object.entries(man.animations)) {
      if (!def) {
        continue
      }
      const key = spriteAnimKey(id, clip)
      if (scene.anims.exists(key)) {
        continue
      }
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(sheet, { start: def.start, end: def.end }),
        frameRate: def.frameRate ?? 10,
        repeat: def.repeat ?? -1,
      })
    }
  }
}
