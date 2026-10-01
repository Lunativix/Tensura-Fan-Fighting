import { FighterId } from '../../types/game.ts'
import { StorySource, type StoryMissionDef } from '../types.ts'

/** LN vol. 4. Phobio reçoit le germe de Charybdis (faction Clayman). Carrion vient après. */
export const CHARYBDIS_MISSION: StoryMissionDef = {
  id: 'charybdis_siege',
  title: 'Charybdis',
  arc: 'charybdis',
    chronology: 8,
  location: 'Tempest',
  stageId: 'tempest_city',
  summary: 'Phobio invoque Charybdis. Défense de Tempest. Carrion assume. Albis et Suphia : les Trois Bêtes, pas l\'armée d\'Eurazania entière.',
  source: StorySource.LN,
  playable: true,
  playableCharacter: FighterId.rimuru,
  objectives: ['Tenir Tempest', 'Vaincre Charybdis'],
  rewards: { xp: 140, coins: 80 },
  unlocks: {
    characters: ['carrion', 'phobio', 'albis', 'suphia'],
    stages: ['tempest_city', 'eurazania'],
    archives: ['charybdis', 'phobio', 'carrion', 'albis', 'suphia'],
  },
  beats: [
    { type: 'title', text: 'CHARYBDIS', sub: 'Un subordonné de Carrion a appelé ce qui ne se contrôle pas.', ms: 2000 },
    {
      type: 'dialogue',
      speaker: 'Souei',
      speakerId: 'souei',
      text: 'J\'ai vu Phobio. Une des Trois Bêtes. Il a planté un germe — pas une armée d\'Eurazania. Le germe vient de la faction de Clayman. Charybdis n\'obéit à personne.',
      emotion: 'serious',
    },
    {
      type: 'dialogue',
      speaker: 'Benimaru',
      speakerId: 'benimaru',
      text: 'Carrion n\'a pas envoyé ça comme salut. Quelqu\'un a mis ce germe dans les mains de Phobio.',
      emotion: 'angry',
    },
    {
      type: 'dialogue',
      speaker: 'Rimuru',
      speakerId: 'rimuru',
      text: 'On protège la cité. On discute d\'Eurazania après — s\'il reste une cité.',
      emotion: 'serious',
    },
    { type: 'heal' },
    { type: 'spawn', enemy: 'charybdis', x: 1420 },
    { type: 'hint', text: 'Esquive.' },
    { type: 'clear' },
    {
      type: 'dialogue',
      speaker: 'Carrion',
      text: 'Phobio a outrepassé. Le germe n\'était pas un cadeau d\'Eurazania. Tempest a tenu. On se reparlera, slime — en rois, pas en bêtes.',
      emotion: 'serious',
    },
    {
      type: 'dialogue',
      speaker: 'Great Sage',
      speakerId: 'rimuru',
      text: 'Réponse. Charybdis : neutralisée. Phobio : survivant. Origine du germe : faction de Clayman. Eurazania n\'a pas déclaré la guerre.',
      emotion: 'serious',
    },
    { type: 'unlock', unlocks: { archives: ['charybdis', 'phobio', 'carrion'] } },
    { type: 'complete' },
  ],
}
