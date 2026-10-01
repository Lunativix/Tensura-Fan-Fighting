import type { FighterIdValue } from '../types/game.ts'

export const DialogueEmotion = {
  NORMAL: 'normal',
  HAPPY: 'happy',
  ANGRY: 'angry',
  SAD: 'sad',
  SURPRISED: 'surprised',
  SERIOUS: 'serious',
  SCARED: 'scared',
  EXCITED: 'excited',
} as const

export type DialogueEmotionId = (typeof DialogueEmotion)[keyof typeof DialogueEmotion]

export const MouthState = {
  CLOSED: 'closed',
  HALF: 'half',
  OPEN: 'open',
} as const

export type MouthStateId = (typeof MouthState)[keyof typeof MouthState]

export const EyeState = {
  OPEN: 'open',
  CLOSING: 'closing',
  CLOSED: 'closed',
  OPENING: 'opening',
} as const

export type EyeStateId = (typeof EyeState)[keyof typeof EyeState]

export const DialogueEvent = {
  START: 'dialogueStart',
  END: 'dialogueEnd',
  SPEAKER_CHANGE: 'speakerChange',
  EXPRESSION_CHANGE: 'expressionChange',
  TEXT_START: 'textStart',
  TEXT_COMPLETE: 'textComplete',
  TALK_START: 'talkStart',
  TALK_STOP: 'talkStop',
  BLINK: 'blink',
  VOICE_START: 'voiceStart',
  VOICE_STOP: 'voiceStop',
} as const

export type DialogueEventId = (typeof DialogueEvent)[keyof typeof DialogueEvent]

export interface DialogueEntry {
  speaker: string
  speakerId?: FighterIdValue
  text: string
  emotion?: DialogueEmotionId
  expression?: DialogueEmotionId
  textSpeed?: number
  voiceProfile?: FighterIdValue
  voiceVariation?: number
  animation?: DialogueEmotionId
  soundProfile?: string
  side?: 'left' | 'right'
  duration?: number
  instant?: boolean
  portrait?: string
}

export type DialogueListener = (event: DialogueEventId, entry: DialogueEntry | null) => void

export function inferEmotion(text: string, fallback: DialogueEmotionId = DialogueEmotion.NORMAL): DialogueEmotionId {
  const trimmed = text.trim()
  if (trimmed.endsWith('?!') || trimmed.endsWith('!?')) {
    return DialogueEmotion.SURPRISED
  }
  if (trimmed.includes('...') || trimmed.endsWith('…')) {
    return DialogueEmotion.SAD
  }
  if (trimmed.endsWith('?')) {
    return DialogueEmotion.SURPRISED
  }
  if (trimmed.endsWith('!!') || (trimmed.endsWith('!') && trimmed.length < 22)) {
    return DialogueEmotion.EXCITED
  }
  if (trimmed.endsWith('!')) {
    return DialogueEmotion.SERIOUS
  }
  return fallback
}

export function nextBlinkDelay(): number {
  return 2200 + Math.random() * 2100
}
