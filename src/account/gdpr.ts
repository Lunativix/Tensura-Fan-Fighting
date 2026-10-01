import type { AccountSlice, CollectionSlice, EconomySlice, GameProfileSlice, GdprSlice, InventorySlice } from './types.ts'
import type { StorySaveSlice } from '../story/types.ts'
import { nowIso } from './crypto.ts'

export interface AccountExport {
  exportedAt: string
  account: Omit<AccountSlice, 'credentials'> & { email: string | null }
  profile: GameProfileSlice
  story: StorySaveSlice
  collection: CollectionSlice
  inventory: InventorySlice
  economy: Pick<EconomySlice, 'ledger' | 'purchases' | 'summons'>
  live: unknown
  gdpr: GdprSlice
}

export function exportAccount(data: {
  account: AccountSlice
  profile: GameProfileSlice
  story: StorySaveSlice
  collection: CollectionSlice
  inventory: InventorySlice
  economy: EconomySlice
  live?: unknown
  gdpr: GdprSlice
}): AccountExport {
  return {
    exportedAt: nowIso(),
    account: {
      id: data.account.id,
      kind: data.account.kind,
      displayName: data.account.displayName,
      createdAt: data.account.createdAt,
      lastSeenAt: data.account.lastSeenAt,
      claimedFromGuestId: data.account.claimedFromGuestId,
      email: data.account.credentials?.email ?? null,
    },
    profile: data.profile,
    story: data.story,
    collection: data.collection,
    inventory: { ...data.inventory },
    economy: {
      ledger: data.economy.ledger,
      purchases: data.economy.purchases,
      summons: data.economy.summons,
    },
    live: data.live ?? null,
    gdpr: { ...data.gdpr, lastExportAt: nowIso() },
  }
}

export function acceptPrivacy(gdpr: GdprSlice): GdprSlice {
  return { ...gdpr, privacyAcceptedAt: gdpr.privacyAcceptedAt ?? nowIso() }
}
