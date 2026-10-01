import Phaser from 'phaser'
import type { Fighter } from '../characters/Fighter.ts'
import type { AttackData } from './Attack.ts'
import { AttackKind } from './Attack.ts'
import { makeBox, type Hitbox } from './Hitbox.ts'
import { ARENA_LEFT, ARENA_RIGHT, pointPastArena } from './ArenaBounds.ts'
import { RangedShape, resolveRangedPlan, type RangedPlan, type RangedShapeId } from './ranged.ts'
import { styleFor } from '../vfx/CombatStyle.ts'
import { FxLayer } from '../vfx/FxLayers.ts'

export class Projectile extends Phaser.GameObjects.Rectangle {
  activeShot = false
  owner: Fighter | null = null
  vx = 0
  vy = 0
  life = 0
  attack: AttackData | null = null
  hitsLeft = 1
  plan: RangedPlan | null = null
  shape: RangedShapeId = RangedShape.EnergyBall
  justHitEdge = false
  originX = 0
  originY = 0
  endX = 0
  currentLength = 0
  private beamLike = false
  private growSpeed = 0
  private core!: Phaser.GameObjects.Ellipse
  private halo!: Phaser.GameObjects.Ellipse
  private beamGfx!: Phaser.GameObjects.Graphics
  private sparkClock = 0

  constructor(scene: Phaser.Scene) {
    super(scene, -999, -999, 28, 22, 0x80deea, 0)
    scene.add.existing(this)
    this.setVisible(false)
    this.setDepth(FxLayer.PROJECTILE)
    this.halo = scene.add.ellipse(-999, -999, 88, 88, 0x80deea, 0.28)
    this.core = scene.add.ellipse(-999, -999, 48, 48, 0xffffff, 0.95)
    this.beamGfx = scene.add.graphics()
    this.halo.setBlendMode(Phaser.BlendModes.ADD).setVisible(false).setDepth(FxLayer.PROJECTILE)
    this.core.setBlendMode(Phaser.BlendModes.ADD).setVisible(false).setDepth(FxLayer.PROJECTILE + 1)
    this.beamGfx.setBlendMode(Phaser.BlendModes.ADD).setVisible(false).setDepth(FxLayer.PROJECTILE)
    this.halo.setScrollFactor(1)
    this.core.setScrollFactor(1)
    this.beamGfx.setScrollFactor(1)
  }

  fire(owner: Fighter, attack: AttackData, color: number, targetX?: number): void {
    const plan = resolveRangedPlan(attack, owner.x, owner.y, owner.facing, targetX, owner.bodyStyle)
    const tint = styleFor(owner.def.id).glow || color
    this.activeShot = true
    this.justHitEdge = false
    this.owner = owner
    this.attack = attack
    this.plan = plan
    this.shape = plan.shape
    this.beamLike = plan.shape === RangedShape.Beam || plan.shape === RangedShape.Wave
    this.originX = plan.startX
    this.originY = plan.startY
    this.endX = plan.endX
    this.hitsLeft = plan.piercing
    this.life = plan.travelMs
    this.growSpeed = plan.speed
    this.currentLength = this.beamLike && plan.instant ? plan.length : this.beamLike ? Math.min(64, plan.length) : 0
    this.vx = this.beamLike ? 0 : plan.speed * plan.facing
    this.vy = 0
    this.setFillStyle(tint, 0)
    this.setBlendMode(Phaser.BlendModes.ADD)
    this.setVisible(false)
    if (this.beamLike) {
      this.syncBeamBody()
      this.core.setVisible(false)
      this.halo.setVisible(false)
      this.beamGfx.setVisible(true)
      this.drawBeam(tint)
    } else {
      this.setPosition(plan.startX, plan.startY)
      const slash = plan.shape === RangedShape.SlashProjectile
      const visual = slash ? { w: 96, h: 28 } : { w: 68, h: 68 }
      this.core.setVisible(true)
      this.halo.setVisible(true)
      this.beamGfx.setVisible(false).clear()
      this.core.setFillStyle(0xffffff, 0.95)
      this.halo.setFillStyle(tint, 0.42)
      this.core.setDisplaySize(visual.w * 0.7, visual.h * 0.7)
      this.halo.setDisplaySize(visual.w * 1.55, visual.h * 1.55)
      this.core.rotation = slash ? (plan.facing >= 0 ? -0.4 : Math.PI + 0.4) : 0
      this.placeBall()
    }
  }

  getHitbox(): Hitbox {
    const plan = this.plan
    if (!plan) {
      return makeBox(this.x, this.y, 1, -14, -11, 28, 22)
    }
    if (this.beamLike) {
      const len = Math.max(8, this.currentLength)
      const h = plan.beamWidth
      if (plan.facing >= 0) {
        return { x: this.originX, y: this.originY - h / 2, width: len, height: h }
      }
      return { x: this.originX - len, y: this.originY - h / 2, width: len, height: h }
    }
    return makeBox(this.x, this.y, 1, -plan.hitWidth / 2, -plan.hitHeight / 2, plan.hitWidth, plan.hitHeight)
  }

  tick(deltaMs: number): boolean {
    if (!this.activeShot || !this.plan) {
      return false
    }
    const dt = deltaMs / 1000
    this.life -= deltaMs
    this.sparkClock += deltaMs
    if (this.beamLike) {
      if (this.currentLength < this.plan.length) {
        this.currentLength = Math.min(this.plan.length, this.currentLength + this.growSpeed * dt)
      }
      this.syncBeamBody()
      this.drawBeam(this.owner ? styleFor(this.owner.def.id).glow : 0x80d8ff)
      if (this.life <= 0) {
        this.finishEdgeIfNeeded()
        this.kill()
        return false
      }
      return true
    }
    this.x += this.vx * dt
    this.y += this.vy * dt
    if (this.shape !== RangedShape.SlashProjectile) {
      this.core.rotation += dt * 6
    }
    this.placeBall()
    const traveled = Math.abs(this.x - this.originX)
    const wall = pointPastArena(this.x, this.y)
    const passedEnd = this.plan.facing >= 0 ? this.x >= this.endX : this.x <= this.endX
    if (this.life <= 0 || ((wall || passedEnd) && traveled > 10)) {
      this.x = this.endX
      this.y = this.originY
      this.placeBall()
      this.finishEdgeIfNeeded()
      this.kill()
      return false
    }
    return true
  }

  home(targetX: number, targetY?: number): void {
    const plan = this.plan
    const attack = this.attack
    if (!this.activeShot || this.beamLike || !plan || !attack) {
      return
    }
    const strength = attack.homingStrength ?? attack.tracking ?? 0
    if (strength <= 0) {
      return
    }
    if (strength < 1) {
      this.vx += Math.sign(targetX - this.x) * strength * 12
      return
    }
    const maxTurn = attack.maxTurnRate ?? 5
    const desired = Math.atan2((targetY ?? this.originY) - this.y, targetX - this.x)
    const current = Math.atan2(this.vy, this.vx || plan.facing)
    let delta = desired - current
    while (delta > Math.PI) {
      delta -= Math.PI * 2
    }
    while (delta < -Math.PI) {
      delta += Math.PI * 2
    }
    const step = Phaser.Math.Clamp(delta, -maxTurn / 60, maxTurn / 60)
    const speed = Math.hypot(this.vx, this.vy) || plan.speed
    const next = current + step
    this.vx = Math.cos(next) * speed
    this.vy = Math.sin(next) * speed * 0.35
  }

  consumeHit(): boolean {
    this.hitsLeft -= 1
    return this.hitsLeft > 0
  }

  consumeEdgeFx(): boolean {
    if (!this.justHitEdge) {
      return false
    }
    this.justHitEdge = false
    return true
  }

  kill(): void {
    this.activeShot = false
    this.attack = null
    this.owner = null
    this.plan = null
    this.setVisible(false)
    this.setPosition(-999, -999)
    this.core.setVisible(false).setPosition(-999, -999)
    this.halo.setVisible(false).setPosition(-999, -999)
    this.beamGfx.setVisible(false).clear()
  }

  private finishEdgeIfNeeded(): void {
    if (!this.plan) {
      return
    }
    const atEdge = this.plan.facing >= 0
      ? this.endX >= ARENA_RIGHT - 2
      : this.endX <= ARENA_LEFT + 2
    this.justHitEdge = atEdge || Boolean(this.plan.reachesArenaEdge)
  }

  private syncBeamBody(): void {
    const mid = this.originX + this.plan!.facing * (this.currentLength * 0.5)
    this.setPosition(mid, this.originY)
  }

  private placeBall(): void {
    this.core.setPosition(this.x, this.y)
    this.halo.setPosition(this.x, this.y)
    const pulse = 1 + Math.sin(this.scene.time.now / 70) * 0.08
    this.halo.setScale(pulse)
  }

  private drawBeam(color: number): void {
    const plan = this.plan
    if (!plan) {
      return
    }
    const gfx = this.beamGfx
    gfx.clear()
    const len = this.currentLength
    const x = plan.facing >= 0 ? this.originX : this.originX - len
    const y = this.originY
    const outer = plan.beamWidth
    const coreH = Math.max(6, outer * 0.32)
    gfx.fillStyle(color, 0.18)
    gfx.fillRect(x - 6, y - outer * 0.7, len + 12, outer * 1.4)
    gfx.fillStyle(color, 0.42)
    gfx.fillRect(x, y - outer / 2, len, outer)
    gfx.fillStyle(0xffffff, 0.88)
    gfx.fillRect(x, y - coreH / 2, len, coreH)
    if (this.sparkClock > 40) {
      this.sparkClock = 0
    }
  }
}

export class ProjectilePool {
  private readonly items: Projectile[]

  constructor(scene: Phaser.Scene, size = 16) {
    this.items = []
    for (let i = 0; i < size; i += 1) {
      this.items.push(new Projectile(scene))
    }
  }

  spawn(owner: Fighter, attack: AttackData, targetX?: number): Projectile | null {
    if (attack.kind !== AttackKind.PROJECTILE && attack.kind !== AttackKind.BEAM) {
      return null
    }
    const item = this.items.find((p) => !p.activeShot)
    if (!item) {
      return null
    }
    item.fire(owner, attack, owner.def.accent, targetX)
    return item
  }

  active(): Projectile[] {
    return this.items.filter((p) => p.activeShot)
  }

  clear(): void {
    this.items.forEach((p) => p.kill())
  }
}
