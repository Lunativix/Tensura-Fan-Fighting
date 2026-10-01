import type { SkillAnimResolution, SkillFrameEvent, SkillPlayback } from './types.ts'

export class SkillDirector {
  private resolution: SkillAnimResolution | null = null
  private fired = new Set<number>()
  private pending: SkillFrameEvent[] = []

  get active(): boolean {
    return this.resolution !== null
  }

  get resolutionNow(): SkillAnimResolution | null {
    return this.resolution
  }

  playback(): SkillPlayback | null {
    const res = this.resolution
    if (!res) {
      return null
    }
    return {
      animId: res.animId,
      clipKey: res.clipKey,
      missing: res.source === 'missing',
      form: res.form,
      skillName: res.skillName,
      durationFrames: res.durationFrames,
      artStatus: res.artStatus,
      characterName: res.characterName,
    }
  }

  start(resolution: SkillAnimResolution): void {
    this.resolution = resolution
    this.fired.clear()
    this.pending = []
  }

  stop(): void {
    this.resolution = null
    this.fired.clear()
    this.pending = []
  }

  advance(frame: number): SkillFrameEvent[] {
    const res = this.resolution
    if (!res) {
      return []
    }
    res.events.forEach((event, index) => {
      if (frame + 0.001 >= event.frame && !this.fired.has(index)) {
        this.fired.add(index)
        this.pending.push(event)
      }
    })
    const batch = this.pending
    this.pending = []
    return batch
  }

  drain(): SkillFrameEvent[] {
    const batch = this.pending
    this.pending = []
    return batch
  }
}
