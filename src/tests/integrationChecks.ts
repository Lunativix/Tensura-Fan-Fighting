import { AccountKind } from '../account/types.ts'
import { grantCredits, grantTickets, recomputeFromLedger } from '../account/economy.ts'
import { applyFightToSave, applyStoryRewards, syncCollectionFromStory } from '../account/ops.ts'
import { defaultStorySave } from '../story/types.ts'
import { defaultSave, syncMirror } from '../save/SaveManager.ts'
import { purchaseOffer } from '../live/shop.ts'
import { summon } from '../live/summon.ts'
import { itemById } from '../live/catalog.ts'
import { displayNameForItem, equipItem, equippedTint, markEncountered } from '../live/collection.ts'
import { ownsItem } from '../live/grant.ts'
import { matchEventCreditBonus } from '../live/events.ts'
import { matchCreditPayout } from '../progression/RewardService.ts'
import { buyItem } from '../progression/Progression.ts'
import { FighterId } from '../types/game.ts'
import { session } from '../game/GameState.ts'
import type { CheckResult } from './foundationChecks.ts'

function assert(ok: boolean, message: string, result: CheckResult): void {
  if (ok) {
    result.passed += 1
  } else {
    result.failed.push(message)
  }
}

/** Cross-system pipeline: account save slices talk to each other, not in parallel. */
export function runIntegrationChecks(): CheckResult {
  const result: CheckResult = { passed: 0, failed: [] }
  session.ranked = false

  const save = defaultSave()
  assert(save.account.kind === AccountKind.GUEST, 'integration starts guest', result)
  assert(save.inventory.credits === 0 && save.economy.ledger.length === 0, 'integration empty ledger', result)

  applyFightToSave(save, true)
  assert(save.profile.wins === 1, 'fight writes profile.wins', result)
  assert(save.inventory.credits > 0, 'fight writes inventory.credits', result)
  assert(save.economy.ledger.some((entry) => entry.reason === 'match_win'), 'fight writes ledger match_win', result)
  const expectedPayout = matchCreditPayout(true, false, '')
  assert(save.inventory.credits === expectedPayout.credits, 'fight credits match live event bonus', result)
  syncMirror(save)
  assert(save.progress.coins === save.inventory.credits, 'mirror coins follow inventory', result)
  assert(save.progress.wins === save.profile.wins, 'mirror wins follow profile', result)
  assert(save.progress.xp === save.profile.xp, 'mirror xp follow profile', result)

  const bonus = matchEventCreditBonus()
  assert(bonus === expectedPayout.credits - 50 - 40, 'events UI bonus equals combat bonus', result)

  const funded = grantCredits(save.inventory, save.economy, 400, 'integration_shop_fund')
  assert(funded.ok, 'integration fund shop', result)
  if (funded.ok) {
    save.inventory = funded.inventory
    save.economy = funded.economy
  }
  const creditsBeforeBuy = save.inventory.credits
  const bought = purchaseOffer(save, 'offer-skin-rimuru-gold')
  assert(bought.ok === true, 'shop purchaseOffer', result)
  assert(ownsItem(save, 'skin-rimuru-gold'), 'shop unlocks collection item', result)
  assert(save.inventory.credits < creditsBeforeBuy, 'shop spends inventory credits', result)
  assert(save.economy.ledger.some((entry) => entry.reason.includes('shop') || entry.sku === 'offer-skin-rimuru-gold' || entry.sku === 'skin-rimuru-gold'), 'shop writes ledger', result)

  equipItem(save, FighterId.rimuru, 'skin-rimuru-gold')
  assert(save.live.equipped[FighterId.rimuru]?.appearanceId === 'skin-rimuru-gold', 'equip writes live.equipped', result)
  assert(equippedTint(save, FighterId.rimuru) !== undefined, 'versus tint reads equipped appearance', result)

  const beforeStory = save.inventory.credits
  applyStoryRewards(save, { xp: 50, coins: 25 })
  assert(save.inventory.credits === beforeStory + 25, 'story rewards use ledger credits', result)
  assert(save.economy.ledger.some((entry) => entry.reason === 'story_clear'), 'story writes ledger story_clear', result)

  save.story = {
    ...defaultStorySave(),
    unlockedCharacters: [FighterId.diablo],
    archives: ['codex-diablo'],
  }
  syncCollectionFromStory(save)
  assert(save.collection.characters.includes(FighterId.diablo), 'story unlocks collection characters', result)

  const card = itemById('card-diablo')
  assert(Boolean(card?.spoiler), 'diablo card is spoiler', result)
  if (card) {
    const hidden = defaultSave()
    assert(displayNameForItem(hidden, card) === '????', 'spoiler hidden before encounter', result)
    markEncountered(hidden, FighterId.diablo)
    assert(displayNameForItem(hidden, card) !== '????', 'spoiler opens after markEncountered', result)
  }

  const tickets = grantTickets(save.inventory, save.economy, 1, 'integration_ticket')
  assert(tickets.ok, 'grant tickets', result)
  if (tickets.ok) {
    save.inventory = tickets.inventory
    save.economy = tickets.economy
  }
  const ticketsBefore = save.inventory.tickets
  const pull = summon(save, 'chest-tempest', 1)
  assert(pull.ok === true, 'summon spends tickets via live', result)
  if (pull.ok) {
    assert(save.inventory.tickets === ticketsBefore - 1, 'summon debit tickets', result)
    assert(pull.drops.length === 1, 'summon returns a drop', result)
    assert(save.live.pity['chest-tempest'] !== undefined, 'summon writes pity', result)
    if (pull.drops[0]?.duplicate) {
      const target = itemById(pull.drops[0].itemId)?.fragmentTarget
        ?? itemById(pull.drops[0].itemId)?.fighterId
        ?? pull.drops[0].itemId
      assert((save.live.fragments[target] ?? 0) > 0, 'duplicate writes live.fragments', result)
      assert(save.inventory.fragments > 0, 'duplicate writes inventory.fragments', result)
    }
  }

  const cosmetics = [...save.collection.cosmetics]
  const credits = save.inventory.credits
  save.story = defaultStorySave()
  assert(save.collection.cosmetics.join() === cosmetics.join(), 'story reset does not wipe shop cosmetics', result)
  assert(save.inventory.credits === credits, 'story reset does not wipe credits', result)

  const recomputed = recomputeFromLedger(save.economy)
  assert(recomputed.credits === save.inventory.credits, 'ledger recomputes credits', result)
  syncMirror(save)
  assert(save.progress.coins === save.inventory.credits, 'mirror still aligned after pipeline', result)

  assert(buyItem(syncMirror(defaultSave()).progress, 'skin-rimuru-gold', 1) === null, 'legacy buyItem blocked', result)

  return result
}
