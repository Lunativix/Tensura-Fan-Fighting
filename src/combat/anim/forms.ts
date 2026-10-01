import type { SkinBody } from '../../config/characterSkins.ts'
import type { FighterIdValue } from '../../types/game.ts'
import { appearancesOf, rosterAppearanceFor } from '../../story/visual/index.ts'

export const DEFAULT_ANIM_FORM = 'default'

/** Portraits / dialogue / cutscenes only. No combat PNG sheets. */
const CINEMATIC_ONLY_FORMS = new Set(['rimuru-slime', 'rimuru-satoru'])

export function isCinematicOnlyForm(form: string): boolean {
  return CINEMATIC_ONLY_FORMS.has(form)
}

export function storyAnimForm(fighterId: FighterIdValue, body: SkinBody): string {
  const list = appearancesOf(fighterId)
  const matches = list.filter((item) => item.body === body)
  return matches[matches.length - 1]?.id ?? list[0]?.id ?? DEFAULT_ANIM_FORM
}

export function versusAnimForm(fighterId: FighterIdValue): string {
  return rosterAppearanceFor(fighterId).id
}

export function formsOf(fighterId: FighterIdValue): string[] {
  const ids = appearancesOf(fighterId).map((item) => item.id)
  if (!ids.includes(DEFAULT_ANIM_FORM)) {
    ids.push(DEFAULT_ANIM_FORM)
  }
  return ids
}

export function clipKeysFor(form: string, animId: string): string[] {
  if (isCinematicOnlyForm(form)) {
    return []
  }
  const keys = [`${form}__${animId}`, animId]
  if (form === 'rimuru-demon-lord') {
    keys.splice(1, 0, `rimuru-shizu__${animId}`)
  }
  return [...new Set(keys)]
}
