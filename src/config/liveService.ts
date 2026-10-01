import { FighterId, type FighterIdValue } from '../types/game.ts'

export interface RosterEntry {
  id: FighterIdValue
  free: boolean
  status: 'available' | 'roadmap' | 'event'
  wave: number
}

export const LAUNCH_ROSTER: readonly FighterIdValue[] = [
  FighterId.rimuru,
  FighterId.benimaru,
  FighterId.shion,
  FighterId.shuna,
  FighterId.souei,
  FighterId.hakurou,
  FighterId.milim,
  FighterId.veldora,
]

export const ROADMAP: readonly RosterEntry[] = [
  { id: FighterId.rimuru, free: true, status: 'available', wave: 0 },
  { id: FighterId.milim, free: true, status: 'available', wave: 0 },
  { id: FighterId.benimaru, free: true, status: 'available', wave: 0 },
  { id: FighterId.shion, free: true, status: 'available', wave: 0 },
  { id: FighterId.veldora, free: true, status: 'available', wave: 0 },
  { id: FighterId.diablo, free: true, status: 'available', wave: 0 },
  { id: FighterId.hinata, free: true, status: 'available', wave: 0 },
  { id: FighterId.guy, free: true, status: 'available', wave: 0 },
  { id: FighterId.shuna, free: true, status: 'available', wave: 0 },
  { id: FighterId.souei, free: true, status: 'available', wave: 0 },
  { id: FighterId.hakurou, free: true, status: 'available', wave: 0 },
]

export interface ShopItem {
  id: string
  name: string
  cost: number
  kind: 'skin' | 'title' | 'palette'
  fighterId?: FighterIdValue
}

export const SHOP_ITEMS = [
  { id: 'skin-rimuru-gold', name: 'Rimuru Gold Aura', cost: 400, kind: 'skin' as const, fighterId: FighterId.rimuru },
  { id: 'skin-milim-star', name: 'Milim Star Dress', cost: 400, kind: 'skin' as const, fighterId: FighterId.milim },
  { id: 'title-tempest', name: 'Title: Tempest Lord', cost: 200, kind: 'title' as const },
  { id: 'palette-night', name: 'Night Palette', cost: 150, kind: 'palette' as const },
]
