import Phaser from 'phaser'
import { FighterState, type FighterStateId } from '../combat/FighterState.ts'
import type { SkinBody } from '../config/characterSkins.ts'
import type { FighterIdValue } from '../types/game.ts'
import { createSpriteAnims, findLoadedFighterTexture, getSpriteManifest, hasSpriteSheet } from '../sprites/SpriteLoader.ts'
import type { GhostSpawn } from '../vfx/AfterimagePool.ts'
import {
  LOOPING_CLIPS,
  STATE_TO_CLIP,
  spriteAnimKey,
  spriteFrameKey,
  spritePackKey,
  spriteSheetKey,
  type ActionClip,
} from '../sprites/SpriteManifest.ts'
import { motionOf, idleVariant } from '../combat/feel/MotionProfile.ts'
import { ensureSlimeTextures, SLIME_BODY_KEY } from './slimeLook.ts'
import type { SkillPlayback } from '../combat/anim/types.ts'

export class FighterView2D {
  readonly root: Phaser.GameObjects.Container
  private readonly procedural: Array<Phaser.GameObjects.Shape>
  private sprite: Phaser.GameObjects.Sprite | null = null
  private folderArt = false
  private readonly hair: Phaser.GameObjects.Ellipse
  private readonly head: Phaser.GameObjects.Ellipse
  private readonly eye: Phaser.GameObjects.Rectangle
  private readonly torso: Phaser.GameObjects.Rectangle
  private readonly arm: Phaser.GameObjects.Rectangle
  private readonly legL: Phaser.GameObjects.Rectangle
  private readonly legR: Phaser.GameObjects.Rectangle
  private readonly outline: Phaser.GameObjects.Rectangle
  private readonly color: number
  private readonly accent: number
  private readonly fighterId: FighterIdValue
  private baseScale = 1
  private readonly bodyStyle: SkinBody
  private readonly sceneRef: Phaser.Scene
  private slimeParts: Phaser.GameObjects.GameObject[] = []
  private slimeBody!: Phaser.GameObjects.Image
  private slimeScale = 1
  private lastClip = ''
  private lastState: FighterStateId | '' = ''
  private skillPlayback: SkillPlayback | null = null

  constructor(
    scene: Phaser.Scene,
    fighterId: FighterIdValue,
    color: number,
    accent: number,
    bodyStyle: SkinBody = 'sprite',
  ) {
    this.fighterId = fighterId
    this.color = color
    this.accent = accent
    this.bodyStyle = bodyStyle
    this.sceneRef = scene
    this.outline = scene.add.rectangle(0, 4, 78, 148, 0x071018, 0.55)
    this.legL = scene.add.rectangle(-12, 52, 16, 44, color, 1)
    this.legR = scene.add.rectangle(12, 52, 16, 44, color, 1)
    this.torso = scene.add.rectangle(0, 8, 48, 62, color, 1)
    this.arm = scene.add.rectangle(28, 4, 14, 46, color, 1)
    this.head = scene.add.ellipse(0, -48, 42, 42, 0xffe0c8, 1)
    this.hair = scene.add.ellipse(-4, -62, 52, 36, accent, 1)
    this.eye = scene.add.rectangle(8, -50, 10, 8, 0x111827, 1)
    this.procedural = [this.outline, this.legL, this.legR, this.torso, this.arm, this.hair, this.head, this.eye]

    if (bodyStyle === 'slime') {
      this.createSlimeParts(scene)
      this.setProceduralVisible(false)
    } else {
      this.bindSprite()
    }

    this.root = scene.add.container(0, 0, [
      ...this.procedural,
      ...this.slimeParts,
      ...(this.sprite ? [this.sprite] : []),
    ])
  }

  setSkillPlayback(playback: SkillPlayback | null): void {
    if (!playback) {
      this.skillPlayback = null
      this.lastClip = ''
      this.lastState = ''
      return
    }
    this.skillPlayback = playback
  }

  pose(state: FighterStateId, timeMs: number, flash: boolean, transformed: boolean, dead: boolean): void {
    if (this.bodyStyle === 'slime') {
      this.poseSlime(state, timeMs, flash, transformed, dead)
      return
    }
    if (!this.sprite) {
      this.bindSprite()
    }
    if (this.sprite && this.folderArt) {
      this.poseHybrid(state, timeMs, flash, transformed, dead)
      return
    }
    if (this.sprite) {
      this.playClip(state, dead)
      this.sprite.setTint(flash ? 0xffffff : transformed ? 0xffe082 : 0xffffff)
      this.sprite.setAlpha(dead ? 0.7 : 1)
      this.applyMotionFeel(state, timeMs)
      return
    }
    this.poseProcedural(state, timeMs, flash, transformed, dead)
  }

  setFacing(facing: number): void {
    this.root.setScale(facing, 1)
  }

  setVisible(visible: boolean): void {
    this.root.setVisible(visible)
  }

  ghost(x: number, y: number, facing: number, color: number): GhostSpawn {
    if (this.bodyStyle === 'slime' && this.slimeBody?.texture) {
      return {
        x,
        y,
        facing,
        color,
        texture: this.slimeBody.texture.key,
        frame: this.slimeBody.frame.name,
        scale: this.slimeBody.scaleX,
        originX: this.slimeBody.originX,
        originY: this.slimeBody.originY,
      }
    }
    if (this.sprite && this.sprite.visible && this.sprite.texture) {
      return {
        x,
        y,
        facing,
        color,
        texture: this.sprite.texture.key,
        frame: this.sprite.frame.name,
        scale: this.sprite.scaleX,
        originX: this.sprite.originX,
        originY: this.sprite.originY,
      }
    }
    return { x, y, facing, color }
  }

  private playResolvedClip(key: string, looping: boolean): void {
    if (!this.sprite) {
      return
    }
    const skillKey = this.skillPlayback?.clipKey
      ? spriteAnimKey(this.fighterId, this.skillPlayback.clipKey)
      : ''
    if (skillKey && key === skillKey && this.skillPlayback) {
      const anim = this.sprite.scene.anims.get(key)
      const count = Math.max(1, anim?.frames.length ?? 1)
      const durationSec = Math.max(1, this.skillPlayback.durationFrames) / 60
      try {
        this.sprite.play({ key, frameRate: count / durationSec, repeat: 0 })
      } catch (error) {
        console.warn('[sprite anim]', key, error)
      }
      return
    }
    try {
      this.sprite.play(key, looping)
    } catch (error) {
      console.warn('[sprite anim]', key, error)
    }
  }

  private bindSprite(): void {
    if (this.sprite || this.bodyStyle !== 'sprite') {
      return
    }
    const scene = this.sceneRef
    const man = getSpriteManifest(this.fighterId)
    const sheet = spriteSheetKey(this.fighterId)
    const first = findLoadedFighterTexture(scene, this.fighterId)
    if (first) {
      createSpriteAnims(scene)
      this.sprite = scene.add.sprite(0, 66, first.key, first.frame)
      this.baseScale = man?.scale ?? this.fitScale(scene, this.fighterId, first)
      this.sprite.setOrigin(man?.originX ?? 0.5, man?.originY ?? 1)
      this.sprite.setScale(this.baseScale)
      this.folderArt = true
      this.setProceduralVisible(false)
      this.sprite.setVisible(true)
      this.root?.add(this.sprite)
      return
    }
    if (hasSpriteSheet(this.fighterId) && scene.textures.exists(sheet)) {
      this.sprite = scene.add.sprite(0, 20, sheet, 0)
      this.sprite.setOrigin(man?.originX ?? 0.5, man?.originY ?? 0.85)
      this.baseScale = man?.scale ?? 1.5
      this.sprite.setScale(this.baseScale)
      this.folderArt = false
      this.setProceduralVisible(false)
      this.root?.add(this.sprite)
    }
  }

  private createSlimeParts(scene: Phaser.Scene): void {
    ensureSlimeTextures(scene, true)
    this.slimeBody = scene.add.image(0, 66, SLIME_BODY_KEY)
    this.slimeBody.setOrigin(0.5, 1)
    this.slimeBody.setDisplaySize(128, 128)
    this.slimeBody.setAlpha(0.92)
    this.slimeScale = this.slimeBody.scaleX
    this.slimeParts = [this.slimeBody]
  }

  private resolveClip(clip: string, anims: Phaser.Animations.AnimationManager): string | null {
    if (anims.exists(spriteAnimKey(this.fighterId, clip))) {
      return clip
    }
    if (clip === 'run' && anims.exists(spriteAnimKey(this.fighterId, 'walk'))) {
      return 'walk'
    }
    if (clip === 'skill' && this.skillPlayback?.clipKey) {
      return this.skillPlayback.clipKey
    }
    if (clip === 'ultimate' && this.skillPlayback?.clipKey) {
      return this.skillPlayback.clipKey
    }
    if ((clip === 'skill' || clip === 'ultimate') && this.skillPlayback) {
      if (anims.exists(spriteAnimKey(this.fighterId, 'idle'))) {
        return 'idle'
      }
      return null
    }
    if (clip === 'skill' && anims.exists(spriteAnimKey(this.fighterId, 'attack'))) {
      return 'attack'
    }
    if (clip === 'ultimate' && anims.exists(spriteAnimKey(this.fighterId, 'attack'))) {
      return 'attack'
    }
    if (anims.exists(spriteAnimKey(this.fighterId, 'idle'))) {
      return 'idle'
    }
    return null
  }

  private poseHybrid(
    state: FighterStateId,
    timeMs: number,
    flash: boolean,
    transformed: boolean,
    dead: boolean,
  ): void {
    if (!this.sprite) {
      this.poseProcedural(state, timeMs, flash, transformed, dead)
      return
    }
    const clipName = dead
      ? 'dead'
      : this.skillPlayback?.clipKey && (state === FighterState.SKILL || state === FighterState.ULTIMATE || state === FighterState.TRANSFORM)
        ? this.skillPlayback.clipKey
        : STATE_TO_CLIP[state]
    const resolved = this.resolveClip(clipName, this.sprite.scene.anims)
    this.setProceduralVisible(false)
    this.sprite.setVisible(true)
    this.sprite.setTint(flash ? 0xffffff : transformed ? 0xffe082 : 0xffffff)
    this.sprite.setAlpha(dead ? 0.7 : 1)
    this.applyMotionFeel(state, timeMs)
    if (!resolved) {
      this.lastState = state
      return
    }
    const key = spriteAnimKey(this.fighterId, resolved)
    const entered = this.lastState !== state || this.lastClip !== key
    this.lastState = state
    this.lastClip = key
    const looping = LOOPING_CLIPS.has(resolved)
    if (entered) {
      this.playResolvedClip(key, looping)
    }
  }

  /** Idle (pose debout) sert de reference : un get-up plus court ne doit pas etre agrandi. */
  private fitScale(
    scene: Phaser.Scene,
    id: FighterIdValue,
    fallback: { key: string, frame: string | number },
  ): number {
    const target = 168
    for (const clip of ['idle', 'walk', 'attack']) {
      const height = clipHeight(scene, id, clip)
      if (height > 0) {
        return target / height
      }
    }
    const frame = scene.textures.get(fallback.key).get(fallback.frame)
    return target / Math.max(1, frame.height)
  }

  private poseProcedural(
    state: FighterStateId,
    timeMs: number,
    flash: boolean,
    transformed: boolean,
    dead: boolean,
  ): void {
    const motion = motionOf(this.fighterId)
    const bob = state === FighterState.IDLE ? Math.sin(timeMs / 180) * motion.idleBreath : 0
    const walk = state === FighterState.WALK || state === FighterState.RUN ? Math.sin(timeMs / 90) : 0
    this.root.y = bob
    this.legL.rotation = walk * 0.35
    this.legR.rotation = -walk * 0.35
    this.arm.rotation = 0
    this.arm.x = 28
    this.arm.scaleX = 1
    this.arm.scaleY = 1
    this.torso.rotation = 0
    this.torso.scaleX = 1
    this.torso.scaleY = 1
    this.root.rotation = 0

    if (state === FighterState.ATTACK && !this.skillPlayback) {
      this.arm.rotation = -1.45
      this.arm.x = 52
      this.arm.scaleX = 1.45
      this.arm.scaleY = 0.85
      this.torso.rotation = 0.32
      this.torso.scaleX = 1.15
      this.legL.rotation = 0.35
      this.legR.rotation = -0.55
    } else if (this.skillPlayback && (state === FighterState.SKILL || state === FighterState.ULTIMATE || state === FighterState.TRANSFORM)) {
      this.arm.rotation = 0
      this.arm.x = 28
    } else if (state === FighterState.BLOCK) {
      this.arm.rotation = -0.9
      this.arm.x = 8
      this.arm.scaleX = 1
      this.arm.scaleY = 1
      this.torso.scaleX = 1
    } else if (state === FighterState.DASH) {
      this.torso.rotation = 0.55
      this.torso.scaleX = 1.35
      this.torso.scaleY = 0.78
      this.arm.rotation = 0.85
      this.arm.x = 44
      this.arm.scaleX = 1.5
      this.legL.rotation = 0.7
      this.legR.rotation = -0.4
    } else if (state === FighterState.JUMP || state === FighterState.FALL) {
      this.legL.rotation = -0.55
      this.legR.rotation = 0.4
      this.arm.rotation = -0.7
      this.arm.x = 22
      this.torso.rotation = -0.12
      this.torso.scaleX = 0.92
      this.torso.scaleY = 1.12
    } else if (state === FighterState.HIT || state === FighterState.STUN) {
      this.torso.rotation = -0.42
      this.torso.scaleX = 0.88
      this.torso.scaleY = 1.16
      this.arm.rotation = 1.05
      this.arm.x = 18
    } else if (state === FighterState.KNOCKDOWN || dead) {
      this.root.rotation = 1.2
      this.torso.scaleX = 1
      this.torso.scaleY = 1
    } else {
      this.arm.scaleX = 1
      this.arm.scaleY = 1
      this.torso.scaleX = 1
      this.torso.scaleY = 1
    }

    const fill = dead ? 0x334155 : flash ? 0xffffff : transformed ? 0xffe082 : this.color
    this.torso.setFillStyle(fill, 1)
    this.arm.setFillStyle(fill, 1)
    this.legL.setFillStyle(fill, 1)
    this.legR.setFillStyle(fill, 1)
    this.hair.setFillStyle(transformed ? 0xfff59d : this.accent, 1)
  }

  private poseSlime(
    state: FighterStateId,
    timeMs: number,
    flash: boolean,
    transformed: boolean,
    dead: boolean,
  ): void {
    if (this.sprite) {
      this.sprite.setVisible(false)
    }
    this.setProceduralVisible(false)
    this.slimeParts.forEach((part) => {
      if ('setVisible' in part) {
        (part as Phaser.GameObjects.Image).setVisible(true)
      }
    })
    const motion = motionOf(this.fighterId)
    const breath = Math.sin(timeMs / 220)
    const bob = state === FighterState.IDLE ? breath * (motion.idleBreath + 1.4) : 0
    this.root.y = bob
    this.root.rotation = dead || state === FighterState.KNOCKDOWN ? 1.05 : state === FighterState.IDLE ? breath * 0.04 : 0
    let sx = 1
    let sy = 1
    if (state === FighterState.IDLE) {
      sx = 1 + breath * 0.045
      sy = 1 - breath * 0.04
    } else if (state === FighterState.DASH) {
      sx = 1.32
      sy = 0.7
    } else if (state === FighterState.JUMP || state === FighterState.FALL) {
      sx = 0.78
      sy = 1.22
    } else if (this.skillPlayback && (state === FighterState.SKILL || state === FighterState.ULTIMATE || state === FighterState.TRANSFORM)) {
      sx = 1
      sy = 1
    } else if (state === FighterState.ATTACK || state === FighterState.SKILL || state === FighterState.ULTIMATE) {
      sx = 1.22
      sy = 0.82
    } else if (state === FighterState.HIT || state === FighterState.STUN) {
      sx = 0.86
      sy = 1.16
    } else if (state === FighterState.BLOCK) {
      sx = 0.9
      sy = 0.9
    }
    this.slimeBody.setScale(this.slimeScale * sx, this.slimeScale * sy)
    this.slimeBody.setTint(dead ? 0x607d8b : flash ? 0xffffff : transformed ? 0xffe082 : 0xffffff)
    this.slimeBody.setAlpha(dead ? 0.62 : 0.92)
  }

  playOneShot(clip: ActionClip): void {
    if (!this.sprite) {
      return
    }
    const resolved = this.resolveClip(clip, this.sprite.scene.anims)
    if (!resolved) {
      return
    }
    const key = spriteAnimKey(this.fighterId, resolved)
    this.lastClip = key
    this.lastState = ''
    this.playResolvedClip(key, false)
  }

  private applyMotionFeel(state: FighterStateId, timeMs: number): void {
    const motion = motionOf(this.fighterId)
    const variant = idleVariant(timeMs, motion.idleCycleMs)
    let smearX = 1
    let smearY = 1
    if (state === FighterState.DASH) {
      smearX = motion.smear
      smearY = Math.max(0.72, 2 - motion.smear)
    } else if (this.skillPlayback?.missing && (state === FighterState.SKILL || state === FighterState.ULTIMATE || state === FighterState.TRANSFORM)) {
      smearX = 1
      smearY = 1
    } else if (state === FighterState.ATTACK || state === FighterState.SKILL || state === FighterState.ULTIMATE || state === FighterState.TRANSFORM) {
      smearX = 1 + (motion.smear - 1) * 0.45
      smearY = 1 - (motion.smear - 1) * 0.28
    } else if (state === FighterState.HIT || state === FighterState.STUN) {
      smearX = 0.94
      smearY = 1.08
    }
    if (state === FighterState.IDLE) {
      const breath = Math.sin(timeMs / 220) * motion.idleBreath
      this.root.y = breath * 0.4
      smearY = 1 + breath * 0.004
      smearX = 1 - breath * 0.002
      this.root.rotation = variant === 1
        ? Math.sin(timeMs / 900) * 0.018
        : variant === 2
          ? Math.sin(timeMs / 1400) * -0.014
          : 0
    } else {
      this.root.y = 0
      this.root.rotation = 0
    }
    this.sprite?.setScale(this.baseScale * smearX, this.baseScale * smearY)
  }

  private setProceduralVisible(visible: boolean): void {
    this.procedural.forEach((obj) => {
      obj.setVisible(visible)
    })
  }

  private playClip(state: FighterStateId, dead: boolean): void {
    if (!this.sprite) {
      return
    }
    const clip = dead
      ? 'dead'
      : this.skillPlayback?.clipKey && (state === FighterState.SKILL || state === FighterState.ULTIMATE || state === FighterState.TRANSFORM)
        ? this.skillPlayback.clipKey
        : STATE_TO_CLIP[state]
    const wanted = spriteAnimKey(this.fighterId, clip)
    const idle = spriteAnimKey(this.fighterId, 'idle')
    const anims = this.sprite.scene.anims
    const key = anims.exists(wanted)
      ? wanted
      : this.skillPlayback && (state === FighterState.SKILL || state === FighterState.ULTIMATE || state === FighterState.TRANSFORM)
        ? (anims.exists(idle) ? idle : wanted)
        : anims.exists(wanted) ? wanted : idle
    if (key === this.lastClip) {
      return
    }
    this.lastClip = key
    if (anims.exists(key)) {
      this.sprite.play(key, LOOPING_CLIPS.has(clip) || key === idle)
    }
  }
}

function clipHeight(scene: Phaser.Scene, id: FighterIdValue, clip: string): number {
  const pack = spritePackKey(id, clip)
  if (scene.textures.exists(pack)) {
    return Math.max(0, scene.textures.get(pack).get(0).height)
  }
  const frame0 = spriteFrameKey(id, clip, 0)
  if (scene.textures.exists(frame0)) {
    return Math.max(0, scene.textures.get(frame0).get().height)
  }
  return 0
}
