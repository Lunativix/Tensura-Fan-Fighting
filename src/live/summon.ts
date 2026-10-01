import { Rarity, RARITY_ORDER, type RarityId } from './rarity.ts'
import { itemById } from './catalog.ts'
import { bannerById } from './banners.ts'
import { hashSeed, mulberry32 } from './rng.ts'
import { emptyPity } from './defaults.ts'
import { isDevPurchaseMode } from './payment.ts'
import { grantItem, spend } from './grant.ts'
import type { SaveData } from '../save/SaveManager.ts'
import type { BannerDef, PityState, RateTable, SummonDrop } from './types.ts'

function pickRarity(roll: number, rates: RateTable): RarityId {
  let cursor = 0
  const order: { id: RarityId, pct: number }[] = [
    { id: Rarity.MYTHIC, pct: rates.mythic },
    { id: Rarity.LEGENDARY, pct: rates.legendary },
    { id: Rarity.EPIC, pct: rates.epic },
    { id: Rarity.RARE, pct: rates.rare },
    { id: Rarity.COMMON, pct: rates.common },
  ]
  const unit = roll * 100
  for (const row of order) {
    cursor += row.pct
    if (unit < cursor) {
      return row.id
    }
  }
  return Rarity.COMMON
}

function poolOf(banner: BannerDef, rarity: RarityId): string[] {
  const matched = banner.pool.filter((id) => itemById(id)?.rarity === rarity)
  return matched.length > 0 ? matched : banner.pool
}

function applyPity(pity: PityState, rolled: RarityId, config: BannerDef['pity'], force: RarityId | null): { rarity: RarityId, pityForced: boolean, pity: PityState } {
  let rarity = force ?? rolled
  let pityForced = Boolean(force)
  if (!force && pity.sinceMythic + 1 >= config.mythicEvery) {
    rarity = Rarity.MYTHIC
    pityForced = true
  } else if (!force && pity.sinceLegendary + 1 >= config.legendaryEvery && RARITY_ORDER.indexOf(rarity) < RARITY_ORDER.indexOf(Rarity.LEGENDARY)) {
    rarity = Rarity.LEGENDARY
    pityForced = true
  }
  const next: PityState = {
    pulls: pity.pulls + 1,
    sinceLegendary: rarity === Rarity.LEGENDARY || rarity === Rarity.MYTHIC ? 0 : pity.sinceLegendary + 1,
    sinceMythic: rarity === Rarity.MYTHIC ? 0 : pity.sinceMythic + 1,
  }
  return { rarity, pityForced, pity: next }
}

export function summon(
  data: SaveData,
  bannerId: string,
  count: 1 | 10,
): { ok: true, data: SaveData, drops: SummonDrop[] } | { ok: false, reason: string } {
  const banner = bannerById(bannerId)
  if (!banner) {
    return { ok: false, reason: 'unknown_banner' }
  }
  const now = Date.now()
  if (now < Date.parse(banner.startDate) || now >= Date.parse(banner.endDate)) {
    return { ok: false, reason: 'banner_closed' }
  }
  if (count !== 1 && count !== 10) {
    return { ok: false, reason: 'invalid_count' }
  }
  const cost = count === 10 ? banner.costX10 : banner.costX1
  const spent = spend(data, banner.currency, cost, `summon:${banner.id}x${count}`, banner.id)
  if (!spent.ok) {
    return spent
  }
  data.inventory = spent.inventory
  data.economy = spent.economy

  let pity = data.live.pity[banner.id] ?? emptyPity()
  const seed = hashSeed(`${data.account.id}:${banner.id}:${pity.pulls}:${data.economy.ledger.length}`)
  const rand = mulberry32(seed)
  const drops: SummonDrop[] = []
  let force = isDevPurchaseMode() ? data.live.nextForceRarity : null

  for (let i = 0; i < count; i += 1) {
    const rolled = pickRarity(rand(), banner.rates)
    const applied = applyPity(pity, rolled, banner.pity, i === 0 ? force : null)
    force = null
    pity = applied.pity
    const pool = poolOf(banner, applied.rarity)
    const itemId = pool[Math.floor(rand() * pool.length)] ?? pool[0]
    if (!itemId) {
      continue
    }
    const granted = grantItem(data, itemId, 'summon', banner.id)
    drops.push({
      itemId,
      rarity: itemById(itemId)?.rarity ?? applied.rarity,
      duplicate: granted.duplicate,
      fragments: granted.fragments,
      pityForced: applied.pityForced,
    })
  }

  data.live.pity[banner.id] = pity
  data.live.nextForceRarity = null
  data.economy = {
    ...data.economy,
    summons: [...data.economy.summons, {
      id: `sum_${pity.pulls}`,
      at: new Date().toISOString(),
      bannerId: banner.id,
      costCurrency: banner.currency,
      costAmount: cost,
      results: drops.map((drop) => drop.itemId),
    }].slice(-80),
  }
  return { ok: true, data, drops }
}
