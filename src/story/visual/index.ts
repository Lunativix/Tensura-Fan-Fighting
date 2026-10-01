export type { AppearanceDef, StoryVisualState, VisualBody, VisualContext } from './types.ts'
export { APPEARANCES, SPEAKER_APPEARANCES, appearanceById, appearancesOf } from './catalog.ts'
export {
  appearanceFor,
  derivedVisualSnapshot,
  rosterAppearanceFor,
  spriteFolderFor,
  storyMomentId,
  storyVisualState,
} from './resolve.ts'
export { collectVisualIssues, warnVisualGaps } from './checks.ts'
