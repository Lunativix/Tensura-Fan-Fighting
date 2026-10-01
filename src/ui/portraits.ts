import type Phaser from 'phaser'
import { CHARACTERS, PLAYABLE_FIGHTERS } from '../config/characters.ts'
import { storySkinFor } from '../config/characterSkins.ts'
import type { FighterIdValue } from '../types/game.ts'
import { defaultStorySave, type StorySaveSlice } from '../story/types.ts'
import { addPunchedTexture, canvasFromPunchedImage } from '../sprites/punchBackdrop.ts'

export function portraitArtKey(id: string): string {
  return `portrait-art-${id}`
}

export function portraitHeadKey(id: string): string {
  return `portrait-head-${id}`
}

/** Extra story faces (not playable fighters). Files live in public/portraits. */
export const STORY_PORTRAIT_FILES: Record<string, string> = {
  satoru: '/portraits/satoru_head.png',
  'rimuru-slime': '/portraits/rimuru_slime_head.png',
  'great-sage': '/portraits/great_sage_head.png',
  shizu: '/portraits/shizu_head.png',
}

const STORY_PORTRAIT_ART: Record<string, string> = {
  'rimuru-slime': '/portraits/rimuru_slime_art.png',
}

const SPEAKER_FIGHTER: Record<string, FighterIdValue> = {
  'Satoru Mikami': 'rimuru',
  Rimuru: 'rimuru',
  'Milim Nava': 'milim',
  Milim: 'milim',
  Noir: 'diablo',
  Diablo: 'diablo',
  'Guy Crimson': 'guy',
  Guy: 'guy',
}

for (const id of PLAYABLE_FIGHTERS) {
  SPEAKER_FIGHTER[CHARACTERS[id].name] = id
}

export function queuePortraitLoads(load: Phaser.Loader.LoaderPlugin): void {
  for (const id of PLAYABLE_FIGHTERS) {
    load.image(portraitArtKey(id), `/portraits/${id}_art.png`)
    load.image(portraitHeadKey(id), `/portraits/${id}_head.png`)
  }
  for (const [id, url] of Object.entries(STORY_PORTRAIT_FILES)) {
    load.image(portraitHeadKey(id), url)
    load.image(portraitArtKey(id), STORY_PORTRAIT_ART[id] ?? url)
  }
}

const SLIME_PORTRAIT_KEYS = new Set([
  portraitHeadKey('rimuru-slime'),
  portraitArtKey('rimuru-slime'),
])

/** Strip white studio backdrops on menu portraits. Slime art is punched separately. */
export function punchMenuPortraits(scene: Phaser.Scene): void {
  const keys = [
    ...PLAYABLE_FIGHTERS.flatMap((id) => [portraitArtKey(id), portraitHeadKey(id)]),
    ...Object.keys(STORY_PORTRAIT_FILES).flatMap((id) => [portraitHeadKey(id), portraitArtKey(id)]),
  ]
  for (const key of keys) {
    if (SLIME_PORTRAIT_KEYS.has(key) || !scene.textures.exists(key)) {
      continue
    }
    const src = scene.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement
    if (!src || typeof src.width !== 'number' || src.width < 16) {
      continue
    }
    addPunchedTexture(scene, key, canvasFromPunchedImage(src, 'white'))
  }
}

export function resolveDialoguePortrait(opts: {
  speaker: string
  speakerId?: FighterIdValue
  portrait?: string
  missionId?: string
  story?: StorySaveSlice
}): string | undefined {
  if (opts.portrait) {
    return opts.portrait
  }
  if (opts.speaker === 'Great Sage') {
    return 'great-sage'
  }
  if (opts.speaker === 'Shizu') {
    return 'shizu'
  }
  const fighter = opts.speakerId ?? SPEAKER_FIGHTER[opts.speaker]
  if (fighter) {
    return storySkinFor(fighter, opts.story ?? defaultStorySave(), {
      missionId: opts.missionId,
      speaker: opts.speaker,
    }).portrait
  }
  return undefined
}
