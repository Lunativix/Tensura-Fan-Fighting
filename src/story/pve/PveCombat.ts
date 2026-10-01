import type { Fighter } from '../../characters/Fighter.ts'
import { computeHit } from '../../combat/DamageSystem.ts'
import { hitboxOverlaps } from '../../combat/Hitbox.ts'
import type { ProjectilePool } from '../../combat/Projectile.ts'
import { combatSfx } from '../../audio/CombatSfx.ts'
import type { PveEnemy } from './PveEnemy.ts'
import type { SpectacleImpact } from '../../vfx/CombatSpectacle.ts'

export function resolvePve(
  player: Fighter,
  enemies: PveEnemy[],
  projectiles: ProjectilePool,
): SpectacleImpact | null {
  let impact: SpectacleImpact | null = null
  const strike = player.currentHitbox()
  if (strike && player.attack && !player.attack.connected) {
    for (const enemy of enemies) {
      if (!enemy.alive) {
        continue
      }
      if (!hitboxOverlaps(strike, enemy.hurtbox())) {
        continue
      }
      const result = computeHit(enemy.hp, player.attack.data, {
        guarding: false,
        perfectGuard: false,
        armor: false,
        defense: enemy.def.defense,
        comboHits: 0,
      })
      enemy.receive(result.dealt, player.facing)
      player.attack.connected = true
      combatSfx.impact({
        fighterId: player.def.id,
        attackId: player.attack.data.id,
        kind: player.attack.data.kind,
        slot: player.lastSkillSlot,
        power: result.dealt,
        combo: 1,
        blocked: false,
        perfect: false,
        armored: false,
        counter: false,
        airborne: false,
        grounded: true,
        killing: !enemy.alive,
        launcher: false,
        knockdown: false,
        flash: result.dealt > 40,
        x: enemy.x,
        y: enemy.y,
      })
      impact = {
        x: enemy.x,
        y: enemy.y,
        power: result.dealt,
        flash: result.dealt > 40,
        perfect: false,
        blocked: false,
        facing: player.facing,
        combo: 1,
        attackerId: player.def.id,
      }
      break
    }
  }

  for (const shot of projectiles.active()) {
    if (shot.owner !== player || !shot.attack) {
      continue
    }
    for (const enemy of enemies) {
      if (!enemy.alive) {
        continue
      }
      if (!hitboxOverlaps(shot.getHitbox(), enemy.hurtbox())) {
        continue
      }
      const result = computeHit(enemy.hp, shot.attack, {
        guarding: false,
        perfectGuard: false,
        armor: false,
        defense: enemy.def.defense,
        comboHits: 0,
      })
      enemy.receive(result.dealt, Math.sign(shot.vx) || shot.plan?.facing || player.facing)
      impact = impact ?? {
        x: enemy.x,
        y: enemy.y,
        power: result.dealt,
        flash: result.dealt > 40,
        perfect: false,
        blocked: false,
        facing: player.facing,
        combo: 1,
        attackerId: player.def.id,
      }
      if (!shot.consumeHit()) {
        shot.kill()
        break
      }
    }
  }

  for (const enemy of enemies) {
    if (!enemy.alive) {
      continue
    }
    const box = enemy.strikeBox()
    if (!box || player.invuln > 0 || !player.alive) {
      continue
    }
    if (!hitboxOverlaps(box, player.hurtbox())) {
      continue
    }
    const attack = enemy.biteData()
    const result = computeHit(player.hp, attack, {
      guarding: player.guarding,
      perfectGuard: player.perfectGuard,
      armor: player.armored,
      defense: player.def.defense,
      comboHits: 0,
    })
    player.hp = result.hpAfter
    player.receiveHit(attack, enemy.facing, result.blocked, result.armored, result.perfect)
    enemy.biting = 0
    impact = {
      x: player.x,
      y: player.y,
      power: result.dealt,
      flash: result.dealt > 40,
      perfect: result.perfect,
      blocked: result.blocked,
      facing: enemy.facing,
      combo: 1,
      attackerId: player.def.id,
    }
  }

  return impact
}
