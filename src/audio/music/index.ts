export type {
  ArcMusicProfile,
  BattleTypeId,
  CharacterMusicProfile,
  MapMusicProfile,
  MusicContext,
  MusicDebugSnapshot,
  MusicEventId,
  MusicLayerId,
  MusicResolveResult,
  MusicRoleId,
  MusicSettingsSlice,
  MusicTrackDef,
} from './types.ts'
export { BattleType, MusicEvent, MusicLayer, MusicRole, defaultMusicSettings } from './types.ts'
export { MUSIC_TRACKS, trackById } from './catalog.ts'
export { resolveMusic, claymanTrackForPhase, phaseFromBossHp, sameMusicFamily } from './resolve.ts'
export { LEITMOTIFS, motifFor, fighterMotifId } from './scales.ts'
export { musicManager, battleTypeFrom } from './MusicManager.ts'
