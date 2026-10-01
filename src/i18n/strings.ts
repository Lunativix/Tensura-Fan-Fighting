import { saveManager } from '../save/SaveManager.ts'

const EN = {
  title: 'TENSURA FAN FIGHT',
  subtitle: 'Fan prototype — non commercial',
  play: 'PLAY',
  characters: 'CHARACTERS',
  training: 'TRAINING',
  settings: 'SETTINGS',
  account: 'ACCOUNT',
  back: 'BACK',
  versusCpu: 'VS CPU',
  selectFighter: 'SELECT YOUR FIGHTER',
  selectP2: 'SELECT PLAYER 2',
  locked: 'LOCKED',
  startHint: 'Enter / click to confirm   Esc to return',
  music: 'MUSIC',
  sfx: 'SFX',
  fullscreen: 'FULLSCREEN',
  debugHint: 'F3 Debug   F4 Hitboxes   F5 Train reset',
  language: 'LANGUAGE',
  loading: 'LOADING',
  loadAssets: 'ASSET LOADING',
  loadCharacters: 'CHARACTER LOADING',
  loadAnimations: 'ANIMATION LOADING',
  loadAudio: 'AUDIO LOADING',
  loadVfx: 'VFX LOADING',
  loadStory: 'STORY DATA LOADING',
  loadUi: 'UI LOADING',
}

const FR = {
  title: 'TENSURA FAN FIGHT',
  subtitle: 'Prototype fan — non commercial',
  play: 'JOUER',
  characters: 'PERSONNAGES',
  training: 'ENTRAINEMENT',
  settings: 'OPTIONS',
  account: 'COMPTE',
  back: 'RETOUR',
  versusCpu: 'VS CPU',
  selectFighter: 'CHOISIS TON COMBATTANT',
  selectP2: 'CHOISIS JOUEUR 2',
  locked: 'VERROUILLE',
  startHint: 'Entree / clic pour valider   Echap pour revenir',
  music: 'MUSIQUE',
  sfx: 'SFX',
  fullscreen: 'PLEIN ECRAN',
  debugHint: 'F3 Debug   F4 Hitboxes   F5 Reset training',
  language: 'LANGUE',
  loading: 'CHARGEMENT',
  loadAssets: 'CHARGEMENT DES RESSOURCES',
  loadCharacters: 'CHARGEMENT DES PERSONNAGES',
  loadAnimations: 'CHARGEMENT DES ANIMATIONS',
  loadAudio: 'CHARGEMENT AUDIO',
  loadVfx: 'CHARGEMENT DES EFFETS',
  loadStory: 'CHARGEMENT DES DONNEES',
  loadUi: 'CHARGEMENT DE L\'INTERFACE',
}

export type StringKey = keyof typeof EN

export function t(key: StringKey): string {
  const lang = saveManager.load().settings.language
  return (lang === 'fr' ? FR : EN)[key]
}

export const strings = new Proxy(EN, {
  get(_target, prop: string) {
    return t(prop as StringKey)
  },
}) as typeof EN
