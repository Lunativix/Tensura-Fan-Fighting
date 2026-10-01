import { PveProfile } from '../types.ts'
import type { PveEnemy } from './PveEnemy.ts'

export function steerPve(enemy: PveEnemy, targetX: number, dt: number): void {
  if (!enemy.alive) {
    return
  }
  const dist = targetX - enemy.x
  enemy.facing = dist >= 0 ? 1 : -1
  const abs = Math.abs(dist)
  const profile = enemy.def.profile
  const speed = enemy.def.speed * (enemy.phase >= 2 ? 1.4 : 1)
  const reach = profile === PveProfile.BOSS ? 110 : 64
  if (profile === PveProfile.SWARM && abs > 70) {
    enemy.body.setAccelerationX(Math.sign(dist) * speed * 3.2)
  } else if (profile === PveProfile.BOSS && abs > reach) {
    enemy.body.setAccelerationX(Math.sign(dist) * speed * 2.1)
  } else if (profile === PveProfile.AGGRESSIVE && abs > 80) {
    enemy.body.setAccelerationX(Math.sign(dist) * speed * 2.8)
  } else if (profile === PveProfile.DEFENSIVE && abs > 220) {
    enemy.body.setAccelerationX(Math.sign(dist) * speed * 2.2)
  } else if (abs < reach) {
    enemy.body.setAccelerationX(0)
    if (dt > 0) {
      enemy.startBite()
    }
  } else {
    enemy.body.setAccelerationX(Math.sign(dist) * speed * 2.4)
  }
}
