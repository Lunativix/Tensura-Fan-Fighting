import { FighterId } from '../../types/game.ts'
import { StorySource, type StoryMissionDef } from '../types.ts'

/** LN vol. 1. Paraphrase, pas citation. */
export const PROLOGUE_MISSION: StoryMissionDef = {
  id: 'prologue_reincarnation',
  title: 'Un slime nommé demain',
  arc: 'prologue',
  chronology: 1,
  location: 'Tokyo → Grotte Scellée',
  stageId: 'sealed_cave',
  summary: 'Satoru Mikami meurt en protégeant quelqu\'un. Il se réveille slime. Unique Skill [Great Sage].',
  source: StorySource.LN,
  playable: true,
  playableCharacter: FighterId.rimuru,
  objectives: ['Écouter Great Sage', 'Accepter la réincarnation'],
  rewards: { xp: 20, coins: 10 },
  unlocks: {
    archives: ['satoru-mikami', 'great-sage', 'rimuru-slime'],
    tutorials: ['story-start'],
  },
  beats: [
    { type: 'title', text: 'SATORU MIKAMI', sub: 'Tokyo. Un passage. Une lame.', ms: 2200 },
    {
      type: 'dialogue',
      speaker: 'Satoru Mikami',
      text: 'Je l\'ai poussée. Elle va s\'en sortir. Moi... ça brûle. Trente-sept ans, et c\'est tout ?',
      emotion: 'scared',
    },
    {
      type: 'dialogue',
      speaker: 'Great Sage',
      speakerId: 'rimuru',
      text: 'Réponse. Unique Skill [Great Sage] : acquis. Réincarnation confirmée.',
      emotion: 'serious',
    },
    {
      type: 'dialogue',
      speaker: 'Satoru Mikami',
      text: 'Une voix dans ma tête... Unique Skill ? Je rêve encore ?',
      emotion: 'surprised',
    },
    {
      type: 'dialogue',
      speaker: 'Great Sage',
      speakerId: 'rimuru',
      text: 'Réponse. Forme actuelle : slime. Membres : absents. Perception magique : disponible. Tu n\'es plus humain. Tu es vivant.',
      emotion: 'serious',
    },
    {
      type: 'dialogue',
      speaker: 'Rimuru',
      speakerId: 'rimuru',
      text: 'Un slime. Pas de bouche, pas de mains... mais je pense encore. D\'accord. On va faire avec.',
      emotion: 'serious',
    },
    { type: 'title', text: 'GROTTE SCELLÉE', sub: 'Magicules stagnants. Quelque chose est enfermé ici.', ms: 1800 },
    { type: 'complete' },
  ],
}
