export interface TransformState {
  active: boolean
  remaining: number
  attackMul: number
  speedMul: number
}

export function createTransform(): TransformState {
  return { active: false, remaining: 0, attackMul: 1, speedMul: 1 }
}

export function startTransform(state: TransformState, durationMs: number, attackMul: number, speedMul: number): void {
  state.active = true
  state.remaining = durationMs
  state.attackMul = attackMul
  state.speedMul = speedMul
}

export function tickTransform(state: TransformState, deltaMs: number): void {
  if (!state.active) {
    return
  }
  state.remaining -= deltaMs
  if (state.remaining <= 0) {
    state.active = false
    state.attackMul = 1
    state.speedMul = 1
  }
}
