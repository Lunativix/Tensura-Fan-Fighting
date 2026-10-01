import { AssetKeys } from '../assets/AssetKeys.ts'
import { flashCamera } from '../effects/ScreenEffect.ts'
import { screenFxEnabled, vfxBudget } from '../effects/ScreenFx.ts'
import { vfxEngine } from './VfxEngine.ts'
import { AfterimagePool } from './AfterimagePool.ts'
import { AuraField } from './AuraField.ts'
import { MotionTrail } from './MotionTrail.ts'
import { SpeedLines } from './SpeedLines.ts'
import { styleFor, type CombatStyle } from './CombatStyle.ts'
import { impactFeel, type ImpactFeel, type ImpactTier } from './ImpactCatalog.ts'
import { FxLayer } from './FxLayers.ts'
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../engine/Time.ts'
import type { Fighter } from '../characters/Fighter.ts'
import type { FighterIdValue } from '../types/game.ts'
import type { Projectile } from '../combat/Projectile.ts'
import { followFighters } from '../game/Arena.ts'
import { rumble } from '../input/InputDeviceManager.ts'
import { saveManager } from '../save/SaveManager.ts'
import { FighterState } from '../combat/FighterState.ts'
import { AttackKind } from '../combat/Attack.ts'
import { vfxHookFlag } from '../combat/anim/hookStatus.ts'
import { motionOf } from '../combat/feel/MotionProfile.ts'
import { finisherTheme } from '../combat/feel/FinisherDirector.ts'
import { CameraImpactManager } from '../combat/feel/CameraImpact.ts'
import { attackVfxId } from '../combat/feel/signatureVfx.ts'

export interface SpectacleImpact {
  x: number
  y: number
  power: number
  flash: boolean
  perfect: boolean
  blocked: boolean
  facing: number
  combo: number
  attackerId: string
}

const PARTICLE: Record<ImpactTier, string> = {
  light: 'LIGHT',
  medium: 'IMPACT',
  heavy: 'HEAVY',
  extreme: 'ULTIMATE',
}

const IMPACT_PARTICLE: Record<string, string> = {
  impact_light: 'LIGHT',
  impact_medium: 'IMPACT',
  impact_heavy: 'HEAVY',
  impact_critical: 'HEAVY',
  impact_ultimate: 'ULTIMATE',
}

export class CombatSpectacle {
  readonly ghosts: AfterimagePool
  readonly trails: MotionTrail
  readonly lines: SpeedLines
  readonly auras: AuraField
  zoomBoost = 0
  private dim: Phaser.GameObjects.Rectangle
  private readonly rings: Phaser.GameObjects.Arc[] = []
  private projClock = 0
  private readonly scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.ghosts = new AfterimagePool(scene)
    this.trails = new MotionTrail(scene)
    this.lines = new SpeedLines(scene)
    this.auras = new AuraField(scene)
    this.dim = scene.add.rectangle(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, LOGICAL_WIDTH, LOGICAL_HEIGHT, 0x05070c, 0)
    this.dim.setScrollFactor(0).setDepth(FxLayer.CHARGE_DIM).setVisible(false)
  }

  play(id: string, x: number, y: number, style?: CombatStyle): void {
    const tint = style?.glow ?? 0x80d8ff
    switch (id) {
      case 'dash':
      case 'dash_afterimage':
      case 'afterimage':
        this.ghosts.spawn({ x, y, facing: 1, color: tint }, 150)
        this.lines.burst(0.85)
        vfxEngine.play(this.scene, 'DASH', x, y, tint)
        return
      case 'air_dash':
        this.ghosts.spawn({ x, y, facing: 1, color: tint }, 170)
        this.lines.burst(1)
        flashCamera(this.scene.cameras.main, 30)
        vfxEngine.play(this.scene, 'DASH', x, y, tint)
        return
      case 'teleport':
        this.ghosts.spawn({ x, y, facing: 1, color: tint }, 200)
        flashCamera(this.scene.cameras.main, 40)
        vfxEngine.play(this.scene, 'ENERGY', x, y, tint)
        return
      case 'speed_lines':
        this.lines.burst(1)
        return
      case 'trail':
        this.trails.slash(x, y, 1, tint, style?.trailType ?? 'arc')
        return
      case 'energy_charge':
      case 'charge':
        vfxEngine.play(this.scene, 'CHARGE', x, y, tint)
        vfxEngine.playSheet(this.scene, 'CHARGE_AURA', x, y, { depth: FxLayer.AURA, tint, lifespan: 420 })
        return
      case 'aura':
        vfxEngine.play(this.scene, 'AURA', x, y, tint)
        return
      case 'water_flash':
      case 'water_mist':
        vfxEngine.play(this.scene, 'ENERGY', x, y, 0x80d8ff)
        vfxEngine.play(this.scene, 'LIGHT', x, y, 0xb3e5fc)
        if (id === 'water_flash') {
          flashCamera(this.scene.cameras.main, 22)
        }
        return
      case 'energy_burst':
        vfxEngine.play(this.scene, 'ENERGY', x, y, tint)
        this.shockwave(x, y, tint)
        return
      case 'energy_beam':
        vfxEngine.play(this.scene, 'BEAM', x, y, tint)
        this.trails.bolt(x, y, 1, tint)
        return
      case 'magic_circle':
        vfxEngine.play(this.scene, 'MAGIC', x, y, tint)
        vfxEngine.playSheet(this.scene, 'CHARGE_AURA', x, y, { depth: FxLayer.AURA, tint, lifespan: 360 })
        return
      case 'shockwave':
        this.shockwave(x, y, tint)
        return
      case 'dust':
      case 'debris':
      case 'ground_impact':
        this.dust(x, y)
        if (id !== 'dust') {
          this.shockwave(x, y, tint)
        }
        return
      case 'magic_explosion':
      case 'explosion':
        vfxEngine.play(this.scene, 'EXPLOSION', x, y, tint)
        vfxEngine.play(this.scene, 'MAGIC', x, y, tint)
        this.shockwave(x, y, tint)
        return
      case 'flash':
        flashCamera(this.scene.cameras.main, 40)
        return
      case 'impact_light':
      case 'impact_medium':
      case 'impact_heavy':
      case 'impact_critical':
      case 'impact_ultimate':
        vfxEngine.play(this.scene, IMPACT_PARTICLE[id], x, y, tint)
        return
      default:
        if (vfxHookFlag(id) === 'VFX_MISSING') {
          console.warn(`[VFX_MISSING] ${id}`)
          return
        }
        vfxEngine.play(this.scene, id.toUpperCase(), x, y, tint)
    }
  }

  onDash(fighter: Fighter): void {
    const style = styleFor(fighter.def.id)
    const motion = motionOf(fighter.def.id)
    const ghost = fighter.ghost()
    const copies = motion.afterimage ? motion.dashGhosts : Math.min(1, motion.dashGhosts)
    for (let i = 0; i < copies; i += 1) {
      this.ghosts.spawn({ ...ghost, x: ghost.x - fighter.facing * i * 28 }, 170 - i * 22)
    }
    this.trails.slash(fighter.x, fighter.y, fighter.facing, style.glow, style.trailType)
    this.lines.burst(fighter.grounded ? 0.8 : 1)
    vfxEngine.play(this.scene, 'DASH', fighter.x, fighter.y - 20, style.glow)
    if (!fighter.grounded && motion.afterimage) {
      this.play('teleport', fighter.x, fighter.y - 20, style)
    }
    if (motion.landingDust && fighter.grounded) {
      this.dust(fighter.x, fighter.y)
    }
  }

  onAttackActive(fighter: Fighter): void {
    if (fighter.skillAnim.active) {
      return
    }
    const style = styleFor(fighter.def.id)
    const motion = motionOf(fighter.def.id)
    const attack = fighter.attack?.data
    if (!attack) {
      return
    }
    const vfxId = attackVfxId(attack, motion)
    if (vfxId) {
      this.play(vfxId, fighter.x, fighter.y - 36, style)
    }
    if (motion.bladeTrail) {
      this.trails.slash(fighter.x, fighter.y, fighter.facing, style.glow, 'straight')
    }
    if (motion.magicCircle && (fighter.state === FighterState.SKILL || attack.kind === AttackKind.BEAM)) {
      this.play('magic_circle', fighter.x, fighter.y - 40, style)
    }
  }

  onSkillCue(fighter: Fighter, cue: { kind: string, vfx?: string, camera?: 'light' | 'medium' | 'heavy' | 'ultimate' | 'finisher' }): void {
    const style = styleFor(fighter.def.id)
    if (cue.kind === 'vfx' && cue.vfx) {
      this.play(cue.vfx, fighter.x + fighter.facing * 40, fighter.y - 36, style)
    }
    if (cue.kind === 'camera' && cue.camera) {
      CameraImpactManager.apply(this.scene.cameras.main, cue.camera)
      if (cue.camera === 'ultimate' || cue.camera === 'heavy') {
        this.zoomBoost = Math.max(this.zoomBoost, cue.camera === 'ultimate' ? 0.16 : 0.08)
      }
    }
  }

  onTransform(fighter: Fighter): void {
    const style = styleFor(fighter.def.id)
    this.play('energy_burst', fighter.x, fighter.y - 40, style)
    this.lines.burst(1.05)
    this.zoomBoost = Math.max(this.zoomBoost, 0.08)
    if (motionOf(fighter.def.id).afterimage) {
      this.ghosts.spawn(fighter.ghost(), 220)
    }
  }

  onSwitch(x: number, y: number, id: FighterIdValue): void {
    const style = styleFor(id)
    this.play('dash', x, y, style)
    vfxEngine.playSheet(this.scene, 'SWITCH_IN', x, y - 20, { tint: style.glow })
  }

  onFinisher(attacker: Fighter, defender: Fighter): void {
    const style = styleFor(attacker.def.id)
    const theme = finisherTheme(attacker.def.id, defender.def.id)
    this.dim.setVisible(true)
    this.dim.setAlpha(0.42)
    this.zoomBoost = Math.max(this.zoomBoost, 0.22)
    this.lines.burst(1.25)
    this.play('impact_ultimate', defender.x, defender.y - 36, style)
    vfxEngine.playSheet(this.scene, 'ULTIMATE_IMPACT', defender.x, defender.y - 40, { tint: style.glow })
    if (theme === 'moon-fang' || theme === 'chrono') {
      this.trails.slash(defender.x, defender.y, attacker.facing, style.glow, 'straight')
    }
    if (theme === 'beelzebuth-storm' || theme === 'storm-dragon') {
      this.play('energy_burst', defender.x, defender.y - 40, style)
    }
    this.scene.time.delayedCall(380, () => {
      this.dim.setVisible(false)
      this.dim.setAlpha(0)
    })
  }

  onAttackStart(fighter: Fighter): void {
    if (fighter.skillAnim.active) {
      return
    }
    const style = styleFor(fighter.def.id)
    const attack = fighter.attack?.data
    if (!attack) {
      return
    }
    this.trails.slash(fighter.x, fighter.y, fighter.facing, style.glow, style.trailType)
    if (attack.startup >= 10) {
      this.play('energy_charge', fighter.x, fighter.y - 40, style)
    }
    if (fighter.state === FighterState.ULTIMATE || attack.kind === AttackKind.ULTIMATE) {
      this.lines.burst(1.2)
      this.dim.setVisible(true)
      this.dim.setAlpha(0.18)
    }
  }

  onImpact(hit: SpectacleImpact): ImpactFeel {
    const style = styleFor((hit.attackerId as FighterIdValue) ?? 'rimuru')
    const feel = impactFeel(hit.power, hit.flash, hit.blocked, hit.perfect)
    const y = hit.y - 36
    if (hit.perfect) {
      vfxEngine.play(this.scene, 'ENERGY', hit.x, y, style.glow)
      return feel
    }
    const particle = PARTICLE[feel.tier]
    const variant = hit.combo % 4
    if (variant === 1) {
      vfxEngine.play(this.scene, 'LIGHT', hit.x + hit.facing * 20, y - 18, style.accent)
    } else if (variant === 2) {
      this.trails.slash(hit.x, hit.y, hit.facing, style.glow, style.trailType)
    } else if (variant === 3) {
      vfxEngine.play(this.scene, 'MAGIC', hit.x, y, style.glow)
    }
    vfxEngine.play(this.scene, particle, hit.x, y, style.glow)
    if (feel.tier === 'heavy' || feel.tier === 'extreme') {
      this.shockwave(hit.x, y, style.glow)
      this.dust(hit.x, hit.y)
    }
    if (feel.tier === 'extreme') {
      vfxEngine.playSheet(this.scene, 'ULTIMATE_IMPACT', hit.x, y, { tint: style.glow })
      vfxEngine.play(this.scene, 'EXPLOSION', hit.x, y, style.accent)
      this.lines.burst(1.1)
    }
    if (feel.zoom > 0) {
      this.zoomBoost = Math.max(this.zoomBoost, feel.zoom)
    }
    if (feel.flashMs > 0 && screenFxEnabled() && feel.tier !== 'light') {
      const c = feel.flashColor
      this.scene.cameras.main.flash(feel.flashMs, (c >> 16) & 255, (c >> 8) & 255, c & 255)
    }
    CameraImpactManager.fromFeel(this.scene.cameras.main, feel)
    if (saveManager.load().settings.vibration) {
      rumble(feel.tier === 'extreme' ? 90 : 32, feel.rumble)
    }
    return feel
  }

  traceProjectile(shot: Projectile, dt: number): void {
    if (!shot.activeShot) {
      return
    }
    this.projClock += dt
    if (this.projClock < 28) {
      return
    }
    this.projClock = 0
    const color = shot.owner ? styleFor(shot.owner.def.id).glow : 0x80d8ff
    const facing = shot.plan?.facing ?? (shot.vx >= 0 ? 1 : -1)
    if (shot.plan && (shot.shape === 'beam' || shot.shape === 'wave')) {
      const t = 0.15 + Math.random() * 0.7
      const px = shot.originX + facing * shot.currentLength * t
      this.trails.bolt(px, shot.originY, facing * 400, color)
      return
    }
    this.trails.bolt(shot.x, shot.y, shot.vx || facing * 400, color)
    this.haloPulse(shot.x, shot.y, color)
  }

  onProjectileEdge(shot: Projectile): void {
    const x = shot.endX
    const y = shot.originY || shot.y
    const color = shot.owner ? styleFor(shot.owner.def.id).glow : 0x80d8ff
    vfxEngine.play(this.scene, 'ENERGY', x, y, color)
    this.shockwave(x, y, color)
  }

  private haloPulse(x: number, y: number, color: number): void {
    this.ghosts.spawn({ x, y: y + 8, facing: 1, color }, 70)
  }

  onKnock(fighter: Fighter): void {
    const style = styleFor(fighter.def.id)
    this.ghosts.spawn(fighter.ghost(), 140)
    this.trails.slash(fighter.x, fighter.y, Math.sign(fighter.body.velocity.x) || fighter.facing, style.glow, 'straight')
  }

  onLand(fighter: Fighter): void {
    if (!motionOf(fighter.def.id).landingDust) {
      return
    }
    this.dust(fighter.x, fighter.y)
  }

  tick(dt: number): void {
    this.ghosts.tick(dt)
    this.trails.tick(dt)
    this.lines.tick(dt)
    this.auras.tick(this.scene.time.now)
    this.zoomBoost = Math.max(0, this.zoomBoost - dt * 0.00055)
    for (let i = this.rings.length - 1; i >= 0; i -= 1) {
      const ring = this.rings[i]
      if (!ring || !ring.active) {
        this.rings.splice(i, 1)
      }
    }
  }

  follow(cam: Phaser.Cameras.Scene2D.Camera, a: Fighter, b: Fighter, vx: number): void {
    followFighters(cam, a.x, b.x, vx, 0, {
      zoomBoost: this.zoomBoost,
      y1: a.y,
      y2: b.y,
    })
  }

  syncAura(fighter: Fighter): void {
    this.auras.sync(fighter)
  }

  chargeDim(on: boolean): void {
    this.dim.setVisible(on)
    this.dim.setAlpha(on ? 0.14 : 0)
  }

  clear(): void {
    this.ghosts.clear()
    this.trails.clear()
    this.lines.clear()
    this.auras.clear()
    this.zoomBoost = 0
    this.dim.setVisible(false)
    this.rings.forEach((r) => r.destroy())
    this.rings.length = 0
  }

  destroy(): void {
    this.clear()
    this.ghosts.destroy()
    this.trails.destroy()
    this.lines.destroy()
    this.auras.destroy()
    this.dim.destroy()
  }

  private shockwave(x: number, y: number, color: number): void {
    if (!screenFxEnabled()) {
      return
    }
    const ring = this.scene.add.circle(x, y, 16, color, 0)
    ring.setStrokeStyle(5, color, 0.75)
    ring.setDepth(FxLayer.IMPACT)
    this.rings.push(ring)
    this.scene.tweens.add({
      targets: ring,
      scale: 5.5,
      alpha: 0,
      duration: 280,
      ease: 'Cubic.Out',
      onComplete: () => {
        ring.destroy()
        const idx = this.rings.indexOf(ring)
        if (idx >= 0) {
          this.rings.splice(idx, 1)
        }
      },
    })
  }

  private dust(x: number, y: number): void {
    if (!screenFxEnabled()) {
      return
    }
    const qty = Math.min(8, vfxBudget())
    const emitter = this.scene.add.particles(x, y + 48, AssetKeys.particle, {
      speed: { min: 30, max: 90 },
      angle: { min: 240, max: 300 },
      scale: { start: 0.4, end: 0 },
      lifespan: 320,
      tint: 0xcbb99a,
      emitting: false,
    })
    emitter.setDepth(FxLayer.PARTICLES)
    emitter.explode(qty)
    this.scene.time.delayedCall(400, () => {
      if (emitter.active) {
        emitter.destroy()
      }
    })
  }
}
