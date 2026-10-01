import { MusicRole, type MusicRoleId } from './types.ts'

export const MUSIC_PRIORITY: Record<MusicRoleId, number> = {
  [MusicRole.SILENCE]: 100,
  [MusicRole.STINGER]: 95,
  [MusicRole.CINEMATIC]: 90,
  [MusicRole.VICTORY]: 78,
  [MusicRole.DEFEAT]: 78,
  [MusicRole.BOSS]: 82,
  [MusicRole.BATTLE]: 55,
  [MusicRole.DIALOGUE]: 40,
  [MusicRole.EXPLORATION]: 30,
  [MusicRole.MENU]: 20,
}

export function canReplace(current: number, incoming: number, sameFamily: boolean): boolean {
  if (sameFamily) {
    return true
  }
  return incoming >= current
}
