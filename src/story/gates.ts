import type { FighterActions } from '../input/Actions.ts'
import type { StorySaveSlice } from './types.ts'

export function gateStoryActions(actions: FighterActions, story: StorySaveSlice, allow: {
  move: boolean
  attack: boolean
  skill1: boolean
  guard: boolean
  dash: boolean
  jump: boolean
}): void {
  if (!allow.move) {
    actions.left = false
    actions.right = false
  }
  if (!allow.jump) {
    actions.jump = false
  }
  if (!allow.dash) {
    actions.dash = false
  }
  if (!allow.guard) {
    actions.guard = false
  }
  if (!allow.attack) {
    actions.light = false
    actions.medium = false
    actions.heavy = false
  }
  if (!allow.skill1 || !story.unlockedSkills.includes('water-blade')) {
    actions.skill1 = false
  }
  if (!story.unlockedSkills.includes('black-lightning')) {
    actions.skill2 = false
  }
    actions.skill3 = false
    actions.skill4 = false
    actions.ultimate = false
}
