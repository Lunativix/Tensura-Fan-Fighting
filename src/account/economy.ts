import { Currency, LedgerKind, type CurrencyId, type EconomySlice, type InventorySlice, type LedgerEntry, type PurchaseRecord } from './types.ts'
import { balanceOf, writeBalance } from './defaults.ts'
import { newId, nowIso } from './crypto.ts'

export interface EconomyMutation {
  currency: CurrencyId
  amount: number
  reason: string
  sku?: string
}

export interface EconomyOk {
  ok: true
  inventory: InventorySlice
  economy: EconomySlice
  balance: number
}

export interface EconomyErr {
  ok: false
  reason: string
}

export type EconomyResult = EconomyOk | EconomyErr

const MAX_LEDGER = 400

function trimLedger(entries: LedgerEntry[]): LedgerEntry[] {
  return entries.length > MAX_LEDGER ? entries.slice(entries.length - MAX_LEDGER) : entries
}

function apply(
  inventory: InventorySlice,
  economy: EconomySlice,
  kind: typeof LedgerKind[keyof typeof LedgerKind],
  mutation: EconomyMutation,
): EconomyResult {
  const amount = Math.floor(mutation.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, reason: 'invalid_amount' }
  }
  if (!mutation.reason.trim()) {
    return { ok: false, reason: 'missing_reason' }
  }
  const current = balanceOf(inventory, mutation.currency)
  const nextBal = kind === LedgerKind.SPEND ? current - amount : current + amount
  if (nextBal < 0) {
    return { ok: false, reason: 'insufficient_funds' }
  }
  const entry: LedgerEntry = {
    id: newId('led'),
    at: nowIso(),
    kind,
    currency: mutation.currency,
    amount,
    reason: mutation.reason,
    sku: mutation.sku,
    balanceAfter: nextBal,
  }
  return {
    ok: true,
    inventory: writeBalance(inventory, mutation.currency, nextBal),
    economy: { ...economy, ledger: trimLedger([...economy.ledger, entry]) },
    balance: nextBal,
  }
}

/** Soft currency from gameplay. Never accepts a client-supplied final balance. */
export function grantCredits(inventory: InventorySlice, economy: EconomySlice, amount: number, reason: string): EconomyResult {
  return apply(inventory, economy, LedgerKind.GRANT, { currency: Currency.CREDITS, amount, reason })
}

export function spendCredits(inventory: InventorySlice, economy: EconomySlice, amount: number, reason: string, sku?: string): EconomyResult {
  return apply(inventory, economy, LedgerKind.SPEND, { currency: Currency.CREDITS, amount, reason, sku })
}

export function spendTickets(inventory: InventorySlice, economy: EconomySlice, amount: number, reason: string, sku?: string): EconomyResult {
  return apply(inventory, economy, LedgerKind.SPEND, { currency: Currency.TICKETS, amount, reason, sku })
}

export function grantTickets(inventory: InventorySlice, economy: EconomySlice, amount: number, reason: string): EconomyResult {
  return apply(inventory, economy, LedgerKind.GRANT, { currency: Currency.TICKETS, amount, reason })
}

export function grantFragments(inventory: InventorySlice, economy: EconomySlice, amount: number, reason: string): EconomyResult {
  return apply(inventory, economy, LedgerKind.GRANT, { currency: Currency.FRAGMENTS, amount, reason })
}

/**
 * Premium / real-money. The client must not credit this itself.
 * Local backend always rejects until a real server exists.
 */
export function requestPremiumPurchase(sku: string): { ok: false, reason: string, purchase: PurchaseRecord } {
  const purchase: PurchaseRecord = {
    id: newId('pay'),
    at: nowIso(),
    sku,
    status: 'rejected',
    reason: 'payments_not_enabled',
  }
  return { ok: false, reason: purchase.reason, purchase }
}

export function grantPremiumFromServer(
  inventory: InventorySlice,
  economy: EconomySlice,
  amount: number,
  serverReceipt: string,
): EconomyResult {
  if (!serverReceipt.startsWith('srv_')) {
    return { ok: false, reason: 'invalid_receipt' }
  }
  return apply(inventory, economy, LedgerKind.GRANT, {
    currency: Currency.PREMIUM,
    amount,
    reason: `server_receipt:${serverReceipt}`,
    sku: serverReceipt,
  })
}

export function recomputeFromLedger(economy: EconomySlice): InventorySlice {
  const inventory: InventorySlice = {
    credits: 0,
    premium: 0,
    tickets: 0,
    fragments: 0,
    items: [],
  }
  for (const entry of economy.ledger) {
    const sign = entry.kind === LedgerKind.SPEND ? -1 : 1
    const next = writeBalance(inventory, entry.currency, balanceOf(inventory, entry.currency) + sign * entry.amount)
    inventory.credits = next.credits
    inventory.premium = next.premium
    inventory.tickets = next.tickets
    inventory.fragments = next.fragments
  }
  return inventory
}
