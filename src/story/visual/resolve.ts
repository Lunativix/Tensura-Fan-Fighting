import type { FighterIdValue } from '../../types/game.ts'
import { hasCompleted } from '../StoryProgress.ts'
import { STORY_MISSIONS } from '../StoryCatalog.ts'
import { PLAYABLE_FIGHTERS } from '../../config/characters.ts'
import { defaultStorySave, type StorySaveSlice } from '../types.ts'
import { SPEAKER_APPEARANCES, appearanceById, appearancesOf } from './catalog.ts'
import type { AppearanceDef, StoryVisualState, VisualContext, VisualFrom } from './types.ts'

function fromSatisfied(from: VisualFrom, ctx: VisualContext, requires?: string[]): boolean {
  if (requires && !requires.every((id) => hasCompleted(ctx.story, id))) {
    return false
  }
  if (from.kind === 'start') {
    return true
  }
  if (from.kind === 'missionComplete') {
    return hasCompleted(ctx.story, from.missionId)
  }
  return ctx.missionId === from.missionId || hasCompleted(ctx.story, from.missionId)
}

function lastMatching(list: AppearanceDef[], ctx: VisualContext): AppearanceDef {
  let current = list[0]
  if (!current) {
    throw new Error('appearance catalog empty')
  }
  for (const item of list) {
    if (fromSatisfied(item.from, ctx, item.requires)) {
      current = item
    }
  }
  return current
}

export function appearanceFor(fighterId: FighterIdValue, ctx: VisualContext): AppearanceDef {
  if (ctx.speaker) {
    const override = SPEAKER_APPEARANCES.find((item) => item.speaker === ctx.speaker)
    if (override) {
      const found = appearanceById(override.appearanceId)
      if (found && found.fighterId === fighterId) {
        return found
      }
    }
  }
  const list = appearancesOf(fighterId)
  return lastMatching(list, ctx)
}

export function storyMomentId(story: StorySaveSlice, missionId?: string): string {
  const current = missionId || story.missionId
  if (current && !hasCompleted(story, current)) {
    return `IN:${current}`
  }
  const ordered = [...STORY_MISSIONS].sort((a, b) => a.chronology - b.chronology)
  let last = ''
  for (const mission of ordered) {
    if (hasCompleted(story, mission.id)) {
      last = mission.id
    }
  }
  return last ? `AFTER:${last}` : 'START'
}

export function storyVisualState(story: StorySaveSlice, missionId?: string): StoryVisualState {
  const ctx: VisualContext = { story, missionId: missionId || story.missionId }
  const appearances = {} as Record<FighterIdValue, AppearanceDef>
  for (const id of PLAYABLE_FIGHTERS) {
    appearances[id] = appearanceFor(id, ctx)
  }
  return {
    moment: storyMomentId(story, ctx.missionId),
    missionId: ctx.missionId ?? story.missionId,
    completed: story.completed,
    appearances,
  }
}

/** Roster / versus / training: last look that has combat sprites, not story-locked slime. */
export function rosterAppearanceFor(fighterId: FighterIdValue): AppearanceDef {
  const list = appearancesOf(fighterId)
  const spriteLooks = list.filter((item) => item.body === 'sprite')
  return spriteLooks[spriteLooks.length - 1] ?? list[list.length - 1] ?? lastMatching(list, {
    story: { ...defaultStorySave(), completed: STORY_MISSIONS.map((item) => item.id) },
  })
}

export function derivedVisualSnapshot(story: StorySaveSlice, missionId?: string): Record<string, string> {
  const state = storyVisualState(story, missionId)
  const out: Record<string, string> = { moment: state.moment }
  for (const id of PLAYABLE_FIGHTERS) {
    out[id] = state.appearances[id].id
  }
  return out
}

export function spriteFolderFor(appearance: AppearanceDef): string {
  if (appearance.spriteFolder) {
    return `/sprites/${appearance.spriteFolder}`
  }
  const id = appearance.spriteFighterId ?? appearance.fighterId
  return `/sprites/${id}`
}

export function isHumanRimuruForbidden(missionId: string, story: StorySaveSlice): boolean {
  if (hasCompleted(story, 'shizu_ifrit')) {
    return false
  }
  return new Set([
    'prologue_reincarnation',
    'cave_veldora',
    'goblin_wolves',
    'ogres_survivors',
    'orc_war',
    'shizu_ifrit',
  ]).has(missionId)
}
