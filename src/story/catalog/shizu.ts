import { FighterId } from '../../types/game.ts'
import { StorySource, type StoryMissionDef } from '../types.ts'

/** LN vol. 1. Shizu, Ifrit. Rimuru n'a le corps actuel qu'après l'absorption. */
export const SHIZU_MISSION: StoryMissionDef = {
  id: 'shizu_ifrit',
  title: 'Shizu',
  arc: 'shizu',
  chronology: 6,
  location: 'Village de Rimuru',
  stageId: 'jura_forest',
  summary: 'Shizu arrive. Ifrit. Rimuru l\'absorbe. Ensuite seulement, il peut prendre cette apparence humaine.',
  source: StorySource.LN,
  playable: true,
  playableCharacter: FighterId.rimuru,
  objectives: ['Entendre Shizu', 'Vaincre Ifrit', 'Absorber Shizu'],
  rewards: { xp: 100, coins: 60 },
  unlocks: {
    stages: ['jura_forest'],
    archives: ['shizu', 'ifrit', 'rimuru-shizu-form'],
  },
  beats: [
    { type: 'title', text: 'SHIZU', sub: 'Une aventurière. Une flamme qu\'elle ne contrôle plus.', ms: 2200 },
    { type: 'narration', text: 'Une femme épuisée arrive au village. L\'air autour d\'elle brûle par à-coups.' },
    {
      type: 'dialogue',
      speaker: 'Shizu',
      text: 'Je n\'ai plus beaucoup de temps. Ifrit... il me dévore de l\'intérieur. Si je reste, votre village brûlera avec moi.',
      emotion: 'sad',
    },
    {
      type: 'dialogue',
      speaker: 'Rimuru',
      speakerId: 'rimuru',
      text: 'Je ne vais pas te laisser seule. Si cette flamme veut sortir, elle aura affaire à moi.',
      emotion: 'serious',
    },
    {
      type: 'dialogue',
      speaker: 'Great Sage',
      speakerId: 'rimuru',
      text: 'Réponse. Entité spirituelle : Ifrit. Possession en cours. L\'hôte ne tiendra pas.',
      emotion: 'serious',
    },
    { type: 'heal' },
    { type: 'spawn', enemy: 'ifrit', x: 1400 },
    { type: 'hint', text: 'Esquive.' },
    { type: 'clear' },
    {
      type: 'dialogue',
      speaker: 'Shizu',
      text: 'C\'est fini... Je n\'ai plus la force de rester. Merci. Je... je te confie le reste.',
      emotion: 'sad',
    },
    {
      type: 'dialogue',
      speaker: 'Rimuru',
      speakerId: 'rimuru',
      text: 'Je vais t\'absorber avec [Predator]. Pas te faire disparaître. Te garder. Tu resteras avec moi.',
      emotion: 'serious',
    },
    {
      type: 'dialogue',
      speaker: 'Great Sage',
      speakerId: 'rimuru',
      text: 'Réponse. Absorption terminée. Mimétisme humain : désormais possible à partir de cet individu.',
      emotion: 'serious',
    },
    {
      type: 'dialogue',
      speaker: 'Rimuru',
      speakerId: 'rimuru',
      text: 'Alors je pourrai prendre une forme humaine. La sienne. Pas avant. Pas une autre.',
      emotion: 'serious',
    },
    { type: 'unlock', unlocks: { archives: ['shizu', 'ifrit', 'rimuru-shizu-form'] } },
    { type: 'complete' },
  ],
}
