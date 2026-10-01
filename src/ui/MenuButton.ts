import type Phaser from 'phaser'
import { FONT_UI } from './theme.ts'

export type MenuButtonKind = 'primary' | 'secondary'

export interface MenuButtonOptions {
  width?: number
  height?: number
  kind?: MenuButtonKind
  locked?: boolean
}

type VisualState = 'normal' | 'hover' | 'selected' | 'locked'

const FILL: Record<VisualState, number> = {
  normal: 0x0a1420,
  hover: 0x12283a,
  selected: 0x163648,
  locked: 0x0a0e14,
}

const EDGE: Record<VisualState, number> = {
  normal: 0x4aa8c4,
  hover: 0x7ec8e8,
  selected: 0xb8f0ff,
  locked: 0x3a4a58,
}

const EDGE_A: Record<VisualState, number> = {
  normal: 0.42,
  hover: 0.88,
  selected: 1,
  locked: 0.22,
}

export class MenuButton {
  readonly container: Phaser.GameObjects.Container
  private readonly scene: Phaser.Scene
  private readonly width: number
  private readonly height: number
  private readonly cut: number
  private readonly kind: MenuButtonKind
  private readonly onClick: () => void
  private readonly plate: Phaser.GameObjects.Graphics
  private readonly halo: Phaser.GameObjects.Graphics
  private readonly energy: Phaser.GameObjects.Graphics
  private readonly hit: Phaser.GameObjects.Rectangle
  private readonly label: Phaser.GameObjects.Text
  private readonly gem: Phaser.GameObjects.Polygon
  private readonly sparks: Phaser.GameObjects.Arc[] = []
  private selected = false
  private hovered = false
  private locked = false
  private energyT = 0
  private energyTween?: Phaser.Tweens.Tween

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    onClick: () => void,
    options: MenuButtonOptions = {},
  ) {
    this.scene = scene
    this.onClick = onClick
    this.width = options.width ?? 420
    this.height = options.height ?? 64
    this.cut = Math.max(8, Math.round(this.height * 0.22))
    this.kind = options.kind ?? 'secondary'
    this.locked = options.locked ?? false

    this.halo = scene.add.graphics()
    this.plate = scene.add.graphics()
    this.energy = scene.add.graphics()
    this.hit = scene.add.rectangle(0, 0, this.width, this.height, 0x000000, 0.001)
    this.gem = scene.add.polygon(-this.width / 2 + 28, 0, [0, -5, 5, 0, 0, 5, -5, 0], 0x7ec8ff, 0.85)
    this.gem.setVisible(this.kind === 'primary')
    this.label = scene.add.text(this.kind === 'primary' ? 8 : 0, 0, text.toUpperCase(), {
      fontFamily: FONT_UI,
      fontSize: `${Math.max(18, Math.round(this.height * 0.38))}px`,
      color: '#eaf6ff',
      fontStyle: 'bold',
    }).setOrigin(0.5)
    if ('setLetterSpacing' in this.label) {
      (this.label as Phaser.GameObjects.Text & { setLetterSpacing: (n: number) => void }).setLetterSpacing(4)
    }

    for (let i = 0; i < 5; i += 1) {
      const spark = scene.add.circle(0, 0, 1.6, 0xa8e6ff, 0)
      this.sparks.push(spark)
    }

    this.container = scene.add.container(x, y, [
      this.halo, this.plate, this.energy, this.hit, this.gem, this.label, ...this.sparks,
    ])
    this.container.setSize(this.width, this.height)
    this.hit.setInteractive({ useHandCursor: !this.locked })
    this.hit.on('pointerover', () => {
      if (this.locked) {
        return
      }
      this.hovered = true
      this.paint()
    })
    this.hit.on('pointerout', () => {
      this.hovered = false
      this.paint()
    })
    this.hit.on('pointerup', () => {
      if (this.locked) {
        return
      }
      this.playSelectPulse()
      this.onClick()
    })
    this.paint()
  }

  setSelected(value: boolean): void {
    const rose = value && !this.selected
    this.selected = value
    this.paint()
    if (rose && !this.locked) {
      this.playSelectPulse()
    }
  }

  get isSelected(): boolean {
    return this.selected
  }

  setLocked(value: boolean): void {
    this.locked = value
    if (this.hit.input) {
      this.hit.input.cursor = value ? 'default' : 'pointer'
    }
    this.paint()
  }

  setText(text: string): void {
    this.label.setText(text.toUpperCase())
  }

  activate(): void {
    if (this.locked) {
      return
    }
    this.playSelectPulse()
    this.onClick()
  }

  destroy(): void {
    this.energyTween?.stop()
    this.container.destroy()
  }

  private state(): VisualState {
    if (this.locked) {
      return 'locked'
    }
    if (this.selected) {
      return 'selected'
    }
    if (this.hovered) {
      return 'hover'
    }
    return 'normal'
  }

  private paint(): void {
    const state = this.state()
    const w = this.width
    const h = this.height
    const cut = this.cut
    this.halo.clear()
    this.plate.clear()
    if (state === 'selected' || state === 'hover') {
      this.halo.fillStyle(state === 'selected' ? 0x4fd4ff : 0x2a8bb0, state === 'selected' ? 0.14 : 0.07)
      this.drawBevel(this.halo, w + 14, h + 12, cut + 2)
    }
    this.plate.fillStyle(FILL[state], 0.96)
    this.drawBevel(this.plate, w, h, cut)
    this.plate.lineStyle(2, EDGE[state], EDGE_A[state])
    this.drawBevel(this.plate, w, h, cut, true)
    this.plate.lineStyle(1, EDGE[state], EDGE_A[state] * 0.45)
    this.drawBevel(this.plate, w - 8, h - 8, Math.max(4, cut - 3), true)
    this.drawRuneTicks(state)
    if (this.kind === 'primary' && state !== 'locked') {
      this.drawGoldTicks()
    }
    this.label.setColor(state === 'locked' ? '#6a7a88' : state === 'selected' ? '#ffffff' : '#e8f4ff')
    this.gem.setFillStyle(state === 'locked' ? 0x4a5a66 : 0x7ec8ff, state === 'locked' ? 0.25 : 0.9)
    this.sparks.forEach((spark, i) => {
      const live = state === 'hover' || state === 'selected'
      spark.setAlpha(live ? (state === 'selected' ? 0.55 : 0.28) : 0)
      if (live) {
        const t = (i / this.sparks.length) * Math.PI * 2
        spark.setPosition(Math.cos(t) * (w * 0.42), Math.sin(t) * (h * 0.38))
      }
    })
    this.drawEnergy()
  }

  private drawBevel(
    g: Phaser.GameObjects.Graphics,
    w: number,
    h: number,
    cut: number,
    strokeOnly = false,
  ): void {
    const l = -w / 2
    const t = -h / 2
    const r = w / 2
    const b = h / 2
    const c = Math.min(cut, w / 4, h / 2)
    g.beginPath()
    g.moveTo(l + c, t)
    g.lineTo(r - c, t)
    g.lineTo(r, t + c)
    g.lineTo(r, b - c)
    g.lineTo(r - c, b)
    g.lineTo(l + c, b)
    g.lineTo(l, b - c)
    g.lineTo(l, t + c)
    g.closePath()
    if (strokeOnly) {
      g.strokePath()
    } else {
      g.fillPath()
    }
  }

  private drawRuneTicks(state: VisualState): void {
    if (state === 'locked') {
      return
    }
    const y = this.height / 2 - 7
    this.plate.lineStyle(1, EDGE[state], 0.18)
    for (let i = -3; i <= 3; i += 1) {
      const x = i * 22
      this.plate.beginPath()
      this.plate.moveTo(x - 5, y)
      this.plate.lineTo(x, y + 3)
      this.plate.lineTo(x + 5, y)
      this.plate.strokePath()
    }
  }

  private drawGoldTicks(): void {
    const w = this.width / 2 - 10
    const h = this.height / 2 - 8
    this.plate.lineStyle(1.5, 0xd4b45a, 0.85)
    this.plate.beginPath()
    this.plate.moveTo(-w, -h + 8)
    this.plate.lineTo(-w, -h)
    this.plate.lineTo(-w + 10, -h)
    this.plate.strokePath()
    this.plate.beginPath()
    this.plate.moveTo(w, h - 8)
    this.plate.lineTo(w, h)
    this.plate.lineTo(w - 10, h)
    this.plate.strokePath()
  }

  private playSelectPulse(): void {
    this.energyTween?.stop()
    this.energyT = 0
    this.energyTween = this.scene.tweens.add({
      targets: this,
      energyT: 1,
      duration: 280,
      ease: 'Cubic.Out',
      onUpdate: () => this.drawEnergy(),
      onComplete: () => {
        this.energyT = this.selected ? 1 : 0
        this.drawEnergy()
      },
    })
    this.sparks.forEach((spark, i) => {
      this.scene.tweens.add({
        targets: spark,
        alpha: { from: 0.9, to: this.selected || this.hovered ? 0.35 : 0 },
        scale: { from: 1.6, to: 0.4 },
        duration: 320,
        delay: i * 24,
      })
    })
  }

  private drawEnergy(): void {
    this.energy.clear()
    if (this.energyT <= 0.01 || this.locked) {
      return
    }
    const pts = this.perimeter(this.width - 2, this.height - 2, this.cut)
    const count = pts.length
    const head = Math.floor(this.energyT * (count - 1))
    const tail = Math.max(0, head - 18)
    this.energy.lineStyle(2, 0xc8f6ff, 0.95)
    this.energy.beginPath()
    this.energy.moveTo(pts[tail]![0], pts[tail]![1])
    for (let i = tail + 1; i <= head; i += 1) {
      this.energy.lineTo(pts[i]![0], pts[i]![1])
    }
    this.energy.strokePath()
    const tip = pts[head]
    if (tip) {
      this.energy.fillStyle(0xe8ffff, 0.9)
      this.energy.fillCircle(tip[0], tip[1], 2.4)
    }
  }

  private perimeter(w: number, h: number, cut: number): Array<[number, number]> {
    const l = -w / 2
    const t = -h / 2
    const r = w / 2
    const b = h / 2
    const c = Math.min(cut, w / 4, h / 2)
    const corners: Array<[number, number]> = [
      [l + c, t], [r - c, t], [r, t + c], [r, b - c],
      [r - c, b], [l + c, b], [l, b - c], [l, t + c], [l + c, t],
    ]
    const pts: Array<[number, number]> = []
    for (let i = 0; i < corners.length - 1; i += 1) {
      const a = corners[i]!
      const d = corners[i + 1]!
      const steps = 10
      for (let s = 0; s < steps; s += 1) {
        const u = s / steps
        pts.push([a[0] + (d[0] - a[0]) * u, a[1] + (d[1] - a[1]) * u])
      }
    }
    return pts
  }
}
