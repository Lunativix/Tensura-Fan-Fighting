import { STORY_ARCS } from './catalog/arcs.ts'
import { CAVE_MISSION } from './catalog/cave.ts'
import { CHARYBDIS_MISSION } from './catalog/charybdis.ts'
import { CLAYMAN_MISSION } from './catalog/clayman.ts'
import { DEMON_LORD_MISSION } from './catalog/demonLord.ts'
import { FALMUTH_MISSION } from './catalog/falmuth.ts'
import { GOBLIN_MISSION } from './catalog/goblins.ts'
import { OGRES_MISSION } from './catalog/ogres.ts'
import { ORC_MISSION } from './catalog/orcs.ts'
import { PROLOGUE_MISSION } from './catalog/prologue.ts'
import { SHIZU_MISSION } from './catalog/shizu.ts'
import { TEMPEST_MISSION } from './catalog/tempest.ts'
import { WALPURGIS_MISSION } from './catalog/walpurgis.ts'
import { hasCompleted } from './StoryProgress.ts'
import type { StoryArcDef, StoryMissionDef, StorySaveSlice } from './types.ts'

export const STORY_MISSIONS: readonly StoryMissionDef[] = [
  PROLOGUE_MISSION,
  CAVE_MISSION,
  GOBLIN_MISSION,
  OGRES_MISSION,
  ORC_MISSION,
  SHIZU_MISSION,
  TEMPEST_MISSION,
  CHARYBDIS_MISSION,
  FALMUTH_MISSION,
  DEMON_LORD_MISSION,
  CLAYMAN_MISSION,
  WALPURGIS_MISSION,
]

export function allArcs(): readonly StoryArcDef[] {
  return STORY_ARCS
}

export function missionById(id: string): StoryMissionDef | undefined {
  return STORY_MISSIONS.find((mission) => mission.id === id)
}

export function playableMissions(): StoryMissionDef[] {
  return STORY_MISSIONS.filter((mission) => mission.playable)
}

export function nextPlayable(story: StorySaveSlice): StoryMissionDef | undefined {
  return playableMissions().find((mission) => !hasCompleted(story, mission.id))
}

export function isMissionOpen(mission: StoryMissionDef, story: StorySaveSlice): boolean {
  if (!mission.playable) {
    return false
  }
  const playable = playableMissions()
  const index = playable.findIndex((item) => item.id === mission.id)
  if (index <= 0) {
    return true
  }
  const prev = playable[index - 1]
  return Boolean(prev && hasCompleted(story, prev.id))
}

export function missionsOfArc(arcId: string): StoryMissionDef[] {
  return STORY_MISSIONS.filter((mission) => mission.arc === arcId)
}

export { hasCompleted }
