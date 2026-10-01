import Phaser from 'phaser'
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../engine/Time.ts'
import { AssetKeys } from '../assets/AssetKeys.ts'
import { randomStage, stageById, stageKey, type StageDef } from './Stages.ts'
import { session } from './GameState.ts'

export function createArena(scene: Phaser.Scene): StageDef {
  const stage = resolveStage()
  if (stage && scene.textures.exists(stageKey(stage.id))) {
    createImageArena(scene, stage)
    return stage
  }
  createProceduralArena(scene)
  return stage ?? randomStage()
}

function resolveStage(): StageDef | undefined {
  if (session.stageId !== 'random') {
    const picked = stageById(session.stageId)
    if (picked) {
      return picked
    }
  }
  return randomStage()
}

function createImageArena(scene: Phaser.Scene, stage: StageDef): void {
  // surplus de 20% pour couvrir le dezoom max de la camera (zoom 0.86 -> ~1.17x visible).
  // Avec des bounds et un zoom < 1, Phaser ancre la vue en haut a gauche : le surplus
  // doit donc s'etendre vers la droite et le bas (span 0..W*1.2, 0..H*1.2).
  const bgW = LOGICAL_WIDTH * 1.2
  const bgH = LOGICAL_HEIGHT * 1.2
  const bg = scene.add.image(bgW / 2, bgH / 2, stageKey(stage.id))
  bg.setDisplaySize(bgW, bgH)
  bg.setDepth(-10)
  // legere vignette pour detacher les combattants du decor
  const vignette = scene.add.graphics().setDepth(-9)
  vignette.fillStyle(0x000000, 0.22)
  vignette.fillRect(0, 0, bgW, 70)
  vignette.fillStyle(0x000000, 0.3)
  vignette.fillRect(0, bgH - 60, bgW, 60)

  for (const ambient of stage.ambient) {
    scene.add.particles(ambient.x, ambient.y, AssetKeys.particle, {
      speedX: { min: -14, max: 14 },
      speedY: { min: ambient.drift - 8, max: ambient.drift + 8 },
      scale: { start: 0.22, end: 0 },
      lifespan: 2600,
      frequency: ambient.frequency,
      tint: ambient.tint,
      blendMode: 'ADD',
    }).setDepth(-8)
  }
}

function createProceduralArena(scene: Phaser.Scene): void {
  const g = scene.add.graphics()
  g.fillGradientStyle(0x08111f, 0x08111f, 0x1a2a4a, 0x24143a, 1)
  g.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT)
  g.fillStyle(0x7ec8ff, 0.08)
  g.fillCircle(420, 180, 220)
  g.fillStyle(0xff8ab3, 0.08)
  g.fillCircle(1500, 160, 260)
  g.fillStyle(0x0e1c2c, 1)
  g.fillRect(0, 920, LOGICAL_WIDTH, 160)
  g.fillStyle(0x16324a, 1)
  g.fillRect(0, 900, LOGICAL_WIDTH, 24)
  g.lineStyle(3, 0x4fc3f7, 0.35)
  g.strokeRect(40, 40, LOGICAL_WIDTH - 80, 860)
  g.fillStyle(0x12263a, 0.9)
  g.fillRoundedRect(80, 640, 90, 260, 8)
  g.fillRoundedRect(1750, 640, 90, 260, 8)
  g.fillStyle(0x4fc3f7, 0.25)
  g.fillCircle(960, 200, 18)

  scene.add.particles(200, 180, AssetKeys.particle, {
    speed: { min: 8, max: 24 },
    scale: { start: 0.25, end: 0 },
    lifespan: 2400,
    frequency: 80,
    tint: 0x90caf9,
    blendMode: 'ADD',
  })
  scene.add.particles(1700, 200, AssetKeys.particle, {
    speed: { min: 8, max: 24 },
    scale: { start: 0.25, end: 0 },
    lifespan: 2400,
    frequency: 90,
    tint: 0xf48fb1,
    blendMode: 'ADD',
  })
}

export function followFighters(
  camera: Phaser.Cameras.Scene2D.Camera,
  x1: number,
  x2: number,
  vx: number,
  shake: number,
  opts?: { zoomBoost?: number, y1?: number, y2?: number },
): void {
  const mid = (x1 + x2) / 2 + vx * 0.08
  const dist = Math.abs(x1 - x2)
  const zoom = Phaser.Math.Clamp(1.12 - dist / 2800 + (opts?.zoomBoost ?? 0), 0.86, 1.28)
  const targetX = Phaser.Math.Clamp(Phaser.Math.Linear(camera.midPoint.x, mid, 0.12), 420, 1500)
  const midY = opts?.y1 !== undefined && opts?.y2 !== undefined
    ? Phaser.Math.Clamp(Phaser.Math.Linear(540, (opts.y1 + opts.y2) / 2, 0.22), 380, 680)
    : 540
  camera.centerOn(targetX, midY)
  camera.setZoom(Phaser.Math.Linear(camera.zoom, zoom, 0.14))
  if (shake > 40) {
    camera.shake(120, Math.min(0.01, shake / 12000))
  }
}
