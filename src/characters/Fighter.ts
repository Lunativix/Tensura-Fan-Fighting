import Phaser from 'phaser'
import { CHARACTERS, type CharacterDefinition } from '../config/characters.ts'
import type { FighterKit } from '../config/skills.ts'
import { kitFor } from '../config/skills.ts'
import { AttackKind, type AttackData, type AttackInstance } from '../combat/Attack.ts'
import { ARENA_LEFT, ARENA_RIGHT } from '../combat/ArenaBounds.ts'
import { areaSpanToEdge } from '../combat/ranged.ts'
import { CooldownSystem } from '../combat/CooldownSystem.ts'
import { makeBox, type Hitbox } from '../combat/Hitbox.ts'
import { FighterState, type FighterStateId } from '../combat/FighterState.ts'
import { canSpend, clamp, regenResource } from '../gameplay/Resources.ts'
import type { FighterActions } from '../input/Actions.ts'
import type { FighterIdValue } from '../types/game.ts'
import { AbsorptionBank } from '../powers/AbsorptionBank.ts'
import { createTransform, startTransform, tickTransform } from '../powers/TransformSystem.ts'
import { StatusController } from '../combat/StatusEffects.ts'
import type { SkinBody } from '../config/characterSkins.ts'
import { FighterView2D } from './FighterView2D.ts'
import { FxLayer } from '../vfx/FxLayers.ts'
import { styleFor } from '../vfx/CombatStyle.ts'
import type { GhostSpawn } from '../vfx/AfterimagePool.ts'
import type { AudioCue } from '../audio/SfxTypes.ts'
import { SkillDirector } from '../combat/anim/SkillDirector.ts'
import { resolveSkillAnim } from '../combat/anim/resolveSkillAnim.ts'
import { skillAnimOf } from '../combat/anim/registry.ts'
import { timingOf } from '../combat/anim/pipeline.ts'
import { timingFromAttack } from '../combat/anim/timing.ts'
import { ultimateIsConfirmed } from '../combat/ultimates/confirmation.ts'
import { storyAnimForm, versusAnimForm } from '../combat/anim/forms.ts'
import { sceneHasFighterClip } from '../sprites/SpriteLoader.ts'
import type { SkillFrameEvent } from '../combat/anim/types.ts'

export { ARENA_LEFT, ARENA_RIGHT } from '../combat/ArenaBounds.ts'

const GROUND_Y = 900
const BODY_W = 64
const BODY_H = 132
const PERFECT_GUARD_MS = 140

export class Fighter extends Phaser.GameObjects.Container {
  readonly def: CharacterDefinition
  readonly kit: FighterKit
  readonly side: number
  hp: number
  energy: number
  ultimate = 0
  stamina = 100
  shield = 0
  transformGauge = 0
  state: FighterStateId = FighterState.IDLE
  facing = 1
  grounded = true
  guarding = false
  invuln = 0
  hitstun = 0
  lightStep = 0
  dashCd = 0
  bodyFlash = 0
  jumpsLeft = 1
  airDashLeft = 1
  guardAge = 0
  knockdownTime = 0
  getupTime = 0
  lastPerfect = false
  lastUsedAttack: AttackData | null = null
  lastSkillSlot: number | null = null
  motionEvent: 'dash' | 'attack' | 'knock' | 'land' | null = null
  prevAttackFrame = -1
  private audioCues: AudioCue[] = []
  private wasGrounded = true
  private wasGuarding = false
  readonly absorb = new AbsorptionBank()
  readonly statuses = new StatusController()
  readonly transform = createTransform()
  readonly cooldowns = new CooldownSystem()
  attack: AttackInstance | null = null
  declare body: Phaser.Physics.Arcade.Body
  bodyStyle: SkinBody
  animForm: string
  private readonly allowedAttackIds: readonly string[] | null
  readonly skillAnim = new SkillDirector()
  aimLockX: number | null = null
  private view: FighterView2D
  private spawnShot: ((attack: AttackData) => void) | null = null
  private skillCues: SkillFrameEvent[] = []

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    def: CharacterDefinition,
    side: number,
    opts?: { body?: SkinBody, form?: string, allowedAttackIds?: readonly string[] | null },
  ) {
    super(scene, x, y)
    this.def = def
    this.kit = kitFor(def.id)
    this.side = side
    this.hp = def.maxHp
    this.energy = def.maxEnergy
    this.facing = side >= 0 ? 1 : -1
    this.allowedAttackIds = opts?.allowedAttackIds === undefined ? null : opts.allowedAttackIds

    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setSize(BODY_W, BODY_H)
    this.body.setCollideWorldBounds(true)
    this.body.setMaxVelocity(1100, 1700)
    this.body.setDragX(1800)
    this.body.allowGravity = true

    this.bodyStyle = opts?.body ?? 'sprite'
    this.animForm = opts?.form ?? (this.bodyStyle === 'sprite' ? versusAnimForm(def.id) : storyAnimForm(def.id, this.bodyStyle))
    this.view = new FighterView2D(scene, def.id, def.color, def.accent, this.bodyStyle)
    this.add(this.view.root)
    this.setDepth(FxLayer.FIGHTER)
  }

  applyBody(body: SkinBody, form?: string): void {
    this.bodyStyle = body
    this.animForm = form ?? storyAnimForm(this.def.id, body)
    this.view.root.destroy()
    this.view = new FighterView2D(this.scene, this.def.id, this.def.color, this.def.accent, body)
    this.add(this.view.root)
  }

  drainSkillCues(): SkillFrameEvent[] {
    const cues = this.skillCues
    this.skillCues = []
    return cues
  }

  cosmeticTint(color?: number): void {
    this.view.root.iterate((obj: Phaser.GameObjects.GameObject) => {
      const sprite = obj as Phaser.GameObjects.Sprite
      if (typeof sprite.setTint !== 'function') {
        return
      }
      if (color === undefined) {
        sprite.clearTint()
      } else {
        sprite.setTint(color)
      }
    })
  }

  ghost(): GhostSpawn {
    return this.view.ghost(this.x, this.y, this.facing, styleFor(this.def.id).glow)
  }

  playOneShot(clip: 'switch_in' | 'switch_out' | 'idle' | 'attack'): void {
    this.view.playOneShot(clip)
  }

  drainAudio(): AudioCue[] {
    const cues = this.audioCues
    this.audioCues = []
    return cues
  }

  private queueAudio(kind: AudioCue): void {
    if (this.audioCues.length < 6) {
      this.audioCues.push(kind)
    }
  }

  setSilhouetteVisible(visible: boolean): void {
    this.view.setVisible(visible)
  }

  get alive(): boolean {
    return this.hp > 0 && this.state !== FighterState.DEAD
  }

  get perfectGuard(): boolean {
    return this.guarding && this.guardAge > 0 && this.guardAge <= PERFECT_GUARD_MS
  }

  get armored(): boolean {
    if (this.hp <= 0) {
      return false
    }
    if (this.ultimateConfirmed) {
      return true
    }
    return Boolean(this.attack?.data.armor && this.attack.frame < this.attack.data.startup + this.attack.data.active)
  }

  get ultimateConfirmed(): boolean {
    if (this.state !== FighterState.ULTIMATE || !this.attack) {
      return false
    }
    const def = skillAnimOf(this.def.id, this.attack.data.id)
    const timing = def ? timingOf(def, this.attack.data) : timingFromAttack(this.attack.data)
    return ultimateIsConfirmed(this.attack, timing)
  }

  hurtbox(): Hitbox {
    return { x: this.x - BODY_W / 2, y: this.y - BODY_H / 2, width: BODY_W, height: BODY_H }
  }

  currentHitbox(): Hitbox | null {
    if (!this.attack) {
      return null
    }
    const a = this.attack.data
    if (this.attack.frame < a.startup || this.attack.frame >= a.startup + a.active) {
      return null
    }
    if (a.kind === AttackKind.PROJECTILE || a.kind === AttackKind.BEAM) {
      return null
    }
    if (a.kind === AttackKind.AREA && a.reachesArenaEdge) {
      const span = areaSpanToEdge(this.x, this.facing, a.hitOffsetX, a.hitWidth, true)
      return makeBox(this.x, this.y, this.facing, span.offsetX, a.hitOffsetY, span.width, a.hitHeight)
    }
    return makeBox(this.x, this.y, this.facing, a.hitOffsetX, a.hitOffsetY, a.hitWidth, a.hitHeight)
  }

  lookAt(otherX: number): void {
    if (this.state === FighterState.DASH || this.state === FighterState.DEAD || this.state === FighterState.KNOCKDOWN) {
      return
    }
    this.facing = otherX >= this.x ? 1 : -1
    this.view.setFacing(this.facing)
  }

  applyInput(actions: FighterActions, spawnProjectile: (attack: AttackData) => void): void {
    this.spawnShot = spawnProjectile
    if (!this.alive || this.state === FighterState.KNOCKDOWN || this.state === FighterState.GETUP) {
      return
    }
    const attacking = Boolean(this.attack)
    this.guarding = actions.guard && this.canGuard() && !attacking && !actions.light && !actions.medium && !actions.heavy
    if (this.guarding && !this.wasGuarding) {
      this.queueAudio('guard_start')
    }
    this.wasGuarding = this.guarding
    if (this.guarding) {
      this.state = FighterState.BLOCK
      this.body.setAccelerationX(0)
      return
    }

    if (this.hitstun > 0) {
      return
    }

    if (this.attack) {
      if (actions.light) {
        this.startLight(actions.down)
      } else if (actions.medium && this.lightStep > 0) {
        this.startAttack(this.kit.medium, FighterState.ATTACK)
      } else if (actions.heavy && this.lightStep > 0) {
        this.lightStep = 0
        this.startAttack(this.kit.heavy, FighterState.ATTACK)
      }
      return
    }

    if (actions.dash && this.dashCd <= 0) {
      this.startDash(!this.grounded)
      return
    }
    if (actions.jump && this.jumpsLeft > 0) {
      this.body.setVelocityY(-this.def.jumpForce)
      this.jumpsLeft -= 1
      this.grounded = false
      this.state = FighterState.JUMP
      this.queueAudio('jump')
    }
    if (actions.down && actions.light) {
      this.startAttack(this.kit.downLight, FighterState.ATTACK)
      return
    }
    if (actions.light) {
      this.startLight(false)
      return
    }
    if (actions.medium) {
      this.startAttack(this.grounded ? this.kit.medium : this.kit.airLight, FighterState.ATTACK)
      return
    }
    if (actions.heavy) {
      this.startAttack(this.grounded ? this.kit.heavy : this.kit.airHeavy, FighterState.ATTACK)
      return
    }
    if (actions.skill1) {
      this.trySkill(0, spawnProjectile)
      return
    }
    if (actions.skill2) {
      this.trySkill(1, spawnProjectile)
      return
    }
    if (actions.skill3) {
      this.trySkill(2, spawnProjectile)
      return
    }
    if (actions.skill4) {
      this.trySkill(3, spawnProjectile)
      return
    }
    if (actions.ultimate && this.ultimate >= 100) {
      this.triggerUltimate()
      return
    }

    const dir = (actions.right ? 1 : 0) - (actions.left ? 1 : 0)
    if (this.state !== FighterState.DASH) {
      this.body.setAccelerationX(dir * this.def.speed * 6 * this.statuses.speedMul() * this.transform.speedMul)
      if (this.grounded) {
        this.state = dir !== 0 ? (Math.abs(this.body.velocity.x) > 280 ? FighterState.RUN : FighterState.WALK) : FighterState.IDLE
      } else {
        this.state = this.body.velocity.y > 80 ? FighterState.FALL : FighterState.JUMP
      }
    }
  }

  tick(deltaMs: number): void {
    this.cooldowns.update(deltaMs)
    this.statuses.tick(deltaMs)
    tickTransform(this.transform, deltaMs)
    this.energy = regenResource(this.energy, this.def.maxEnergy, (deltaMs / 1000) * 8)
    this.stamina = regenResource(this.stamina, 100, (deltaMs / 1000) * 12)
    if (this.dashCd > 0) {
      this.dashCd -= deltaMs
    }
    if (this.invuln > 0) {
      this.invuln -= deltaMs
    }
    if (this.bodyFlash > 0) {
      this.bodyFlash -= deltaMs
    }

    this.grounded = this.body.blocked.down || this.y >= GROUND_Y - 2
    if (!this.wasGrounded && this.grounded) {
      this.queueAudio('land')
      this.motionEvent = 'land'
    }
    this.wasGrounded = this.grounded
    if (this.grounded) {
      this.jumpsLeft = this.def.doubleJump ? 2 : 1
      this.airDashLeft = this.def.airDash ? 1 : 0
    }
    this.x = clamp(this.x, ARENA_LEFT, ARENA_RIGHT)

    if (this.guarding) {
      this.guardAge += deltaMs
    } else {
      this.guardAge = 0
    }

    if (this.state === FighterState.KNOCKDOWN) {
      this.knockdownTime -= deltaMs
      this.body.setAccelerationX(0)
      if (this.knockdownTime <= 0) {
        this.state = FighterState.GETUP
        this.getupTime = 280
        this.invuln = 280
      }
      this.skillAnim.stop()
      this.view.setSkillPlayback(null)
      this.setScale(1, 1)
      this.view.pose(this.state, this.scene.time.now, this.bodyFlash > 0, this.transform.active, !this.alive)
      return
    }
    if (this.state === FighterState.GETUP) {
      this.getupTime -= deltaMs
      if (this.getupTime <= 0) {
        this.state = FighterState.IDLE
      }
      this.setScale(1, 1)
      this.view.pose(this.state, this.scene.time.now, this.bodyFlash > 0, this.transform.active, !this.alive)
      return
    }

    if (this.hitstun > 0) {
      this.hitstun -= deltaMs / (1000 / 60)
      this.state = this.hitstun > 0 ? FighterState.HIT : FighterState.IDLE
    }

    if (this.attack) {
      this.attack.frame += deltaMs / (1000 / 60)
      const total = this.attack.data.startup + this.attack.data.active + this.attack.data.recovery
      if (this.attack.data.kind === AttackKind.DASH && this.attack.frame < this.attack.data.startup + this.attack.data.active) {
        this.body.setVelocityX(this.facing * 780)
      }
      if (this.attack.frame >= total) {
        this.attack = null
        this.prevAttackFrame = -1
        this.aimLockX = null
        this.skillAnim.stop()
        this.view.setSkillPlayback(null)
        this.state = FighterState.IDLE
      }
    }

    if (!this.alive) {
      this.state = FighterState.DEAD
      this.body.setAccelerationX(0)
    }

    if (this.attack && this.skillAnim.active) {
      const cues = this.skillAnim.advance(this.attack.frame)
      for (const cue of cues) {
        if (cue.kind === 'spawn' && this.spawnShot) {
          this.spawnShot(this.attack.data)
        } else {
          this.skillCues.push(cue)
        }
      }
    }

    this.view.setSkillPlayback(this.skillAnim.playback())
    this.view.pose(this.state, this.scene.time.now, this.bodyFlash > 0, this.transform.active, !this.alive)
    this.applyActionScale()
  }

  private applyActionScale(): void {
    const t = this.scene.time.now
    if (this.skillAnim.active) {
      this.setScale(1, 1)
      return
    }
    if (this.attack) {
      const f = this.attack.frame
      const start = this.attack.data.startup
      if (f < Math.min(3, start)) {
        this.setScale(0.88, 1.14)
      } else if (f < start + 2) {
        this.setScale(1.28, 0.76)
      } else if (f < start + this.attack.data.active) {
        this.setScale(1.12, 0.88)
      } else {
        this.setScale(1.02, 0.98)
      }
      return
    }
    if (this.state === FighterState.DASH) {
      this.setScale(1.32, 0.74)
    } else if (this.state === FighterState.HIT || this.state === FighterState.STUN) {
      this.setScale(0.84, 1.16)
    } else if (this.state === FighterState.JUMP) {
      this.setScale(0.94, 1.1)
    } else if (this.state === FighterState.FALL) {
      this.setScale(1.06, 0.92)
    } else {
      this.setScale(1, 1 + Math.sin(t / 220) * 0.03)
    }
  }

  receiveHit(attack: AttackData, fromFacing: number, blocked: boolean, armored: boolean, perfect: boolean): void {
    this.lastPerfect = perfect
    this.bodyFlash = 80
    if (perfect) {
      this.body.setVelocityX(fromFacing * 40)
      return
    }
    if (blocked) {
      this.body.setVelocityX(fromFacing * attack.knockback * 0.2)
      return
    }
    if (armored) {
      this.body.setVelocityX(fromFacing * attack.knockback * 0.15)
      return
    }
    if (this.attack && (this.state === FighterState.SKILL || this.state === FighterState.ULTIMATE)) {
      this.queueAudio('interrupt')
    }
    this.hitstun = attack.hitstun
    this.attack = null
    this.body.setVelocity(fromFacing * attack.knockback, attack.knockbackY)
    if (Math.abs(attack.knockback) >= 280) {
      this.motionEvent = 'knock'
    }
    if (this.x <= ARENA_LEFT + 8 || this.x >= ARENA_RIGHT - 8) {
      this.body.setVelocityX(-this.body.velocity.x * 0.7)
      this.body.setVelocityY(-Math.abs(attack.knockbackY) - 80)
    }
    if (attack.knockdown || attack.launcher && this.grounded && attack.knockbackY < -350) {
      this.state = FighterState.KNOCKDOWN
      this.knockdownTime = 420
    } else {
      this.state = attack.stun > 0 ? FighterState.STUN : FighterState.HIT
    }
    if (this.hp <= 0) {
      this.state = FighterState.DEAD
      this.queueAudio('ko')
    }
  }

  gainUltimate(amount: number): void {
    this.ultimate = clamp(this.ultimate + amount, 0, 100)
  }

  refill(): void {
    this.hp = this.def.maxHp
    this.energy = this.def.maxEnergy
    this.ultimate = 100
    this.stamina = 100
    this.state = FighterState.IDLE
    this.attack = null
    this.hitstun = 0
  }

  private canGuard(): boolean {
    return this.hitstun <= 0 && this.state !== FighterState.DEAD && this.state !== FighterState.ULTIMATE
  }

  private startLight(down: boolean): void {
    if (down && this.grounded) {
      this.startAttack(this.kit.downLight, FighterState.ATTACK)
      return
    }
    if (!this.grounded) {
      this.startAttack(this.kit.airLight, FighterState.ATTACK)
      return
    }
    const cancel = this.attack && this.lightStep > 0 && this.lightStep < 3
      && this.attack.frame >= this.attack.data.startup
    if (this.attack && !cancel) {
      return
    }
    const step = cancel ? this.lightStep : 0
    this.lightStep = step + 1
    this.startAttack(this.kit.lights[step] ?? this.kit.lights[0], FighterState.ATTACK)
    if (this.lightStep >= 3) {
      this.lightStep = 0
    }
  }

  private startDash(air: boolean): void {
    if (air) {
      if (!this.def.airDash || this.airDashLeft <= 0) {
        return
      }
      this.airDashLeft -= 1
    }
    this.dashCd = 280
    this.invuln = 110
    this.state = FighterState.DASH
    this.motionEvent = 'dash'
    this.queueAudio(air ? 'airdash' : 'dash')
    this.body.setVelocityX(this.facing * 980)
    if (air) {
      this.body.setVelocityY(-120)
    }
    this.scene.time.delayedCall(120, () => {
      if (this.state === FighterState.DASH) {
        this.state = this.grounded ? FighterState.IDLE : FighterState.FALL
      }
    })
  }

  private beginSkillAnim(attack: AttackData): void {
    const hasClip = (id: FighterIdValue, key: string) => sceneHasFighterClip(this.scene, id, key)
    const resolved = resolveSkillAnim(this.def.id, this.animForm, attack, hasClip)
    if (!resolved) {
      this.skillAnim.stop()
      this.view.setSkillPlayback(null)
      return
    }
    this.skillAnim.start(resolved)
    this.view.setSkillPlayback(this.skillAnim.playback())
  }

  private trySkill(slot: number, spawnProjectile: (attack: AttackData) => void): void {
    const attack = this.kit.skills[slot]
    const cd = this.kit.skillCooldownMs[slot]
    if (!attack || cd === undefined) {
      return
    }
    if (!this.attackAllowed(attack.id)) {
      return
    }
    if (!this.cooldowns.ready(attack.id) || !canSpend(this.energy, attack.energyCost)) {
      return
    }
    this.energy -= attack.energyCost
    this.cooldowns.start(attack.id, cd)
    this.lastSkillSlot = slot
    this.spawnShot = spawnProjectile
    if (attack.kind === AttackKind.TRANSFORMATION || attack.kind === AttackKind.BUFF) {
      startTransform(this.transform, 4000, 1.2, 1.12)
      this.statuses.add({ id: attack.id, remaining: 4000, attackMul: 1.15, defenseMul: 1.1, speedMul: 1.08 })
    }
    const pose = attack.kind === AttackKind.TRANSFORMATION ? FighterState.TRANSFORM : FighterState.SKILL
    this.startAttack(attack, pose)
    this.queueAudio('skill')
  }

  triggerUltimate(): boolean {
    if (!this.alive || this.ultimate < 100) {
      return false
    }
    if (!this.attackAllowed(this.kit.ultimate.id)) {
      return false
    }
    this.ultimate = 0
    this.lastSkillSlot = 4
    this.startAttack(this.kit.ultimate, FighterState.ULTIMATE)
    this.queueAudio('ultimate')
    startTransform(this.transform, 5000, 1.25, 1.15)
    this.invuln = 200
    return true
  }

  private attackAllowed(attackId: string): boolean {
    return !this.allowedAttackIds || this.allowedAttackIds.includes(attackId)
  }

  applyTransformBurst(): void {
    startTransform(this.transform, 5000, 1.25, 1.15)
  }

  private startAttack(data: AttackData, state: FighterStateId): void {
    const resolved = this.absorb.stored && data.id.endsWith('predator') ? this.absorb.stored : data
    this.lastUsedAttack = resolved
    this.attack = { data: resolved, frame: 0, connected: false }
    this.prevAttackFrame = -1
    this.state = state
    this.motionEvent = 'attack'
    this.aimLockX = null
    this.body.setAccelerationX(0)
    if (state === FighterState.ATTACK) {
      this.lastSkillSlot = null
      this.queueAudio('attack')
      this.skillAnim.stop()
      this.view.setSkillPlayback(null)
    } else {
      this.beginSkillAnim(resolved)
    }
  }

  get attackPower(): number {
    return this.statuses.attackMul() * this.transform.attackMul
  }
}

export function isPlayableId(id: FighterIdValue): boolean {
  return CHARACTERS[id]?.playable === true
}
