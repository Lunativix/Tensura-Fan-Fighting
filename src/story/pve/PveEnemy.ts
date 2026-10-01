import Phaser from 'phaser'
import { makeBox, type Hitbox } from '../../combat/Hitbox.ts'
import { PveProfile, type PveEnemyDef } from '../types.ts'
import { biteAttack } from './EnemyCatalog.ts'
import type { AttackData } from '../../combat/Attack.ts'

export class PveEnemy extends Phaser.GameObjects.Container {
  readonly def: PveEnemyDef
  hp: number
  facing = -1
  biteCd = 0
  biting = 0
  phase = 1
  phaseAnnounced = false
  declare body: Phaser.Physics.Arcade.Body
  private readonly bodyGfx: Phaser.GameObjects.Rectangle
  private readonly label: Phaser.GameObjects.Text

  constructor(scene: Phaser.Scene, x: number, y: number, def: PveEnemyDef) {
    super(scene, x, y)
    this.def = def
    this.hp = def.hp
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setSize(def.width, def.height)
    this.body.setCollideWorldBounds(true)
    this.body.setMaxVelocity(900, 1600)
    this.body.setDragX(1400)
    this.body.allowGravity = true
    this.bodyGfx = scene.add.rectangle(0, 0, def.width, def.height, def.tint, 0.95)
    this.bodyGfx.setStrokeStyle(2, 0x0a0a0a, 0.8)
    this.label = scene.add.text(0, -def.height * 0.7, def.name, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '14px',
      color: '#eaf6ff',
    }).setOrigin(0.5, 1)
    this.add([this.bodyGfx, this.label])
  }

  get alive(): boolean {
    return this.hp > 0
  }

  biteData(): AttackData {
    return biteAttack(this.def)
  }

  hurtbox(): Hitbox {
    return makeBox(this.x, this.y, this.facing, -this.def.width / 2, -this.def.height / 2, this.def.width, this.def.height)
  }

  strikeBox(): Hitbox | null {
    if (this.biting <= 0) {
      return null
    }
    return makeBox(this.x, this.y, this.facing, this.def.width * 0.15, -this.def.height * 0.35, this.def.width * 0.55, this.def.height * 0.8)
  }

  receive(damage: number, fromFacing: number): void {
    this.hp = Math.max(0, this.hp - damage)
    const boss = this.def.profile === PveProfile.BOSS
    this.body.setVelocity(fromFacing * (boss ? 70 : 280), boss ? -20 : -80)
    if (this.phase === 1 && this.hp <= this.def.hp * 0.45 && boss) {
      this.phase = 2
      this.label.setText(`${this.def.name}  II`)
    }
    this.bodyGfx.setFillStyle(0xffcdd2, 1)
    this.scene.time.delayedCall(80, () => {
      if (this.active) {
        this.bodyGfx.setFillStyle(this.def.tint, 0.95)
      }
    })
    if (this.hp <= 0) {
      this.setVisible(false)
      this.body.enable = false
    }
  }

  startBite(): void {
    if (this.biteCd > 0 || this.biting > 0) {
      return
    }
    const boss = this.def.profile === PveProfile.BOSS
    this.biting = boss ? 320 : 220
    this.biteCd = boss ? (this.phase >= 2 ? 1100 : 1800) : 1400
  }

  tick(dt: number): void {
    this.biteCd = Math.max(0, this.biteCd - dt)
    this.biting = Math.max(0, this.biting - dt)
    this.bodyGfx.setScale(this.biting > 0 ? 1.08 : 1)
  }
}
