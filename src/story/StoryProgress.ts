import { saveManager } from '../save/SaveManager.ts'
import { applyStoryRewards, syncCollectionFromStory, unlockCollection } from '../account/index.ts'
import { markEncountered } from '../live/collection.ts'
import { defaultStorySave, type StorySaveSlice } from './types.ts'

export type { StorySaveSlice }
export { defaultStorySave }
export const FIRST_MISSION = 'prologue_reincarnation'

export function loadStory(): StorySaveSlice {
  const data = saveManager.load()
  return data.story ?? defaultStorySave()
}

export function persistStory(story: StorySaveSlice): void {
  const data = saveManager.load()
  data.story = story
  syncCollectionFromStory(data)
  for (const id of story.unlockedCharacters) {
    markEncountered(data, id)
  }
  saveManager.save(data)
}

export function grantStoryClearRewards(xp: number, coins: number): void {
  const data = saveManager.load()
  applyStoryRewards(data, { xp, coins })
  saveManager.save(data)
}

export function unlockStoryAppearances(ids: string[]): void {
  if (ids.length === 0) {
    return
  }
  const data = saveManager.load()
  data.collection = unlockCollection(data.collection, { appearances: ids })
  saveManager.save(data)
}

export function resetStory(): StorySaveSlice {
  const fresh = defaultStorySave()
  persistStory(fresh)
  return fresh
}

export function hasCompleted(story: StorySaveSlice, missionId: string): boolean {
  if (story.completed.includes(missionId)) {
    return true
  }
  if (missionId === 'shizu_ifrit') {
    return [
      'tempest_founded',
      'charybdis_siege',
      'falmuth_invasion',
      'harvest_festival',
      'clayman_trap',
      'walpurgis_banquet',
    ].some((id) => story.completed.includes(id))
  }
  return false
}

export function markComplete(story: StorySaveSlice, missionId: string): StorySaveSlice {
  const completed = story.completed.includes(missionId)
    ? story.completed
    : [...story.completed, missionId]
  return { ...story, completed }
}

export function mergeUnlocks(
  story: StorySaveSlice,
  extra: {
    skills?: string[]
    characters?: string[]
    stages?: string[]
    archives?: string[]
    tutorials?: string[]
  },
): StorySaveSlice {
  const unique = (base: string[], add?: string[]): string[] => {
    const next = [...base]
    for (const id of add ?? []) {
      if (!next.includes(id)) {
        next.push(id)
      }
    }
    return next
  }
  return {
    ...story,
    unlockedSkills: unique(story.unlockedSkills, extra.skills),
    unlockedCharacters: unique(story.unlockedCharacters, extra.characters),
    unlockedStages: unique(story.unlockedStages, extra.stages),
    archives: unique(story.archives, extra.archives),
    tutorials: unique(story.tutorials, extra.tutorials),
  }
}
