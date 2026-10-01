export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min
  }
  return Math.min(max, Math.max(min, value))
}

export function applyDamage(
  hp: number,
  damage: number,
  guarding: boolean,
  guardFactor = 0.25,
): number {
  const incoming = Math.max(0, damage)
  const dealt = guarding ? incoming * guardFactor : incoming
  return clamp(hp - dealt, 0, Number.POSITIVE_INFINITY)
}

export function regenResource(current: number, max: number, amount: number): number {
  return clamp(current + amount, 0, max)
}

export function spendResource(current: number, cost: number): number {
  if (cost > current) {
    return current
  }
  return current - cost
}

export function canSpend(current: number, cost: number): boolean {
  return cost <= current
}
