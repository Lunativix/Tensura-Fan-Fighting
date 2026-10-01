import { STORY_MISSIONS } from '../StoryCatalog.ts'
import type { StoryBeat, StoryMissionDef, StorySaveSlice } from '../types.ts'
import { defaultStorySave } from '../types.ts'
import { appearanceFor, isHumanRimuruForbidden, storyVisualState } from './resolve.ts'
import type { VisualContext } from './types.ts'

export interface VisualIssue {
  missionId: string
  code: string
  detail: string
}

function dialogueBeats(mission: StoryMissionDef): Extract<StoryBeat, { type: 'dialogue' }>[] {
  return mission.beats.filter((beat): beat is Extract<StoryBeat, { type: 'dialogue' }> => beat.type === 'dialogue')
}

function inOrderStory(mission: StoryMissionDef): StorySaveSlice {
  const prior = STORY_MISSIONS
    .filter((item) => item.chronology < mission.chronology)
    .map((item) => item.id)
  return { ...defaultStorySave(), completed: prior, missionId: mission.id }
}

/**
 * Continuity gate on the catalog played in chronological order.
 * Never invent a fix: report and keep the last canon appearance.
 */
export function collectVisualIssues(): VisualIssue[] {
  const issues: VisualIssue[] = []
  for (const mission of STORY_MISSIONS) {
    const story = inOrderStory(mission)
    const ctx: VisualContext = { story, missionId: mission.id }
    const rimuru = appearanceFor('rimuru', ctx)
    if (isHumanRimuruForbidden(mission.id, story) && rimuru.body === 'sprite') {
      issues.push({
        missionId: mission.id,
        code: 'rimuru-human-too-early',
        detail: `${rimuru.id} during ${mission.id}`,
      })
    }
    if (mission.id === 'shizu_ifrit' && rimuru.id !== 'rimuru-slime') {
      issues.push({
        missionId: mission.id,
        code: 'rimuru-must-be-slime-during-shizu',
        detail: rimuru.id,
      })
    }
    for (const beat of dialogueBeats(mission)) {
      if (beat.speaker === 'Diablo' && mission.chronology < 10) {
        issues.push({
          missionId: mission.id,
          code: 'diablo-before-naming',
          detail: beat.text.slice(0, 48),
        })
      }
      if (beat.speakerId === 'rimuru' && beat.speaker === 'Rimuru') {
        const look = appearanceFor('rimuru', { ...ctx, speaker: beat.speaker })
        if (isHumanRimuruForbidden(mission.id, story) && look.portrait === 'rimuru') {
          issues.push({
            missionId: mission.id,
            code: 'rimuru-human-portrait',
            detail: `${mission.id} portrait ${look.portrait}`,
          })
        }
      }
    }
  }
  return issues
}

export function warnVisualGaps(story: StorySaveSlice, missionId: string): string[] {
  const state = storyVisualState(story, missionId)
  const warnings: string[] = []
  for (const look of Object.values(state.appearances)) {
    if (look.artStatus === 'missing-period-art') {
      warnings.push(`[visual] ${look.id}: no period art, using roster fallback`)
    }
  }
  if (isHumanRimuruForbidden(missionId, story) && state.appearances.rimuru.body !== 'slime') {
    warnings.push(`[visual] Rimuru human form blocked in ${missionId}, using slime`)
  }
  return warnings
}
