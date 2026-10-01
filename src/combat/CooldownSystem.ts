export class CooldownSystem {
  private readonly remaining = new Map<string, number>()

  start(id: string, durationMs: number): void {
    this.remaining.set(id, durationMs)
  }

  ready(id: string): boolean {
    return (this.remaining.get(id) ?? 0) <= 0
  }

  ratio(id: string, durationMs: number): number {
    if (durationMs <= 0) {
      return 1
    }
    const left = this.remaining.get(id) ?? 0
    return 1 - Math.min(1, left / durationMs)
  }

  remainingMs(id: string): number {
    return this.remaining.get(id) ?? 0
  }

  update(deltaMs: number): void {
    for (const [id, time] of this.remaining) {
      const next = time - deltaMs
      if (next <= 0) {
        this.remaining.delete(id)
      } else {
        this.remaining.set(id, next)
      }
    }
  }
}
