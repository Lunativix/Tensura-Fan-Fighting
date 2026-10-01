import { CHARACTERS } from '../config/characters.ts'
import { type FighterIdValue } from '../types/game.ts'
import { rosterVariantOf } from '../combat/variants/catalog.ts'
import { MovesetId, type FighterLoadout } from '../combat/variants/types.ts'

export const TEAM_SIZE = 3
const SWITCH_CD_MS = 2200
const ASSIST_CD_MS = 2800

function fallbackLoadout(id: FighterIdValue): FighterLoadout {
  return { fighterId: id, variantId: rosterVariantOf(id).id, movesetId: MovesetId.NARRATIVE }
}

export class TeamBench {
  readonly slots: FighterIdValue[]
  readonly loadouts: FighterLoadout[]
  active = 0
  switchCd = 0
  assistCd = 0

  constructor(slots: FighterIdValue[], banned?: FighterIdValue, loadouts?: FighterLoadout[]) {
    this.slots = slots.length >= 2 ? slots.slice(0, TEAM_SIZE) : buildTeam(slots[0] ?? 'rimuru', banned ?? 'milim')
    this.loadouts = this.slots.map((id, index) => {
      const picked = loadouts?.[index]
      return picked && picked.fighterId === id ? picked : fallbackLoadout(id)
    })
  }

  get current(): FighterIdValue {
    return this.slots[this.active] ?? this.slots[0]!
  }

  get currentLoadout(): FighterLoadout {
    return this.loadouts[this.active] ?? fallbackLoadout(this.current)
  }

  get ally(): FighterIdValue {
    const next = (this.active + 1) % this.slots.length
    return this.slots[next] ?? this.current
  }

  tick(dt: number): void {
    this.switchCd = Math.max(0, this.switchCd - dt)
    this.assistCd = Math.max(0, this.assistCd - dt)
  }

  trySwitch(): FighterIdValue | null {
    if (this.switchCd > 0 || this.slots.length < 2) {
      return null
    }
    this.active = (this.active + 1) % this.slots.length
    this.switchCd = SWITCH_CD_MS
    return this.current
  }

  tryAssist(): FighterIdValue | null {
    if (this.assistCd > 0 || this.slots.length < 2) {
      return null
    }
    this.assistCd = ASSIST_CD_MS
    return this.ally
  }
}

export function buildTeam(lead: FighterIdValue, banned: FighterIdValue): FighterIdValue[] {
  const extras = (Object.keys(CHARACTERS) as FighterIdValue[]).filter(
    (id) => id !== lead && id !== banned && CHARACTERS[id].playable,
  )
  return [lead, extras[0], extras[1]].filter((id): id is FighterIdValue => Boolean(id)).slice(0, TEAM_SIZE)
}
