import { sfxEngine } from './SfxEngine.ts'
import {
  emotionVoiceMod,
  registerAllTalkVariants,
  talkGroupSize,
} from './profiles/voiceCatalog.ts'
import type { FighterIdValue } from '../types/game.ts'
import type { DialogueEmotionId } from '../dialogue/DialogueTypes.ts'
import { DialogueEmotion } from '../dialogue/DialogueTypes.ts'

let wired = false

export class DialogueVoice {
  private chars = 0
  private speaker: FighterIdValue | null = null
  private emotion: DialogueEmotionId = DialogueEmotion.NORMAL
  private talking = false

  constructor() {
    if (!wired) {
      registerAllTalkVariants((key, recipes) => sfxEngine.registerVariants(key, recipes))
      wired = true
    }
  }

  begin(speaker: FighterIdValue, emotion: DialogueEmotionId): void {
    this.speaker = speaker
    this.emotion = emotion
    this.chars = 0
    this.talking = true
  }

  onGlyphs(added: string): void {
    if (!this.talking || !this.speaker) {
      return
    }
    const letters = added.replace(/[^0-9A-Za-zÀ-ÿ]/g, '')
    if (letters.length === 0) {
      return
    }
    this.chars += letters.length
    const group = Math.max(1, Math.round(talkGroupSize(this.speaker) / emotionVoiceMod(this.emotion).rate))
    if (this.chars < group) {
      return
    }
    this.chars = 0
    this.blip()
  }

  setFast(fast: boolean): void {
    if (fast && this.speaker) {
      this.chars = talkGroupSize(this.speaker)
    }
  }

  stop(): void {
    this.talking = false
    this.chars = 0
    this.speaker = null
    sfxEngine.stopBus('dialogue')
  }

  private blip(): void {
    if (!this.speaker) {
      return
    }
    const mod = emotionVoiceMod(this.emotion)
    sfxEngine.playPick(`talk-${this.speaker}`, {
      pitch: mod.pitch,
      volume: mod.volume * 0.9,
    })
  }
}

export const dialogueVoice = new DialogueVoice()
