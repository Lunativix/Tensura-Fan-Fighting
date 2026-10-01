import { AiDifficulty, type AiDifficultyId } from '../ai/AiDifficulty.ts'
import {
  DEFAULT_CHRONOLOGY_MISSION,
  VariantMode,
  type FighterLoadout,
  type VariantModeId,
} from '../combat/variants/index.ts'
import { FighterId, GameFlow, MatchMode, type FighterIdValue, type GameFlowId, type MatchModeId } from '../types/game.ts'

export const PlayMode = {
  VERSUS_CPU: 'VERSUS_CPU',
  VERSUS_LOCAL: 'VERSUS_LOCAL',
  ARCADE: 'ARCADE',
  SURVIVAL: 'SURVIVAL',
  STORY: 'STORY',
  TRAINING: 'TRAINING',
  ONLINE: 'ONLINE',
} as const

export type PlayModeId = (typeof PlayMode)[keyof typeof PlayMode]

export class SessionState {
  flow: GameFlowId = GameFlow.BOOT
  paused = false
  hidden = false
  matchMode: MatchModeId = MatchMode.PVE
  playMode: PlayModeId = PlayMode.VERSUS_CPU
  playerFighter: FighterIdValue = FighterId.rimuru
  cpuFighter: FighterIdValue = FighterId.milim
  playerTeam: FighterIdValue[] = [FighterId.rimuru, FighterId.shuna, FighterId.souei]
  cpuTeam: FighterIdValue[] = [FighterId.milim, FighterId.diablo, FighterId.benimaru]
  variantMode: VariantModeId = VariantMode.FREE
  chronologyMissionId = DEFAULT_CHRONOLOGY_MISSION
  playerLoadouts: FighterLoadout[] = []
  cpuLoadouts: FighterLoadout[] = []
  debugVisible = false
  showHitboxes = false
  trainingMode = false
  infiniteResources = false
  framePause = false
  aiDifficulty: AiDifficultyId = AiDifficulty.NORMAL
  arcadeQueue: FighterIdValue[] = []
  arcadeIndex = 0
  survivalRound = 1
  survivalHp = 1000
  round = 1
  timer = 99
  ranked = false
  storyIndex = 0
  storyMissionId = 'prologue_reincarnation'
  /** id d'arene (voir Stages.ts) ou 'random' */
  stageId: string = 'random'
  combatFeel: CombatFeelSnap | null = null
  animPreview = false
  debugProjectiles = false
  debugVfx = false
  debugSfx = false
  debugCamera = false
}

export interface CombatFeelSnap {
  pState: string
  cState: string
  pPhase: string
  cPhase: string
  hitStopMs: number
  finisher: string
  pSkill: string[]
  cSkill: string[]
  projectiles: number
}

export const session = new SessionState()

export function resetSessionCombatPicks(): void {
  session.playerFighter = FighterId.rimuru
  session.cpuFighter = FighterId.milim
  session.playerTeam = [FighterId.rimuru, FighterId.shuna, FighterId.souei]
  session.cpuTeam = [FighterId.milim, FighterId.diablo, FighterId.benimaru]
  session.playerLoadouts = []
  session.cpuLoadouts = []
  session.matchMode = MatchMode.PVE
  session.playMode = PlayMode.VERSUS_CPU
}

export function syncLeadFromTeams(): void {
  session.playerFighter = session.playerTeam[0] ?? FighterId.rimuru
  session.cpuFighter = session.cpuTeam[0] ?? FighterId.milim
}
