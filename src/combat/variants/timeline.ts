import { STORY_ARCS } from '../../story/catalog/arcs.ts'
import { STORY_MISSIONS, missionById } from '../../story/StoryCatalog.ts'
import { defaultStorySave, type StorySaveSlice } from '../../story/types.ts'
import type { ChronologyPeriod } from './types.ts'

export function chronologyPeriods(): ChronologyPeriod[] {
  return [...STORY_MISSIONS]
    .sort((a, b) => a.chronology - b.chronology)
    .map((mission) => {
      const arc = STORY_ARCS.find((item) => item.id === mission.arc) ?? STORY_ARCS[0]!
      return {
        missionId: mission.id,
        arcId: arc.id,
        title: mission.title,
        chronology: mission.chronology,
      }
    })
}

export function periodByMissionId(missionId: string): ChronologyPeriod | undefined {
  return chronologyPeriods().find((item) => item.missionId === missionId)
}

export const DEFAULT_CHRONOLOGY_MISSION = 'walpurgis_banquet'

export function cycleChronologyMission(missionId: string, dir: 1 | -1): string {
  const periods = chronologyPeriods()
  const index = Math.max(0, periods.findIndex((item) => item.missionId === missionId))
  const next = periods[(index + dir + periods.length) % periods.length]
  return next?.missionId ?? DEFAULT_CHRONOLOGY_MISSION
}

/** Story slice as if this mission is the current moment. No invented events. */
export function storySliceAtPeriod(missionId: string): StorySaveSlice {
  const ordered = [...STORY_MISSIONS].sort((a, b) => a.chronology - b.chronology)
  const current = missionById(missionId) ?? ordered[0]!
  const completed = ordered.filter((mission) => mission.chronology < current.chronology).map((mission) => mission.id)
  const unlockedSkills: string[] = []
  for (const mission of ordered) {
    if (mission.chronology >= current.chronology) {
      continue
    }
    for (const skill of mission.unlocks?.skills ?? []) {
      if (!unlockedSkills.includes(skill)) {
        unlockedSkills.push(skill)
      }
    }
  }
  if (current.unlocks?.skills) {
    for (const skill of current.unlocks.skills) {
      if (!unlockedSkills.includes(skill)) {
        unlockedSkills.push(skill)
      }
    }
  }
  return {
    ...defaultStorySave(),
    missionId: current.id,
    completed,
    unlockedSkills,
  }
}
