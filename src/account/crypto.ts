export function nowIso(): string {
  return new Date().toISOString()
}

export function newId(prefix: string): string {
  const uuid = globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  return `${prefix}_${uuid}`
}

export function unique(base: string[], extra?: string[]): string[] {
  const next = [...base]
  for (const id of extra ?? []) {
    if (id && !next.includes(id)) {
      next.push(id)
    }
  }
  return next
}

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function fromHex(hex: string): Uint8Array {
  const clean = hex.length % 2 === 0 ? hex : `0${hex}`
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i += 1) {
    out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy.buffer
}

export const PASSWORD_ITERATIONS = 80_000

export async function hashSecret(password: string, salt: Uint8Array, iterations = PASSWORD_ITERATIONS): Promise<string> {
  const cryptoRef = globalThis.crypto
  if (!cryptoRef?.subtle) {
    throw new Error('crypto_unavailable')
  }
  const material = await cryptoRef.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await cryptoRef.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: asArrayBuffer(salt), iterations },
    material,
    256,
  )
  return toHex(new Uint8Array(bits))
}

export async function makePasswordRecord(password: string): Promise<{ salt: string, hash: string, iterations: number }> {
  const cryptoRef = globalThis.crypto
  if (!cryptoRef?.getRandomValues) {
    throw new Error('crypto_unavailable')
  }
  const salt = cryptoRef.getRandomValues(new Uint8Array(16))
  const hash = await hashSecret(password, salt)
  return { salt: toHex(salt), hash, iterations: PASSWORD_ITERATIONS }
}

export async function verifyPassword(password: string, saltHex: string, expectedHex: string, iterations: number): Promise<boolean> {
  const actual = await hashSecret(password, fromHex(saltHex), iterations)
  if (actual.length !== expectedHex.length) {
    return false
  }
  let mismatch = 0
  for (let i = 0; i < actual.length; i += 1) {
    mismatch |= actual.charCodeAt(i) ^ expectedHex.charCodeAt(i)
  }
  return mismatch === 0
}

export function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase())
}

export function validPassword(password: string): boolean {
  return password.length >= 8 && password.length <= 128
}
