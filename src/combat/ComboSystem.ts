export class ComboSystem {
  hits = 0
  private timer = 0
  private readonly windowMs: number

  constructor(windowMs = 1600) {
    this.windowMs = windowMs
  }

  registerHit(): number {
    this.hits += 1
    this.timer = this.windowMs
    return this.hits
  }

  update(deltaMs: number): void {
    if (this.hits === 0) {
      return
    }
    this.timer -= deltaMs
    if (this.timer <= 0) {
      this.hits = 0
    }
  }

  reset(): void {
    this.hits = 0
    this.timer = 0
  }
}
