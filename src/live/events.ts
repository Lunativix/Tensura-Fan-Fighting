import { ShopCategory, type LiveEventDef } from './types.ts'

export const LIVE_EVENTS: readonly LiveEventDef[] = [
  {
    id: 'premier-walpurgis',
    title: 'Premier Walpurgis',
    blurb: 'Boutique et coffre liés au banquet. Direction nocturne, pas de pop-ups incessants.',
    startDate: '2026-08-25T00:00:00.000Z',
    endDate: '2026-09-08T00:00:00.000Z',
    bannerId: 'chest-walpurgis',
    shopCategories: [ShopCategory.EVENT, ShopCategory.SUMMON],
    matchCreditBonus: 20,
  },
]

const EVENT_MAP = new Map(LIVE_EVENTS.map((event) => [event.id, event]))

export function eventById(id: string): LiveEventDef | undefined {
  return EVENT_MAP.get(id)
}

export function remainingMs(iso: string, now = Date.now()): number {
  return Math.max(0, Date.parse(iso) - now)
}

export function isWithin(startIso: string, endIso: string, now = Date.now()): boolean {
  return now >= Date.parse(startIso) && now < Date.parse(endIso)
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  return `${String(days).padStart(2, '0')} J   ${String(hours).padStart(2, '0')} H   ${String(minutes).padStart(2, '0')} MIN`
}

export function activeEvents(now = Date.now()): LiveEventDef[] {
  return LIVE_EVENTS.filter((event) => isWithin(event.startDate, event.endDate, now))
}

export function matchEventCreditBonus(now = Date.now()): number {
  return activeEvents(now).reduce((sum, event) => sum + (event.matchCreditBonus ?? 0), 0)
}
