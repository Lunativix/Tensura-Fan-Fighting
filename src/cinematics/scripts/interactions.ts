import { CHARACTERS } from '../../config/characters.ts'
import { def } from '../scriptUtil.ts'
import type { CinematicContext, CinematicDef } from '../types.ts'
import type { FighterIdValue } from '../../types/game.ts'
import type { DialogueEmotionId } from '../../dialogue/DialogueTypes.ts'

export interface InteractionLine {
  a: FighterIdValue
  b: FighterIdValue
  left: { speaker: FighterIdValue, text: string, emotion?: DialogueEmotionId }
  right: { speaker: FighterIdValue, text: string, emotion?: DialogueEmotionId }
}

export const INTERACTION_TABLE: readonly InteractionLine[] = [
  {
    a: 'rimuru',
    b: 'diablo',
    left: { speaker: 'diablo', text: 'Maître, laissez-moi m\'occuper de cette nuisance.', emotion: 'serious' },
    right: { speaker: 'rimuru', text: 'Pas encore. On finit ça ensemble.', emotion: 'normal' },
  },
  {
    a: 'rimuru',
    b: 'milim',
    left: { speaker: 'milim', text: 'Rimuru ! On s\'éclate, cette fois ?', emotion: 'excited' },
    right: { speaker: 'rimuru', text: 'Essaie de ne pas tout détruire.', emotion: 'serious' },
  },
  {
    a: 'rimuru',
    b: 'veldora',
    left: { speaker: 'veldora', text: 'Frérot ! Laisse la tempête parler.', emotion: 'happy' },
    right: { speaker: 'rimuru', text: 'Reste concentré, Veldora.', emotion: 'serious' },
  },
  {
    a: 'rimuru',
    b: 'hinata',
    left: { speaker: 'hinata', text: 'Je ne reculerai pas. Pas cette fois.', emotion: 'serious' },
    right: { speaker: 'rimuru', text: 'Alors prouve-le sur le terrain.', emotion: 'normal' },
  },
  {
    a: 'rimuru',
    b: 'guy',
    left: { speaker: 'guy', text: 'Montre-moi si tu mérites ce titre, slime.', emotion: 'serious' },
    right: { speaker: 'rimuru', text: 'Je n\'ai pas l\'intention de décevoir.', emotion: 'serious' },
  },
  {
    a: 'benimaru',
    b: 'shion',
    left: { speaker: 'shion', text: 'Je ne te laisserai pas toucher au maître !', emotion: 'angry' },
    right: { speaker: 'benimaru', text: 'Garde tes forces pour l\'ennemi.', emotion: 'serious' },
  },
  {
    a: 'souei',
    b: 'hakurou',
    left: { speaker: 'hakurou', text: 'Ma lame n\'hésite jamais.', emotion: 'serious' },
    right: { speaker: 'souei', text: 'Alors je frappe avant qu\'elle ne tombe.', emotion: 'normal' },
  },
  {
    a: 'shuna',
    b: 'milim',
    left: { speaker: 'milim', text: 'Shuna ! On va s\'amuser !', emotion: 'happy' },
    right: { speaker: 'shuna', text: 'Essaie de rester un peu raisonnable...', emotion: 'sad' },
  },
]

function lineFor(ctx: CinematicContext): InteractionLine {
  const a = ctx.attacker?.def.id ?? ctx.attackerId ?? 'rimuru'
  const b = ctx.target?.def.id ?? ctx.targetId ?? 'milim'
  return INTERACTION_TABLE.find((row) =>
    (row.a === a && row.b === b) || (row.a === b && row.b === a),
  ) ?? {
    a,
    b,
    left: { speaker: a, text: 'Je ne reculerai pas.' },
    right: { speaker: b, text: 'Alors prouve-le.' },
  }
}

export function interactionGeneric(ctx: CinematicContext): CinematicDef {
  const line = lineFor(ctx)
  return def('interaction', 3600, [
    [0, (api) => {
      const left = ctx.attacker ?? api.player()
      const right = ctx.target ?? api.cpu()
      api.letterbox(true, 180)
      api.audio.duck(0.25)
      api.camera.focus((left.x + right.x) / 2, (left.y + right.y) / 2 - 20, { zoom: 1.35, duration: 400 })
    }],
    [400, (api) => {
      const left = ctx.attacker ?? api.player()
      api.camera.focus(left.x, left.y - 40, { zoom: 1.6, duration: 280 })
      api.dialogue.show({
        speaker: CHARACTERS[line.left.speaker].name,
        speakerId: line.left.speaker,
        text: line.left.text,
        emotion: line.left.emotion,
        side: 'left',
        duration: 1600,
      })
    }],
    [1900, (api) => {
      const right = ctx.target ?? api.cpu()
      api.camera.focus(right.x, right.y - 40, { zoom: 1.6, duration: 280 })
      api.dialogue.show({
        speaker: CHARACTERS[line.right.speaker].name,
        speakerId: line.right.speaker,
        text: line.right.text,
        emotion: line.right.emotion,
        side: 'right',
        duration: 1600,
      })
    }],
    [3300, (api) => {
      api.letterbox(false, 180)
    }],
  ])
}
