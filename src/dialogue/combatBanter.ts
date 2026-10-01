import type { FighterIdValue } from '../types/game.ts'

/** Spoken lines only. The UI already shows the speaker name — never prefix it in `text`. */

export const INTRO_LINE: Record<FighterIdValue, string> = {
  rimuru: 'Alors... c\'est toi qui me cherches des ennuis ?',
  milim: 'Allez, amuse-moi !',
  diablo: 'Permettez-moi de m\'occuper de vous.',
  benimaru: 'Je ne reculerai pas.',
  shion: 'Je ne vous laisserai pas passer !',
  veldora: 'HAHAHA ! Enfin un vrai combat !',
  hinata: 'Je ne laisserai rien au hasard.',
  guy: 'Ne me fais pas perdre mon temps.',
  shuna: 'Je veillerai à ce que ça s\'arrête ici.',
  souei: 'Je t\'ai déjà dans ma ligne de mire.',
  hakurou: 'Montre-moi ta garde.',
}

export const INTRO_REPLY: Record<FighterIdValue, string> = {
  rimuru: 'Je ne sais pas si je dois prendre ça comme un compliment.',
  milim: 'Moi aussi je m\'amuse déjà !',
  diablo: 'Vous semblez bien sûr de vous. Je vais voir.',
  benimaru: 'Alors viens. Je t\'attends.',
  shion: 'Tu sembles bien arrogant pour quelqu\'un comme toi !',
  veldora: 'Toi ? Contre moi ? HAHAHA !',
  hinata: 'Tu parles trop. Je tranche.',
  guy: 'Tu sembles bien arrogant pour quelqu\'un comme toi.',
  shuna: 'Je ne veux pas te faire de mal. Recule.',
  souei: 'Tu t\'exposes. Je frappe.',
  hakurou: 'Ta garde, d\'abord. Ensuite on verra.',
}

export const VICTORY_LINE: Record<FighterIdValue, string> = {
  rimuru: 'C\'est terminé.',
  milim: 'J\'ai gagné ! Encore !',
  diablo: 'C\'était inévitable.',
  benimaru: 'C\'est terminé. Je n\'ai pas reculé.',
  shion: 'J\'ai réussi !',
  veldora: 'HAHAHA ! J\'ai encore gagné !',
  hinata: 'C\'est terminé. Comme prévu.',
  guy: 'Tu as perdu ton temps. Moi, non.',
  shuna: 'J\'ai réussi... tout le monde va bien ?',
  souei: 'Cible éliminée. J\'en ai fini.',
  hakurou: 'J\'ai vu assez. C\'est terminé.',
}

export const DEFEAT_LINE: Record<FighterIdValue, string> = {
  rimuru: 'Mince... je n\'ai pas réussi à tenir.',
  milim: 'Hein ? J\'ai perdu ?!',
  diablo: 'Je n\'ai pas été à la hauteur. C\'est... rare.',
  benimaru: 'Je n\'ai pas tenu. Je reviendrai plus fort.',
  shion: 'Mince... je n\'ai pas pu protéger...',
  veldora: 'Quoi ? Moi ? Je n\'accepte pas ça !',
  hinata: 'Je n\'ai pas assez calculé...',
  guy: 'Tu m\'as fait perdre mon temps. Je m\'en souviendrai.',
  shuna: 'Je n\'ai pas réussi à tenir...',
  souei: 'J\'ai échoué. Je me retire.',
  hakurou: 'Ma garde a cédé. Je m\'en souviendrai.',
}

export const ULT_LINE: Record<FighterIdValue, string> = {
  rimuru: 'Tu aurais vraiment dû éviter de me provoquer.',
  milim: 'Drago Buster !',
  diablo: 'Permettez-moi de tout conclure.',
  benimaru: 'Hellflare. Je vous réduis en cendre.',
  shion: 'Je ne laisserai personne toucher au maître.',
  veldora: 'Storm Blast !',
  hinata: 'Lumière, tranche.',
  guy: 'Savoure cet instant.',
  shuna: 'Je ne laisserai personne tomber.',
  souei: 'Trop tard pour fuir.',
  hakurou: 'Je laisse la lame décider.',
}

export function introLine(id: FighterIdValue): string {
  return INTRO_LINE[id]
}

export function introReply(id: FighterIdValue): string {
  return INTRO_REPLY[id]
}

export function victoryLine(id: FighterIdValue): string {
  return VICTORY_LINE[id]
}

export function defeatLine(id: FighterIdValue): string {
  return DEFEAT_LINE[id]
}

export function ultLine(id: FighterIdValue | undefined, fallback = 'Ça s\'arrête ici.'): string {
  if (!id) {
    return fallback
  }
  return ULT_LINE[id] ?? fallback
}
