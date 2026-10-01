import Phaser from 'phaser'
import { FighterState } from '../combat/FighterState.ts'
import type { Fighter } from '../characters/Fighter.ts'
import { FxLayer } from './FxLayers.ts'
import { styleFor } from './CombatStyle.ts'
import { screenFxEnabled } from '../effects/ScreenFx.ts'

export type AuraLevel = 'off' | 'idle' | 'charging' | 'power' | 'max' | 'transform'

const AURA_LOOK: Record<Exclude<AuraLevel, 'off'>, { alpha: number; scale: number; pulse: number }> = {
  idle: { alpha: 0.14, scale: 1, pulse: 0.04 },
  charging: { alpha: 0.28, scale: 1.12, pulse: 0.08 },
  power: { alpha: 0.32, scale: 1.18, pulse: 0.07 },
  max: { alpha: 0.42, scale: 1.38, pulse: 0.12 },
  transform: { alpha: 0.38, scale: 1.28, pulse: 0.1 },
}

interface AuraSlot {
  inner: Phaser.GameObjects.Ellipse
  outer: Phaser.GameObjects.Ellipse
  level: AuraLevel
}

export function auraLevelFor(fighter: {
  alive: boolean
  hp: number
  energy: number
  def: { maxHp: number; maxEnergy: number }
  state: string
  transform: { active: boolean; remaining?: number }
  attack: { frame: number; data: { startup: number } } | null
}): AuraLevel {
  if (!fighter.alive) {
    return 'off'
  }
  if (fighter.state === FighterState.ULTIMATE) {
    return 'max'
  }
  const charging =
    Boolean(fighter.attack) &&
    (fighter.state === FighterState.SKILL || fighter.state === FighterState.ULTIMATE) &&
    (fighter.attack?.frame ?? 0) < (fighter.attack?.data.startup ?? 0)
  if (fighter.transform.active && charging) {
    return 'transform'
  }
  if (charging) {
    return 'charging'
  }
  if (fighter.transform.active && (fighter.transform.remaining ?? 0) > 4200) {
    return 'power'
  }
  if (fighter.hp / fighter.def.maxHp < 0.25) {
    return 'idle'
  }
  return 'off'
}

/** Layered body aura. Stays behind the fighter so the silhouette stays readable. */
export class AuraField {
  private readonly slots = new Map<number, AuraSlot>()
  private readonly scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  sync(fighter: Fighter): void {
    const level = auraLevelFor(fighter)
    let slot = this.slots.get(fighter.side)
    if (level === 'off' || !screenFxEnabled()) {
      if (slot) {
        slot.inner.setVisible(false)
        slot.outer.setVisible(false)
        slot.level = 'off'
      }
      return
    }
    if (!slot) {
      slot = this.createSlot()
      this.slots.set(fighter.side, slot)
    }
    const style = styleFor(fighter.def.id)
    const look = AURA_LOOK[level]
    slot.level = level
    slot.inner.setFillStyle(style.glow, 1)
    slot.outer.setStrokeStyle(4, style.accent, 0.55)
    slot.inner.setPosition(fighter.x, fighter.y - 28)
    slot.outer.setPosition(fighter.x, fighter.y - 28)
    slot.inner.setVisible(true)
    slot.outer.setVisible(true)
    slot.inner.setAlpha(look.alpha)
    slot.outer.setAlpha(look.alpha * 0.7)
    slot.inner.setScale(look.scale)
    slot.outer.setScale(look.scale * 1.25)
  }

  tick(timeMs: number): void {
    for (const slot of this.slots.values()) {
      if (slot.level === 'off' || !slot.inner.visible) {
        continue
      }
      const look = AURA_LOOK[slot.level]
      const wave = 1 + Math.sin(timeMs / 90) * look.pulse
      slot.inner.setScale(look.scale * wave)
      slot.outer.setScale(look.scale * 1.25 * (2 - wave))
    }
  }

  clear(): void {
    for (const slot of this.slots.values()) {
      slot.inner.setVisible(false)
      slot.outer.setVisible(false)
      slot.level = 'off'
    }
  }

  destroy(): void {
    for (const slot of this.slots.values()) {
      slot.inner.destroy()
      slot.outer.destroy()
    }
    this.slots.clear()
  }

  private createSlot(): AuraSlot {
    const inner = this.scene.add.ellipse(0, 0, 70, 128, 0xffffff, 0.2)
    const outer = this.scene.add.ellipse(0, 0, 96, 168, 0xffffff, 0)
    inner.setDepth(FxLayer.AURA).setBlendMode(Phaser.BlendModes.ADD).setVisible(false)
    outer.setDepth(FxLayer.AURA).setBlendMode(Phaser.BlendModes.ADD).setVisible(false)
    outer.setStrokeStyle(4, 0xffffff, 0.4)
    return { inner, outer, level: 'off' }
  }
}
