import { FighterId } from '../../types/game.ts'
import { StorySource, type StoryMissionDef } from '../types.ts'

/** LN vol. 2–3. Kaijin chassé de Dwargon, Gazel, Blumund, puis Milim et le miel. */
export const TEMPEST_MISSION: StoryMissionDef = {
  id: 'tempest_founded',
  title: 'Naissance de Tempest',
  arc: 'tempest',
    chronology: 7,
  location: 'Ville de Rimuru',
  stageId: 'tempest_city',
  summary: 'Fédération Jura-Tempest. Kaijin, Gazel, Fuze, Youm. Visite de Milim. Miel, pas une guerre.',
  source: StorySource.LN,
  playable: true,
  playableCharacter: FighterId.rimuru,
  objectives: ['Entendre Dwargon et Blumund', 'Accueillir Milim'],
  rewards: { xp: 80, coins: 50 },
  unlocks: {
    characters: ['milim'],
    stages: ['tempest_city', 'dwargon', 'blumund'],
    archives: ['tempest', 'kaijin', 'gazel', 'youm', 'fuze', 'milim-visit'],
  },
  beats: [
    { type: 'title', text: 'TEMPEST', sub: 'Une nation de monstres. Les humains devront parler.', ms: 2000 },
    {
      type: 'dialogue',
      speaker: 'Kaijin',
      text: 'Dwargon m\'a jeté. Toi, tu m\'as pris. Si on forge propre ici, Gazel finira par venir — pas en ami d\'abord. En roi.',
      emotion: 'serious',
    },
    {
      type: 'dialogue',
      speaker: 'Gazel Dwargo',
      text: 'Un slime qui fonde un pays... Je testerai ta force, Rimuru. Dwargon n\'ouvre pas ses portes au chaos.',
      emotion: 'serious',
    },
    {
      type: 'dialogue',
      speaker: 'Fuze',
      text: 'Je suis l\'œil de Blumund. Youm raconte trop. Si Tempest tient, l\'Ouest n\'aura plus l\'excuse de « ce n\'est qu\'une forêt ».',
      emotion: 'normal',
    },
    {
      type: 'dialogue',
      speaker: 'Youm',
      text: 'Chef, on a des murs ! Une ville ! Les aventuriers vont arriver. Tempest, ça claque.',
      emotion: 'happy',
    },
    { type: 'presence', who: 'milim' },
    {
      type: 'dialogue',
      speaker: 'Milim Nava',
      speakerId: 'milim',
      text: 'Hé ! C\'est ici, le nouveau pays ? Moi c\'est Milim ! T\'as du miel ? Si t\'es fort, on est amis.',
      emotion: 'excited',
    },
    {
      type: 'dialogue',
      speaker: 'Rimuru',
      speakerId: 'rimuru',
      text: 'Milim Nava... tu es une Demon Lord. D\'accord. Le miel, oui. Détruire Tempest, non.',
      emotion: 'surprised',
    },
    {
      type: 'dialogue',
      speaker: 'Great Sage',
      speakerId: 'rimuru',
      text: 'Réponse. Individu : Dragonoid. Demon Lord. Danger maximal. Lien déclaré : amical. Prudence requise.',
      emotion: 'serious',
    },
    { type: 'unlock', unlocks: { characters: ['milim'], archives: ['tempest', 'milim-visit', 'gazel'] } },
    { type: 'complete' },
  ],
}
