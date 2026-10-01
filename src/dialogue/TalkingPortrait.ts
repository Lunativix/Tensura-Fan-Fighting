import type Phaser from 'phaser'
import { CHARACTERS } from '../config/characters.ts'
import { portraitArtKey, portraitHeadKey } from '../ui/portraits.ts'
import type { FighterIdValue } from '../types/game.ts'
import {
  DialogueEmotion,
  EyeState,
  MouthState,
  nextBlinkDelay,
  type DialogueEmotionId,
  type EyeStateId,
  type MouthStateId,
} from './DialogueTypes.ts'
import { ensureSlimeTextures, SLIME_BODY_KEY } from '../characters/slimeLook.ts'

const SIZE = 176

const FALLBACK_TINT: Record<string, number> = {
  satoru: 0x90caf9,
  'rimuru-slime': 0x4fc3f7,
  'great-sage': 0xffd54f,
}

export class TalkingPortrait {
  readonly root: Phaser.GameObjects.Container
  private readonly lids: Phaser.GameObjects.Rectangle
  private readonly mouthGfx: Phaser.GameObjects.Ellipse
  private readonly art: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle
  private readonly hasFaceArt: boolean
  private readonly jelly: boolean
  private readonly artBaseX: number
  private readonly artBaseY: number
  private readonly artScaleX: number
  private readonly artScaleY: number
  private eye: EyeStateId = EyeState.OPEN
  private eyeT = nextBlinkDelay()
  private mouthState: MouthStateId = MouthState.CLOSED
  private mouthHold = 0
  private clock = 0
  private emotion: DialogueEmotionId = DialogueEmotion.NORMAL
  private speaking = false
  private readonly baseY: number
  private readonly onBlink: (() => void) | undefined

  constructor(
    scene: Phaser.Scene,
    portraitKey: string | undefined,
    x: number,
    y: number,
    onBlink?: () => void,
  ) {
    const fighter = portraitKey && portraitKey in CHARACTERS
      ? CHARACTERS[portraitKey as FighterIdValue]
      : undefined
    const tint = fighter?.accent ?? FALLBACK_TINT[portraitKey ?? ''] ?? 0x4fc3f7
    const well = scene.add.rectangle(0, 0, SIZE + 10, SIZE + 10, 0x0a1420, 1)
    well.setStrokeStyle(3, 0xd4b45a, 1)
    const inner = scene.add.rectangle(0, 0, SIZE - 2, SIZE - 2, 0x122033, 1)
    inner.setStrokeStyle(1, 0x8a6a22, 0.9)

    this.art = this.makeArt(scene, portraitKey)
    this.hasFaceArt = this.art.type === 'Image'
    this.jelly = portraitKey === 'rimuru-slime'
    this.artBaseX = this.art.x
    this.artBaseY = this.art.y
    this.artScaleX = this.art.scaleX
    this.artScaleY = this.art.scaleY
    this.lids = scene.add.rectangle(0, -SIZE * 0.22, SIZE - 16, 0, 0x140c10, 0.92)
    this.lids.setOrigin(0.5, 0)
    this.mouthGfx = scene.add.ellipse(0, SIZE * 0.28, 28, 6, tint, 0.72)
    this.mouthGfx.setStrokeStyle(1, 0x1a1014, 0.5)
    this.applyMouth(MouthState.CLOSED)
    if (this.hasFaceArt) {
      this.lids.setVisible(false)
      this.mouthGfx.setVisible(false)
    }

    this.root = scene.add.container(x, y, [well, inner, this.art, this.lids, this.mouthGfx])
    this.root.setSize(SIZE + 12, SIZE + 12)
    this.baseY = y
    this.onBlink = onBlink
  }

  setEmotion(emotion: DialogueEmotionId): void {
    this.emotion = emotion
    const mul = emotion === DialogueEmotion.ANGRY ? 0xffc8c8
      : emotion === DialogueEmotion.SAD || emotion === DialogueEmotion.SCARED ? 0xc8d4e8
      : emotion === DialogueEmotion.HAPPY || emotion === DialogueEmotion.EXCITED ? 0xfff0c8
      : 0xffffff
    if ('setTint' in this.art) {
      (this.art as Phaser.GameObjects.Image).setTint(mul)
    }
  }

  speakPulse(): void {
    this.speaking = true
    if (this.hasFaceArt) {
      return
    }
    this.applyMouth(this.mouthHold > 0 && this.mouthState === MouthState.OPEN ? MouthState.HALF : MouthState.OPEN)
    this.mouthHold = 70 + Math.random() * 50
  }

  silence(): void {
    this.speaking = false
    this.mouthHold = 0
    this.applyMouth(MouthState.CLOSED)
  }

  tick(dt: number): void {
    this.clock += dt
    if (!this.hasFaceArt) {
      this.tickEyes(dt)
      this.tickMouth(dt)
    }
    this.tickIdle()
  }

  destroy(): void {
    this.root.destroy(true)
  }

  private tickIdle(): void {
    const angry = this.emotion === DialogueEmotion.ANGRY || this.emotion === DialogueEmotion.EXCITED
    const sad = this.emotion === DialogueEmotion.SAD
    const speed = angry ? 9 : sad ? 4.2 : 6.2
    const amp = angry ? 2.4 : sad ? 1.1 : 1.7
    const breath = Math.sin(this.clock / 1000 * speed)
    const squash = this.jelly ? 0.045 : 0.008
    this.root.setY(this.baseY + breath * amp * 0.15)
    this.art.setPosition(this.artBaseX, this.artBaseY + breath * amp * 0.35)
    this.art.setScale(this.artScaleX * (1 + breath * squash), this.artScaleY * (1 - breath * squash * 0.9))
    if (sad) {
      this.art.setAngle(-1.4)
    } else if (this.emotion === DialogueEmotion.SURPRISED) {
      this.art.setAngle(Math.sin(this.clock / 180) * 1.2)
    } else {
      this.art.setAngle(Math.sin(this.clock / 1400) * 0.8)
    }
  }

  private tickEyes(dt: number): void {
    this.eyeT -= dt
    if (this.eye === EyeState.OPEN && this.eyeT <= 0) {
      this.eye = EyeState.CLOSING
      this.eyeT = 45
      this.lids.height = 8
      this.onBlink?.()
    } else if (this.eye === EyeState.CLOSING && this.eyeT <= 0) {
      this.eye = EyeState.CLOSED
      this.eyeT = 55
      this.lids.height = 36
    } else if (this.eye === EyeState.CLOSED && this.eyeT <= 0) {
      this.eye = EyeState.OPENING
      this.eyeT = 40
      this.lids.height = 14
    } else if (this.eye === EyeState.OPENING && this.eyeT <= 0) {
      this.eye = EyeState.OPEN
      this.eyeT = nextBlinkDelay()
      this.lids.height = 0
    }
    this.lids.setDisplaySize(SIZE - 16, Math.max(0, this.lids.height))
  }

  private tickMouth(dt: number): void {
    if (!this.speaking) {
      return
    }
    if (this.mouthHold <= 0) {
      this.applyMouth(MouthState.CLOSED)
      return
    }
    this.mouthHold -= dt
    if (this.mouthHold <= 0) {
      this.applyMouth(MouthState.CLOSED)
    }
  }

  private applyMouth(state: MouthStateId): void {
    this.mouthState = state
    if (state === MouthState.CLOSED) {
      this.mouthGfx.setDisplaySize(26, 4)
      this.mouthGfx.setAlpha(0.45)
      return
    }
    if (state === MouthState.HALF) {
      this.mouthGfx.setDisplaySize(24, 10)
      this.mouthGfx.setAlpha(0.7)
      return
    }
    this.mouthGfx.setDisplaySize(22, 16)
    this.mouthGfx.setAlpha(0.82)
  }

  private makeArt(scene: Phaser.Scene, portraitKey: string | undefined): Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle {
    if (portraitKey === 'rimuru-slime') {
      ensureSlimeTextures(scene, true)
      const img = scene.add.image(0, 10, SLIME_BODY_KEY)
      img.setDisplaySize(SIZE - 20, SIZE - 20)
      return img
    }
    if (portraitKey) {
      const keys = [portraitHeadKey(portraitKey), portraitArtKey(portraitKey)]
      for (const key of keys) {
        if (scene.textures.exists(key)) {
          const img = scene.add.image(0, 0, key)
          img.setDisplaySize(SIZE - 8, SIZE - 8)
          return img
        }
      }
    }
    const fallback = scene.add.rectangle(0, 0, SIZE - 16, SIZE - 16, 0x1a3a58, 1)
    fallback.setStrokeStyle(1, 0x7ec8ff, 0.8)
    return fallback
  }
}
