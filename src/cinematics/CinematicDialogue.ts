import type Phaser from 'phaser'
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../engine/Time.ts'
import { FONT, FONT_UI, UI } from '../ui/theme.ts'
import type { FighterIdValue } from '../types/game.ts'
import { TalkingPortrait } from '../dialogue/TalkingPortrait.ts'
import {
  DialogueEvent,
  inferEmotion,
  type DialogueEmotionId,
  type DialogueEntry,
  type DialogueEventId,
  type DialogueListener,
} from '../dialogue/DialogueTypes.ts'
import { dialogueVoice } from '../audio/DialogueVoice.ts'
import { DIALOGUE_ADVANCE_HINT } from '../input/DialogueAdvance.ts'

export interface DialogueShowOpts {
  speaker: string
  text: string
  portrait?: string
  speakerId?: FighterIdValue
  duration?: number
  instant?: boolean
  cps?: number
  side?: 'left' | 'right'
  emotion?: DialogueEmotionId
  /** Action / scene description. No name plate, no voice. */
  kind?: 'dialogue' | 'narration'
}

const BOX_W = 1240
const BOX_H = 236
const PORTRAIT_X = 118
const TEXT_X = 250

export class CinematicDialogue {
  private root: Phaser.GameObjects.Container | null = null
  private portrait: TalkingPortrait | null = null
  private body: Phaser.GameObjects.Text | null = null
  private hint: Phaser.GameObjects.Text | null = null
  private typed = ''
  private full = ''
  private cps = 38
  private elapsed = 0
  private hold = 0
  private autoMs = 0
  private fast = false
  private entry: DialogueEntry | null = null
  private listeners: DialogueListener[] = []
  private readonly scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  on(listener: DialogueListener): void {
    this.listeners.push(listener)
  }

  get visible(): boolean {
    return this.root !== null
  }

  get typing(): boolean {
    return this.root !== null && this.typed.length < this.full.length
  }

  show(opts: DialogueShowOpts): void {
    const prevSpeaker = this.entry?.speakerId
    this.hide()
    const narration = opts.kind === 'narration'
    const bodyText = narration ? wrapNarration(opts.text) : opts.text
    const emotion = opts.emotion ?? inferEmotion(opts.text)
    this.entry = {
      speaker: opts.speaker,
      speakerId: opts.speakerId,
      text: bodyText,
      emotion,
      expression: emotion,
      textSpeed: opts.cps,
      voiceProfile: narration ? undefined : opts.speakerId,
      animation: emotion,
      soundProfile: !narration && opts.speakerId ? `talk-${opts.speakerId}` : undefined,
      side: opts.side,
      duration: opts.duration,
      instant: opts.instant,
      portrait: opts.portrait,
    }
    this.full = bodyText
    this.typed = opts.instant ? bodyText : ''
    this.cps = opts.cps ?? 36
    this.elapsed = 0
    this.hold = 0
    this.fast = false
    this.autoMs = opts.duration ?? Math.max(1600, bodyText.length * 58 + 800)

    const boxX = (LOGICAL_WIDTH - BOX_W) / 2
    const boxY = LOGICAL_HEIGHT - BOX_H - 36
    const panel = this.drawFrame(BOX_W / 2, BOX_H / 2)
    const textX = narration ? 48 : TEXT_X
    if (!narration) {
      this.portrait = new TalkingPortrait(this.scene, opts.portrait ?? opts.speakerId, PORTRAIT_X, BOX_H / 2 - 8, () => {
        this.emit(DialogueEvent.BLINK)
      })
      this.portrait.setEmotion(emotion)
    }
    const name = this.scene.add.text(PORTRAIT_X, BOX_H - 28, narration ? '' : opts.speaker.toUpperCase(), {
      fontFamily: FONT,
      fontSize: '18px',
      color: UI.gold,
    }).setOrigin(0.5, 1).setVisible(!narration)
    this.body = this.scene.add.text(textX, 42, this.typed, {
      fontFamily: FONT_UI,
      fontSize: '26px',
      color: narration ? '#c9b896' : '#f4f1e4',
      fontStyle: narration ? 'italic' : 'normal',
      wordWrap: { width: BOX_W - textX - 48 },
      lineSpacing: 8,
    }).setOrigin(0, 0)
    this.hint = this.scene.add.text(BOX_W - 36, BOX_H - 22, DIALOGUE_ADVANCE_HINT, {
      fontFamily: FONT_UI,
      fontSize: '16px',
      color: UI.gold,
    }).setOrigin(1, 1).setAlpha(0)

    const kids: Phaser.GameObjects.GameObject[] = [panel]
    if (this.portrait) {
      kids.push(this.portrait.root)
    }
    kids.push(name, this.body, this.hint)
    this.root = this.scene.add.container(boxX, boxY, kids)
    this.root.setScrollFactor(0).setDepth(76).setAlpha(0)
    this.scene.tweens.add({ targets: this.root, alpha: 1, duration: 180, ease: 'Sine.Out' })

    this.emit(DialogueEvent.START)
    if (!narration && prevSpeaker && prevSpeaker !== opts.speakerId) {
      this.emit(DialogueEvent.SPEAKER_CHANGE)
    }
    this.emit(DialogueEvent.EXPRESSION_CHANGE)
    this.emit(DialogueEvent.TEXT_START)
    if (!narration && opts.speakerId) {
      dialogueVoice.begin(opts.speakerId, emotion)
      this.emit(DialogueEvent.TALK_START)
      this.emit(DialogueEvent.VOICE_START)
    }
    if (opts.instant) {
      this.finishText()
    }
  }

  setFast(value: boolean): void {
    this.fast = value
    dialogueVoice.setFast(value)
  }

  tick(realDt: number): void {
    if (!this.root) {
      return
    }
    this.portrait?.tick(realDt)
    if (this.hint) {
      this.hint.setAlpha(0.55 + Math.sin(this.scene.time.now / 280) * 0.35)
    }
    if (this.typed.length < this.full.length) {
      const speed = this.fast ? this.cps * 3.6 : this.cps
      this.elapsed += realDt
      const chars = Math.floor((this.elapsed / 1000) * speed)
      const next = this.full.slice(0, Math.max(this.typed.length, chars))
      if (next !== this.typed) {
        const added = next.slice(this.typed.length)
        this.typed = next
        this.body?.setText(this.typed)
        dialogueVoice.onGlyphs(added)
        this.portrait?.speakPulse()
      }
      return
    }
    if (this.portrait && this.typed.length >= this.full.length) {
      this.portrait.silence()
    }
    this.hold += realDt
    if (this.hold >= this.autoMs) {
      this.hide()
    }
  }

  completeOrHide(): boolean {
    return this.advanceBubble()
  }

  /** Un appui = une bulle (ferme la réplique en cours, même si le texte tape encore). */
  advanceBubble(): boolean {
    if (!this.root) {
      return false
    }
    this.hide()
    return true
  }

  hide(): void {
    if (this.root) {
      this.emit(DialogueEvent.END)
    }
    dialogueVoice.stop()
    this.portrait?.silence()
    this.portrait?.destroy()
    this.portrait = null
    this.root?.destroy(true)
    this.root = null
    this.body = null
    this.hint = null
    this.full = ''
    this.typed = ''
    this.entry = null
    this.fast = false
  }

  private finishText(): void {
    dialogueVoice.stop()
    this.portrait?.silence()
    this.emit(DialogueEvent.TEXT_COMPLETE)
    this.emit(DialogueEvent.TALK_STOP)
    this.emit(DialogueEvent.VOICE_STOP)
  }

  private emit(event: DialogueEventId): void {
    for (const listener of this.listeners) {
      listener(event, this.entry)
    }
  }

  private drawFrame(cx: number, cy: number): Phaser.GameObjects.Container {
    const g = this.scene.add.graphics()
    g.fillStyle(0x0b0a08, 0.94)
    g.fillRoundedRect(cx - BOX_W / 2, cy - BOX_H / 2, BOX_W, BOX_H, 10)
    g.lineStyle(5, 0xc9a227, 1)
    g.strokeRoundedRect(cx - BOX_W / 2 + 3, cy - BOX_H / 2 + 3, BOX_W - 6, BOX_H - 6, 8)
    g.lineStyle(2, 0xf0d56a, 0.95)
    g.strokeRoundedRect(cx - BOX_W / 2 + 10, cy - BOX_H / 2 + 10, BOX_W - 20, BOX_H - 20, 6)
    g.lineStyle(1, 0x6a4e16, 0.7)
    g.strokeRoundedRect(cx - BOX_W / 2 + 16, cy - BOX_H / 2 + 16, BOX_W - 32, BOX_H - 32, 4)
    const corners = [
      [cx - BOX_W / 2 + 22, cy - BOX_H / 2 + 22],
      [cx + BOX_W / 2 - 22, cy - BOX_H / 2 + 22],
      [cx - BOX_W / 2 + 22, cy + BOX_H / 2 - 22],
      [cx + BOX_W / 2 - 22, cy + BOX_H / 2 - 22],
    ]
    g.fillStyle(0xf0d56a, 1)
    for (const point of corners) {
      g.fillRect((point[0] ?? 0) - 4, (point[1] ?? 0) - 4, 8, 8)
    }
    const pack = this.scene.add.container(0, 0, [g])
    return pack
  }
}

function wrapNarration(text: string): string {
  const trimmed = text.trim()
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
  }
  return `[${trimmed}]`
}
