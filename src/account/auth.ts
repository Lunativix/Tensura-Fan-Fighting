import type { AccountSlice, AuthSession, GdprSlice } from './types.ts'
import { AccountKind } from './types.ts'
import { makePasswordRecord, validEmail, validPassword, verifyPassword, nowIso } from './crypto.ts'

export interface RegisterInput {
  email: string
  password: string
  displayName: string
  privacyAccepted: boolean
}

export async function registerOnGuest(
  account: AccountSlice,
  gdpr: GdprSlice,
  input: RegisterInput,
): Promise<{ ok: true, account: AccountSlice, gdpr: GdprSlice } | { ok: false, reason: string }> {
  if (account.kind === AccountKind.REGISTERED) {
    return { ok: false, reason: 'already_registered' }
  }
  const email = input.email.trim().toLowerCase()
  if (!validEmail(email)) {
    return { ok: false, reason: 'invalid_email' }
  }
  if (!validPassword(input.password)) {
    return { ok: false, reason: 'weak_password' }
  }
  if (!input.privacyAccepted) {
    return { ok: false, reason: 'privacy_required' }
  }
  const name = input.displayName.trim().slice(0, 24) || account.displayName
  try {
    const record = await makePasswordRecord(input.password)
    return {
      ok: true,
      account: {
        ...account,
        kind: AccountKind.REGISTERED,
        displayName: name,
        lastSeenAt: nowIso(),
        credentials: { email, ...record },
        claimedFromGuestId: account.id,
      },
      gdpr: { ...gdpr, privacyAcceptedAt: nowIso() },
    }
  } catch {
    return { ok: false, reason: 'crypto_unavailable' }
  }
}

export async function verifyLogin(account: AccountSlice, email: string, password: string): Promise<boolean> {
  const creds = account.credentials
  if (!creds || account.kind !== AccountKind.REGISTERED) {
    return false
  }
  if (creds.email !== email.trim().toLowerCase()) {
    return false
  }
  try {
    return await verifyPassword(password, creds.salt, creds.hash, creds.iterations)
  } catch {
    return false
  }
}

export async function changePassword(
  account: AccountSlice,
  current: string,
  next: string,
): Promise<{ ok: true, account: AccountSlice } | { ok: false, reason: string }> {
  if (!account.credentials) {
    return { ok: false, reason: 'guest' }
  }
  if (!validPassword(next)) {
    return { ok: false, reason: 'weak_password' }
  }
  const ok = await verifyPassword(current, account.credentials.salt, account.credentials.hash, account.credentials.iterations)
  if (!ok) {
    return { ok: false, reason: 'bad_password' }
  }
  try {
    const record = await makePasswordRecord(next)
    return {
      ok: true,
      account: {
        ...account,
        lastSeenAt: nowIso(),
        credentials: { email: account.credentials.email, ...record },
      },
    }
  } catch {
    return { ok: false, reason: 'crypto_unavailable' }
  }
}

export function toSession(account: AccountSlice): AuthSession {
  return {
    accountId: account.id,
    kind: account.kind,
    displayName: account.displayName,
    email: account.credentials?.email ?? null,
  }
}

export function authErrorFr(reason: string): string {
  if (reason === 'already_registered') {
    return 'Ce profil est déjà inscrit.'
  }
  if (reason === 'invalid_email') {
    return 'Adresse e-mail invalide.'
  }
  if (reason === 'weak_password') {
    return 'Mot de passe trop court (8 caractères minimum).'
  }
  if (reason === 'privacy_required') {
    return 'Il faut accepter la politique de confidentialité.'
  }
  if (reason === 'crypto_unavailable') {
    return 'Chiffrement indisponible dans ce navigateur.'
  }
  if (reason === 'guest') {
    return 'Compte invité : crée un compte d’abord.'
  }
  if (reason === 'bad_password') {
    return 'Mot de passe actuel incorrect.'
  }
  return 'Action impossible.'
}

export function touchAccount(account: AccountSlice): AccountSlice {
  return { ...account, lastSeenAt: nowIso() }
}

/** In-memory lock for this browser tab. Reload reopens the local session. */
let deviceSessionOpen = true

export function logoutLocal(): void {
  deviceSessionOpen = false
}

export function unlockLocalSession(): void {
  deviceSessionOpen = true
}

export function isDeviceSessionOpen(account: AccountSlice): boolean {
  return account.kind === AccountKind.GUEST || deviceSessionOpen
}
