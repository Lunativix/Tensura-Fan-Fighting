import type { CinematicApi } from './CinematicApi.ts'
import type { CinematicDef, CinematicStep } from './types.ts'

export function steps(entries: Array<[number, (api: CinematicApi) => void]>): CinematicStep[] {
  return entries.map(([at, run]) => ({ at, run }))
}

export function def(
  id: string,
  duration: number,
  entries: Array<[number, (api: CinematicApi) => void]>,
  extra?: Partial<Pick<CinematicDef, 'skippable' | 'commit'>>,
): CinematicDef {
  return {
    id,
    duration,
    skippable: extra?.skippable,
    commit: extra?.commit,
    steps: steps(entries),
  }
}
