export const GameFlow = {
  BOOT: 'BOOT',
  PRELOAD: 'PRELOAD',
  MENU: 'MENU',
  HUB: 'HUB',
  CHARACTER_SELECT: 'CHARACTER_SELECT',
  CHARACTERS: 'CHARACTERS',
  TRAINING: 'TRAINING',
  SETTINGS: 'SETTINGS',
  FIGHT: 'FIGHT',
  CINEMATIC: 'CINEMATIC',
  PAUSED: 'PAUSED',
  VICTORY: 'VICTORY',
  DEFEAT: 'DEFEAT',
} as const

export type GameFlowId = (typeof GameFlow)[keyof typeof GameFlow]

export const MatchMode = {
  PVE: 'PVE',
  PVP: 'PVP',
  EVE: 'EVE',
  ONLINE: 'ONLINE',
} as const

export type MatchModeId = (typeof MatchMode)[keyof typeof MatchMode]

export const FighterId = {
  rimuru: 'rimuru',
  milim: 'milim',
  diablo: 'diablo',
  benimaru: 'benimaru',
  shion: 'shion',
  veldora: 'veldora',
  hinata: 'hinata',
  guy: 'guy',
  shuna: 'shuna',
  souei: 'souei',
  hakurou: 'hakurou',
} as const

export type FighterIdValue = (typeof FighterId)[keyof typeof FighterId]
