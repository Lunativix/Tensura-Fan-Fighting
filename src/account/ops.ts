import type { SaveData } from '../save/SaveManager.ts'
import { session } from '../game/GameState.ts'
import { matchCreditPayout } from '../progression/RewardService.ts'
import { unlockCollection, ownsCosmetic } from './collection.ts'
import { grantCredits, requestPremiumPurchase, spendCredits } from './economy.ts'
import { unique } from './crypto.ts'
import type { GameProfileSlice } from './types.ts'

export function addProfileXp(profile: GameProfileSlice, xpGain: number): GameProfileSlice {
  let xp = profile.xp + Math.max(0, Math.floor(xpGain))
  let level = profile.level
  while (xp >= level * 100) {
    xp -= level * 100
    level += 1
  }
  return { ...profile, xp, level }
}

export function syncCollectionFromStory(data: SaveData): SaveData {
  data.collection = unlockCollection(data.collection, {
    characters: data.story.unlockedCharacters,
    codex: data.story.archives,
  })
  return data
}

export function applyFightToSave(data: SaveData, won: boolean): SaveData {
  const xpGain = won ? 80 : 30
  data.profile = addProfileXp({
    ...data.profile,
    wins: data.profile.wins + (won ? 1 : 0),
    losses: data.profile.losses + (won ? 0 : 1),
  }, xpGain)
  const payout = matchCreditPayout(won, session.ranked, data.profile.lastWinDay)
  data.profile.lastWinDay = payout.lastWinDay
  if (payout.credits > 0) {
    const granted = grantCredits(data.inventory, data.economy, payout.credits, won ? 'match_win' : 'match_loss')
    if (granted.ok) {
      data.inventory = granted.inventory
      data.economy = granted.economy
    }
  }
  return data
}

export function applyStoryRewards(data: SaveData, rewards: { xp: number, coins: number }): SaveData {
  data.profile = addProfileXp(data.profile, rewards.xp)
  if (rewards.coins > 0) {
    const granted = grantCredits(data.inventory, data.economy, rewards.coins, 'story_clear')
    if (granted.ok) {
      data.inventory = granted.inventory
      data.economy = granted.economy
    }
  }
  return data
}

export function buyCosmetic(data: SaveData, id: string, cost: number): { ok: true, data: SaveData } | { ok: false, reason: string } {
  if (ownsCosmetic(data.collection, id)) {
    return { ok: false, reason: 'already_owned' }
  }
  const spent = spendCredits(data.inventory, data.economy, cost, 'shop_buy', id)
  if (!spent.ok) {
    return spent
  }
  data.inventory = {
    ...spent.inventory,
    items: unique(spent.inventory.items, [id]),
  }
  data.economy = spent.economy
  data.collection = unlockCollection(data.collection, { cosmetics: [id] })
  return { ok: true, data }
}

export function recordRejectedPurchase(data: SaveData, sku: string): SaveData {
  const rejected = requestPremiumPurchase(sku)
  data.economy = {
    ...data.economy,
    purchases: [...data.economy.purchases, rejected.purchase],
  }
  return data
}
