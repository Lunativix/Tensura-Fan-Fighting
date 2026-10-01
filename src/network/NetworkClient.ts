export const NetworkState = {
  OFFLINE: 'OFFLINE',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  SEARCHING: 'SEARCHING',
  MATCH_FOUND: 'MATCH_FOUND',
  READY: 'READY',
  PLAYING: 'PLAYING',
  DISCONNECTED: 'DISCONNECTED',
  RECONNECTING: 'RECONNECTING',
  FINISHED: 'FINISHED',
  UNAVAILABLE: 'UNAVAILABLE',
} as const

export type NetworkStateId = (typeof NetworkState)[keyof typeof NetworkState]

export interface MatchIntent {
  damage: number
  hp: number
  energy: number
  ultimate: number
  winner: string | null
  /** IDs only. Clients load local art. Never sync PNG/VFX files. */
  roster?: {
    variantMode: string
    chronologyMissionId: string
    player: Array<{ characterId: string, variantId: string, movesetId: string }>
    cpu: Array<{ characterId: string, variantId: string, movesetId: string }>
  }
}

export class NetworkClient {
  state: NetworkStateId = NetworkState.OFFLINE
  ping = 0
  roomCode = ''

  async connect(): Promise<boolean> {
    this.state = NetworkState.UNAVAILABLE
    return false
  }

  async quickMatch(): Promise<boolean> {
    this.state = NetworkState.UNAVAILABLE
    return false
  }

  createRoom(): string {
    this.roomCode = Math.random().toString(36).slice(2, 8).toUpperCase()
    this.state = NetworkState.UNAVAILABLE
    return this.roomCode
  }

  validate(intent: MatchIntent): MatchIntent {
    return {
      damage: Math.max(0, intent.damage),
      hp: Math.max(0, intent.hp),
      energy: Math.max(0, intent.energy),
      ultimate: Math.min(100, Math.max(0, intent.ultimate)),
      winner: intent.winner,
      roster: intent.roster
        ? {
          variantMode: intent.roster.variantMode,
          chronologyMissionId: intent.roster.chronologyMissionId,
          player: intent.roster.player.map((item) => ({
            characterId: item.characterId,
            variantId: item.variantId,
            movesetId: item.movesetId,
          })),
          cpu: intent.roster.cpu.map((item) => ({
            characterId: item.characterId,
            variantId: item.variantId,
            movesetId: item.movesetId,
          })),
        }
        : undefined,
    }
  }

  disconnect(): void {
    this.state = NetworkState.OFFLINE
  }

  get onlineReady(): boolean {
    return false
  }
}

export const network = new NetworkClient()
