export interface StatusEffect {
  id: string
  remaining: number
  attackMul: number
  defenseMul: number
  speedMul: number
}

export class StatusController {
  readonly list: StatusEffect[] = []

  add(effect: StatusEffect): void {
    this.list.push(effect)
  }

  tick(deltaMs: number): void {
    for (let i = this.list.length - 1; i >= 0; i -= 1) {
      const item = this.list[i]
      if (!item) {
        continue
      }
      item.remaining -= deltaMs
      if (item.remaining <= 0) {
        this.list.splice(i, 1)
      }
    }
  }

  attackMul(): number {
    return this.list.reduce((n, e) => n * e.attackMul, 1)
  }

  defenseMul(): number {
    return this.list.reduce((n, e) => n * e.defenseMul, 1)
  }

  speedMul(): number {
    return this.list.reduce((n, e) => n * e.speedMul, 1)
  }
}
