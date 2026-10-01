export class HitStop {
  remaining = 0

  apply(ms: number): void {
    this.remaining = Math.max(this.remaining, ms)
  }

  tick(deltaMs: number): boolean {
    if (this.remaining <= 0) {
      return false
    }
    this.remaining -= deltaMs
    if (this.remaining < 0) {
      this.remaining = 0
    }
    return this.remaining > 0
  }

  get frozen(): boolean {
    return this.remaining > 0
  }
}

export function hitStopFor(power: number, ultimate: boolean): number {
  if (ultimate || power >= 250) {
    return 90
  }
  if (power >= 120) {
    return 55
  }
  if (power >= 50) {
    return 28
  }
  return 8
}
