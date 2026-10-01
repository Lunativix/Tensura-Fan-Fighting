export const AccountKind = {
  GUEST: 'guest',
  REGISTERED: 'registered',
} as const

export type AccountKindId = (typeof AccountKind)[keyof typeof AccountKind]

export const Currency = {
  CREDITS: 'credits',
  PREMIUM: 'premium',
  TICKETS: 'tickets',
  FRAGMENTS: 'fragments',
} as const

export type CurrencyId = (typeof Currency)[keyof typeof Currency]

export const LedgerKind = {
  GRANT: 'grant',
  SPEND: 'spend',
} as const

export type LedgerKindId = (typeof LedgerKind)[keyof typeof LedgerKind]

export interface AccountCredentials {
  email: string
  /** PBKDF2 salt, hex. Never store a raw password. */
  salt: string
  /** PBKDF2 hash, hex. */
  hash: string
  iterations: number
}

export interface AccountSlice {
  id: string
  kind: AccountKindId
  displayName: string
  createdAt: string
  lastSeenAt: string
  credentials: AccountCredentials | null
  claimedFromGuestId: string | null
}

export interface GameProfileSlice {
  level: number
  xp: number
  wins: number
  losses: number
  titles: string[]
  equippedTitle: string
  lastWinDay: string
  avatarId: string
}

export interface CollectionSlice {
  characters: string[]
  appearances: string[]
  cosmetics: string[]
  musicTracks: string[]
  emotes: string[]
  vfx: string[]
  cards: string[]
  animations: string[]
  codex: string[]
}

export interface InventorySlice {
  credits: number
  premium: number
  tickets: number
  fragments: number
  items: string[]
}

export interface LedgerEntry {
  id: string
  at: string
  kind: LedgerKindId
  currency: CurrencyId
  amount: number
  reason: string
  sku?: string
  balanceAfter: number
}

export interface EconomySlice {
  /** Server is source of truth. Local ledger is an offline stand-in, not a client-set balance. */
  ledger: LedgerEntry[]
  /** Real-money purchases. Empty until a backend exists. */
  purchases: PurchaseRecord[]
  summons: SummonRecord[]
}

export interface PurchaseRecord {
  id: string
  at: string
  sku: string
  status: 'rejected' | 'pending' | 'fulfilled'
  reason: string
}

export interface SummonRecord {
  id: string
  at: string
  bannerId: string
  costCurrency: CurrencyId
  costAmount: number
  results: string[]
}

export interface GdprSlice {
  privacyAcceptedAt: string | null
  analyticsAcceptedAt: string | null
  marketingAcceptedAt: string | null
  ageGateAcceptedAt: string | null
  lastExportAt: string | null
}

export interface AuthSession {
  accountId: string
  kind: AccountKindId
  displayName: string
  email: string | null
}
