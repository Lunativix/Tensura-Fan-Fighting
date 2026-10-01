import { CHARACTERS, type ArchetypeId } from './characters.ts'
import { Element, type ElementId } from '../combat/elements.ts'
import { type FighterIdValue } from '../types/game.ts'

export interface RosterFlavor {
  quote: string
  element: ElementId
  elementLabel: string
  role: string
}

const ROLE: Record<ArchetypeId, string> = {
  BALANCED: 'Polyvalent',
  POWER: 'Assaut',
  RUSH: 'Rush',
  TECHNICAL: 'Technique',
  ZONER: 'Zone',
  GRAPPLER: 'Corps-a-corps',
  MAGE: 'Mage',
  AERIAL: 'Aerien',
  COUNTER: 'Contre',
}

const ELEMENT_LABEL: Record<ElementId, string> = {
  PHYSICAL: 'Physique',
  FIRE: 'Feu',
  WATER: 'Eau',
  WIND: 'Vent',
  EARTH: 'Terre',
  LIGHTNING: 'Foudre',
  LIGHT: 'Lumiere',
  DARK: 'Tenebres',
  MAGIC: 'Magie',
  SPIRITUAL: 'Esprit',
  UNIQUE: 'Unique',
}

const QUOTES: Record<FighterIdValue, string> = {
  rimuru: 'On règle ça proprement.',
  milim: 'Je m\'amuse déjà !',
  diablo: 'Permettez-moi de m\'en charger.',
  benimaru: 'Je ne recule pas.',
  shion: 'Je ne laisserai personne toucher Rimuru.',
  veldora: 'HAHAHA ! Un vrai combat !',
  hinata: 'Je ne laisserai rien au hasard.',
  guy: 'Ne me fais pas perdre mon temps.',
  shuna: 'Je veillerai sur vous.',
  souei: 'J\'ai verrouillé la cible.',
  hakurou: 'Montre-moi ta garde.',
}

const ELEMENTS: Record<FighterIdValue, ElementId> = {
  rimuru: Element.WATER,
  milim: Element.FIRE,
  diablo: Element.DARK,
  benimaru: Element.FIRE,
  shion: Element.PHYSICAL,
  veldora: Element.LIGHTNING,
  hinata: Element.LIGHT,
  guy: Element.UNIQUE,
  shuna: Element.LIGHT,
  souei: Element.DARK,
  hakurou: Element.PHYSICAL,
}

export function flavorOf(id: FighterIdValue): RosterFlavor {
  const def = CHARACTERS[id]
  const element = ELEMENTS[id]
  const role = ROLE[def.styles[0] ?? 'BALANCED']
  return {
    quote: QUOTES[id],
    element,
    elementLabel: ELEMENT_LABEL[element],
    role,
  }
}
