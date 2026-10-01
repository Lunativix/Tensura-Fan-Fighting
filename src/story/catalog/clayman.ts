import { FighterId } from '../../types/game.ts'
import { StorySource, type StoryMissionDef } from '../types.ts'

/** LN vol. 5–6. Mjurran, fausse rage de Milim, Carrion et Frey, route vers Walpurgis. */
export const CLAYMAN_MISSION: StoryMissionDef = {
  id: 'clayman_trap',
  title: 'Le piège de Clayman',
  arc: 'clayman',
    chronology: 11,
  location: 'Eurazania',
  stageId: 'eurazania',
  summary: 'Clayman croit manier Milim. Mjurran parlait. Carrion et Frey ne sont pas ses pièces. Walpurgis devient inévitable.',
  source: StorySource.LN,
  playable: true,
  playableCharacter: FighterId.rimuru,
  objectives: ['Repousser les marionnettes', 'Comprendre le piège'],
  rewards: { xp: 130, coins: 80 },
  unlocks: {
    characters: ['clayman', 'frey'],
    stages: ['eurazania'],
    archives: ['clayman', 'frey', 'mjurran', 'eurazania-crisis'],
  },
  beats: [
    { type: 'title', text: 'CLAYMAN', sub: 'Il tire des ficelles. Il croit que Milim est l\'une d\'elles.', ms: 2000 },
    {
      type: 'dialogue',
      speaker: 'Souei',
      speakerId: 'souei',
      text: 'Mjurran m\'a tout dit. Clayman. Un cœur artificiel. De l\'espionnage. Il voulait Eurazania à genoux, et Milim comme arme.',
      emotion: 'serious',
    },
    { type: 'presence', who: 'milim' },
    {
      type: 'dialogue',
      speaker: 'Milim Nava',
      speakerId: 'milim',
      text: 'Il croit m\'avoir droguée, enragée, tenue. Moi. Rimuru, on a joué le jeu. Carrion n\'est pas mort. Frey non plus.',
      emotion: 'angry',
    },
    {
      type: 'dialogue',
      speaker: 'Frey',
      text: 'Clayman dépasse son rang. Les harpies ne dansent pas pour un manipulateur.',
      emotion: 'serious',
    },
    {
      type: 'dialogue',
      speaker: 'Carrion',
      text: 'Il a voulu ma tête et mon pays. Tempest, Eurazania : même ennemi, aujourd\'hui.',
      emotion: 'angry',
    },
    { type: 'spawn', enemy: 'clayman_doll', x: 1080 },
    { type: 'spawn', enemy: 'clayman_doll', x: 1260 },
    { type: 'spawn', enemy: 'clayman_doll', x: 1440 },
    { type: 'hint', text: 'Marionnettes. Ce n\'est pas encore Clayman. C\'est sa main.' },
    { type: 'clear' },
    {
      type: 'dialogue',
      speaker: 'Diablo',
      speakerId: 'diablo',
      text: 'Il fuira vers Walpurgis. Les Demon Lords jugeront. Rimuru-sama, vous y avez votre place. Je n\'en doute pas.',
      emotion: 'serious',
    },
    { type: 'unlock', unlocks: { characters: ['clayman', 'frey'], archives: ['clayman', 'frey', 'eurazania-crisis'] } },
    { type: 'complete' },
  ],
}
