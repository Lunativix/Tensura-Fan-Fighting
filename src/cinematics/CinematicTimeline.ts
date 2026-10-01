import type { CinematicApi } from './CinematicApi.ts'
import type { CinematicDef } from './types.ts'

export class CinematicTimeline {
  elapsed = 0
  wallMs = 0
  readonly def: CinematicDef
  private cursor = 0
  private readonly order: number[]

  constructor(def: CinematicDef) {
    this.def = def
    this.order = def.steps.map((_, i) => i).sort((a, b) => (def.steps[a]?.at ?? 0) - (def.steps[b]?.at ?? 0))
  }

  tick(simDt: number, api: CinematicApi): boolean {
    this.elapsed += simDt
    while (this.cursor < this.order.length) {
      const index = this.order[this.cursor]
      const step = index === undefined ? undefined : this.def.steps[index]
      if (!step || this.elapsed < step.at) {
        break
      }
      try {
        step.run(api)
      } catch (error) {
        console.error('[cinematic] step', step.at, error)
      }
      this.cursor += 1
    }
    return this.elapsed >= this.def.duration
  }

  get skippable(): boolean {
    return this.def.skippable !== false
  }
}
