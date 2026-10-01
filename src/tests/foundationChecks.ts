import { Milim } from '../characters/Milim.ts'
import { Rimuru } from '../characters/Rimuru.ts'
import { FighterState } from '../combat/FighterState.ts'
import { applyDamage, canSpend, clamp, regenResource, spendResource } from '../gameplay/Resources.ts'
import { ComboSystem } from '../combat/ComboSystem.ts'
import { CooldownSystem } from '../combat/CooldownSystem.ts'
import { comboScale, computeHit } from '../combat/DamageSystem.ts'
import { kitFor } from '../config/skills.ts'
import { resistMultiplier } from '../combat/elements.ts'
import { addFightResult, defaultProgress } from '../progression/Progression.ts'
import { defaultSave } from '../save/SaveManager.ts'
import { AccountKind } from '../account/types.ts'
import { validEmail, validPassword } from '../account/crypto.ts'
import {
  applyFightToSave,
  buyCosmetic,
  exportAccount,
  grantCredits,
  grantPremiumFromServer,
  grantTickets,
  requestPremiumPurchase,
  spendCredits,
  unlockCollection,
  registerOnGuest,
  verifyLogin,
} from '../account/index.ts'
import { BANNERS } from '../live/banners.ts'
import { ITEMS } from '../live/catalog.ts'
import { purchaseOffer } from '../live/shop.ts'
import { summon } from '../live/summon.ts'
import { ownsItem } from '../live/grant.ts'
import { network } from '../network/NetworkClient.ts'
import { placeholderAssets } from '../pipeline/CharacterPipeline.ts'
import { ACTION_FOLDERS, hasMeleeFrames, STATE_TO_CLIP, type SpriteManifest } from '../sprites/SpriteManifest.ts'
import { FX_SHEETS } from '../vfx/FxLibrary.ts'
import { STAGES } from '../game/Stages.ts'
import { alphaBounds, punchBackdrop } from '../sprites/punchBackdrop.ts'
import { drawRimuruSlime } from '../characters/slimeLook.ts'
import { FighterId } from '../types/game.ts'
import { ObjectPool } from '../tools/ObjectPool.ts'
import { hitStopFor } from '../combat/HitStop.ts'
import { CONTENT_ROADMAP } from '../config/roadmap.ts'
import { LAUNCH_ROSTER } from '../config/liveService.ts'
import { CinematicRegistry, interactionKey } from '../cinematics/CinematicRegistry.ts'
import { registerCinematics } from '../cinematics/register.ts'
import { CHARACTERS, PLAYABLE_FIGHTERS } from '../config/characters.ts'
import { CHARACTER_SKINS } from '../config/characterSkins.ts'
import { impactTier } from '../vfx/ImpactCatalog.ts'
import { styleFor } from '../vfx/CombatStyle.ts'
import { auraLevelFor } from '../vfx/AuraField.ts'
import { profileFor, skillReleaseIds } from '../audio/profiles/CharacterAudio.ts'
import { sfxEngine } from '../audio/SfxEngine.ts'
import { talkRecipeIds } from '../audio/profiles/voiceCatalog.ts'
import { collectDialogueIssues } from '../dialogue/dialogueChecks.ts'
import { isDialogueAdvanceEvent } from '../input/DialogueAdvance.ts'
import { appearanceFor, collectVisualIssues, storyMomentId } from '../story/visual/index.ts'
import {
  MovesetId,
  VariantMode,
  attackIsAllowed,
  chronologyPeriods,
  kitForLoadout,
  resolveLoadout,
  rosterSyncPayload,
  variantById,
  variantForPeriod,
  variantsOf,
  versusSpawnOpts,
} from '../combat/variants/index.ts'
import { inferEmotion, nextBlinkDelay } from '../dialogue/DialogueTypes.ts'
import { resolveDialoguePortrait } from '../ui/portraits.ts'
import { allArcs, isMissionOpen, missionById, playableMissions, STORY_MISSIONS } from '../story/StoryCatalog.ts'
import { defaultStorySave } from '../story/types.ts'
import { PVE_ENEMIES } from '../story/pve/EnemyCatalog.ts'
import { STORY_ARCHIVES } from '../story/catalog/archives.ts'
import { MUSIC_TRACKS, trackById } from '../audio/music/catalog.ts'
import { resolveMusic, phaseFromBossHp, sameMusicFamily } from '../audio/music/resolve.ts'
import { BOOT_BRANDING } from '../boot/branding.ts'
import { bootLoadPercent } from '../boot/LoadProgress.ts'
import { UI_RECIPES } from '../audio/profiles/commonCatalog.ts'
import { LEITMOTIFS } from '../audio/music/scales.ts'
import { MusicRole } from '../audio/music/types.ts'
import { canReplace } from '../audio/music/priority.ts'

export interface CheckResult {
  passed: number
  failed: string[]
}

function assert(ok: boolean, message: string, result: CheckResult): void {
  if (ok) {
    result.passed += 1
  } else {
    result.failed.push(message)
  }
}

export function runFoundationChecks(): CheckResult {
  const result: CheckResult = { passed: 0, failed: [] }

  assert(clamp(150, 0, 100) === 100, 'clamp upper', result)
  assert(clamp(-2, 0, 100) === 0, 'clamp lower', result)
  assert(clamp(Number.NaN, 0, 100) === 0, 'clamp nan', result)

  assert(applyDamage(1000, 100, false) === 900, 'raw damage', result)
  assert(applyDamage(1000, 100, true, 0.25) === 975, 'guarded damage', result)
  assert(applyDamage(10, 50, false) === 0, 'hp floor', result)

  assert(regenResource(90, 100, 20) === 100, 'energy cap', result)
  assert(spendResource(40, 10) === 30, 'energy spend', result)
  assert(spendResource(5, 10) === 5, 'energy refuse overspend', result)
  assert(canSpend(50, 50), 'can spend exact', result)
  assert(!canSpend(10, 11), 'cannot overspend', result)

  const rimuru = new Rimuru()
  const milim = new Milim()
  assert(rimuru.hp === rimuru.def.maxHp, 'rimuru hp', result)
  assert(milim.alive, 'milim alive', result)
  rimuru.hp = 0
  rimuru.state = FighterState.DEAD
  assert(!rimuru.alive, 'rimuru defeat', result)

  const pool = new ObjectPool(() => ({ n: 0 }), (item) => {
    item.n = 0
  }, 1)
  const a = pool.acquire()
  a.n = 7
  pool.release(a)
  assert(pool.activeCount === 0, 'pool release', result)

  const combo = new ComboSystem(500)
  combo.registerHit()
  combo.registerHit()
  assert(combo.hits === 2, 'combo increment', result)
  combo.update(600)
  assert(combo.hits === 0, 'combo timeout', result)

  const cds = new CooldownSystem()
  cds.start('skill', 1000)
  assert(!cds.ready('skill'), 'cooldown busy', result)
  cds.update(1000)
  assert(cds.ready('skill'), 'cooldown ready', result)

  assert(computeUlt(0, 50) === 50, 'ultimate gain', result)
  assert(computeUlt(90, 20) === 100, 'ultimate cap', result)
  assert(comboScale(1) === 1, 'combo scale first', result)
  assert(comboScale(6) < 0.7, 'combo scale later', result)
  const perfect = computeHit(1000, {
    id: 't', name: 't', kind: 'MELEE', damage: 100, knockback: 0, knockbackY: 0, stun: 0, hitstun: 8,
    energyGain: 0, energyCost: 0, startup: 1, active: 1, recovery: 1, hitWidth: 10, hitHeight: 10, hitOffsetX: 0, hitOffsetY: 0,
  }, { guarding: true, perfectGuard: true, armor: false, defense: 0, comboHits: 0 })
  assert(perfect.dealt === 0 && perfect.perfect, 'perfect guard', result)
  assert(resistMultiplier(1) === 0, 'immunity', result)
  assert(resistMultiplier(0.5) === 0.5, 'half resist', result)
  assert(kitFor(FighterId.guy).ultimate.damage > 0, 'guy kit', result)
  assert(kitFor(FighterId.diablo).skills.length === 4, 'diablo kit', result)
  const progressed = addFightResult(defaultProgress(), true)
  assert(progressed.wins === 1 && progressed.coins > 0, 'progress win', result)
  const guest = defaultSave()
  assert(guest.account.kind === AccountKind.GUEST && guest.account.credentials === null, 'guest account', result)
  assert(!validEmail('not-an-email') && validPassword('stormdragon'), 'auth validators', result)
  const granted = grantCredits(guest.inventory, guest.economy, 100, 'test_grant')
  assert(granted.ok && granted.balance === 100, 'ledger grant credits', result)
  if (granted.ok) {
    guest.inventory = granted.inventory
    guest.economy = granted.economy
  }
  const spent = spendCredits(guest.inventory, guest.economy, 40, 'test_spend', 'test-sku')
  assert(spent.ok && spent.balance === 60, 'ledger spend credits', result)
  const broke = spendCredits(
    spent.ok ? spent.inventory : guest.inventory,
    spent.ok ? spent.economy : guest.economy,
    9999,
    'test_overspend',
  )
  assert(!broke.ok, 'ledger refuse overspend', result)
  const premium = requestPremiumPurchase('gems_500')
  assert(!premium.ok && premium.reason === 'payments_not_enabled', 'premium purchase rejected', result)
  const fakePremium = grantPremiumFromServer(guest.inventory, guest.economy, 500, 'client_forged')
  assert(!fakePremium.ok, 'premium needs server receipt', result)
  const serverPremium = grantPremiumFromServer(guest.inventory, guest.economy, 10, 'srv_test_receipt')
  assert(serverPremium.ok && serverPremium.balance === 10, 'premium server receipt', result)
  const shopSave = defaultSave()
  const funded = grantCredits(shopSave.inventory, shopSave.economy, 400, 'test_shop_fund')
  if (funded.ok) {
    shopSave.inventory = funded.inventory
    shopSave.economy = funded.economy
  }
  const bought = buyCosmetic(shopSave, 'skin-rimuru-gold', 400)
  assert(bought.ok === true, 'shop buy via ledger', result)
  if (bought.ok) {
    assert(bought.data.inventory.credits === 0, 'shop debit credits', result)
    assert(bought.data.collection.cosmetics.includes('skin-rimuru-gold'), 'shop unlocks collection', result)
    bought.data.story = defaultStorySave()
    assert(bought.data.collection.cosmetics.includes('skin-rimuru-gold'), 'reset story keeps collection', result)
  }
  const fightSave = defaultSave()
  applyFightToSave(fightSave, true)
  assert(fightSave.profile.wins === 1 && fightSave.inventory.credits > 0, 'fight grants via ledger', result)
  assert(fightSave.economy.ledger.some((entry) => entry.reason === 'match_win'), 'fight ledger entry', result)
  const exported = exportAccount(defaultSave())
  assert(!('credentials' in exported.account) && exported.account.email === null, 'export omits credentials', result)
  assert(ITEMS.length >= 10, 'live catalog quality over quantity', result)
  assert(BANNERS.every((banner) => {
    const sum = banner.rates.common + banner.rates.rare + banner.rates.epic + banner.rates.legendary + banner.rates.mythic
    return Math.abs(sum - 100) < 0.001
  }), 'banner rates sum to 100', result)
  const offerSave = defaultSave()
  const emptyBuy = purchaseOffer(offerSave, 'offer-skin-rimuru-gold')
  assert(!emptyBuy.ok, 'shop refuses without credits', result)
  const rich = defaultSave()
  const bag = grantCredits(rich.inventory, rich.economy, 400, 'test_offer')
  if (bag.ok) {
    rich.inventory = bag.inventory
    rich.economy = bag.economy
  }
  const offerBuy = purchaseOffer(rich, 'offer-skin-rimuru-gold')
  assert(offerBuy.ok === true && ownsItem(rich, 'skin-rimuru-gold'), 'shop catalog price', result)
  const twice = purchaseOffer(rich, 'offer-skin-rimuru-gold')
  assert(!twice.ok, 'shop anti duplicate', result)
  const chest = defaultSave()
  const tix = grantTickets(chest.inventory, chest.economy, 1, 'test_ticket')
  if (tix.ok) {
    chest.inventory = tix.inventory
    chest.economy = tix.economy
  }
  chest.live.pity['chest-tempest'] = { pulls: 49, sinceLegendary: 49, sinceMythic: 10 }
  const pull = summon(chest, 'chest-tempest', 1)
  assert(pull.ok === true && pull.ok && pull.drops.length === 1, 'summon x1', result)
  assert(pull.ok && chest.live.pity['chest-tempest']?.sinceLegendary === 0, 'summon pity resets at 50', result)
  if (pull.ok) {
    chest.story = defaultStorySave()
    assert(chest.live.acquisitions.length > 0, 'summon keeps live after story wipe field', result)
  }
  const validated = network.validate({ damage: -4, hp: 10, energy: 10, ultimate: 200, winner: null })
  assert(validated.damage === 0 && validated.ultimate === 100, 'server validate', result)
  assert(kitFor(FighterId.shuna).skills[0].name.length > 0, 'shuna kit', result)
  assert(kitFor(FighterId.souei).skills.length === 4, 'souei kit', result)
  assert(hitStopFor(300, true) >= 90, 'hitstop ultimate', result)
  assert(LAUNCH_ROSTER.length >= 8, 'launch roster free', result)
  assert(CONTENT_ROADMAP.some((slot) => slot.status === 'planned'), 'roadmap planned', result)
  assert(placeholderAssets('rimuru').format === 'sprite2d', 'pipeline 2d', result)
  assert(STATE_TO_CLIP.IDLE === 'idle', 'sprite clip map', result)
  assert(ACTION_FOLDERS.includes('attack') && ACTION_FOLDERS.includes('idle'), 'action folders', result)
  assert(ACTION_FOLDERS.includes('switch_in') && ACTION_FOLDERS.includes('switch_out'), 'switch clips', result)
  assert(FX_SHEETS.length === 11, 'fx sheet catalog', result)
  assert(STAGES.length === 15, 'arena catalog', result)
  assert(allArcs().length === 12, 'story arcs to walpurgis', result)
  assert(playableMissions().length === 12, 'story playable through walpurgis', result)
  assert(missionById('cave_veldora')?.playable === true, 'cave mission playable', result)
  assert(missionById('ogres_survivors')?.playable === true, 'ogres mission playable', result)
  assert(missionById('orc_war')?.playable === true, 'orc war playable', result)
  assert(missionById('charybdis_siege')?.playable === true, 'charybdis playable', result)
  assert(missionById('walpurgis_banquet')?.playable === true, 'walpurgis playable', result)
  assert(isMissionOpen(playableMissions()[0]!, defaultStorySave()), 'prologue open', result)
  assert(STORY_MISSIONS.every((mission) => mission.beats.length > 0 || !mission.playable), 'playable missions have beats', result)
  assert(Object.keys(PVE_ENEMIES).length >= 10, 'pve fauna and bosses', result)
  assert(PVE_ENEMIES.giant_bat?.asset === 'TODO_ASSET', 'pve placeholder tagged', result)
  assert(PVE_ENEMIES.orc_soldier?.species === 'Orc', 'orc soldiers tagged canon', result)
  assert(PVE_ENEMIES.orc_disaster?.profile === 'boss', 'orc disaster is boss', result)
  assert(PVE_ENEMIES.charybdis?.profile === 'boss', 'charybdis is boss', result)
  assert(PVE_ENEMIES.clayman?.profile === 'boss', 'clayman is boss', result)
  assert(STORY_ARCHIVES.some((entry) => entry.id === 'kurobe' && entry.kind === 'personnage'), 'kurobe archive npc', result)
  assert(STORY_ARCHIVES.some((entry) => entry.id === 'walpurgis'), 'walpurgis archive', result)
  const storyDialogue = STORY_MISSIONS.flatMap((mission) => mission.beats).filter((beat) => beat.type === 'dialogue')
  assert(storyDialogue.every((beat) => beat.type === 'dialogue' && !beat.text.includes('Falmuth')), 'story dialogue uses Farmus', result)
  assert(storyDialogue.every((beat) => beat.type !== 'dialogue' || beat.speaker !== 'Great Sage' || !beat.text.includes('Recommandation')), 'great sage is not a coach', result)
  assert(storyDialogue.every((beat) => beat.type !== 'dialogue' || Boolean(beat.speaker.trim())), 'every dialogue has a speaker', result)
  assert(storyDialogue.every((beat) => beat.type !== 'dialogue' || beat.speaker !== 'Great Sage' || beat.text.startsWith('Réponse.')), 'great sage starts with Réponse.', result)
  const dialogueIssues = collectDialogueIssues()
  assert(dialogueIssues.length === 0, dialogueIssues[0] ?? 'dialogue first person', result)
  assert(isDialogueAdvanceEvent({ key: '+', code: 'Equal', repeat: false } as KeyboardEvent), 'plus advances dialogue', result)
  assert(isDialogueAdvanceEvent({ key: 'Enter', code: 'Enter', repeat: false } as KeyboardEvent), 'enter advances dialogue', result)
  assert(!isDialogueAdvanceEvent({ key: '+', code: 'Equal', repeat: true } as KeyboardEvent), 'repeat does not skip bubbles', result)
  assert(resolveDialoguePortrait({ speaker: 'Rimuru', speakerId: 'rimuru', missionId: 'prologue_reincarnation' }) === 'rimuru-slime', 'slime portrait in prologue', result)
  assert(resolveDialoguePortrait({ speaker: 'Great Sage', speakerId: 'rimuru', missionId: 'prologue_reincarnation' }) === 'great-sage', 'great sage portrait', result)
  assert(resolveDialoguePortrait({ speaker: 'Rimuru', speakerId: 'rimuru', missionId: 'shizu_ifrit' }) === 'rimuru-slime', 'slime portrait during shizu', result)
  assert(resolveDialoguePortrait({
    speaker: 'Rimuru',
    speakerId: 'rimuru',
    missionId: 'tempest_founded',
    story: { ...defaultStorySave(), completed: ['shizu_ifrit'] },
  }) === 'rimuru', 'human rimuru after shizu', result)
  assert(Boolean(missionById('shizu_ifrit')), 'shizu mission exists', result)
  assert(PVE_ENEMIES.ifrit?.profile === 'boss', 'ifrit is boss', result)
  assert(CHARACTER_SKINS.rimuru.some((item) => item.id === 'rimuru-slime' && item.body === 'slime'), 'rimuru slime skin', result)
  assert(CHARACTER_SKINS.rimuru.some((item) => item.id === 'rimuru-shizu'), 'rimuru shizu skin', result)
  const fresh = defaultStorySave()
  assert(appearanceFor('rimuru', { story: fresh, missionId: 'prologue_reincarnation' }).id === 'rimuru-slime', 'rimuru slime at start', result)
  assert(appearanceFor('rimuru', { story: fresh, missionId: 'shizu_ifrit' }).body === 'slime', 'rimuru slime during shizu', result)
  assert(appearanceFor('rimuru', { story: { ...fresh, completed: ['shizu_ifrit'] }, missionId: 'tempest_founded' }).id === 'rimuru-shizu', 'rimuru human after shizu', result)
  assert(appearanceFor('rimuru', { story: { ...fresh, completed: ['shizu_ifrit'] }, missionId: 'harvest_festival' }).id === 'rimuru-demon-lord', 'rimuru demon lord at harvest', result)
  assert(appearanceFor('rimuru', { story: fresh, speaker: 'Satoru Mikami', missionId: 'prologue_reincarnation' }).portrait === 'satoru', 'satoru speaker look', result)
  assert(appearanceFor('diablo', { story: fresh, speaker: 'Noir', missionId: 'harvest_festival' }).id === 'diablo-noir', 'noir before name', result)
  assert(appearanceFor('benimaru', { story: fresh, missionId: 'ogres_survivors' }).id === 'benimaru-ogre', 'benimaru ogre during meeting', result)
  assert(appearanceFor('benimaru', { story: { ...fresh, completed: ['ogres_survivors'] }, missionId: 'orc_war' }).id === 'benimaru-kijin', 'benimaru kijin after naming', result)
  assert(variantsOf('rimuru').length === 4, 'rimuru has 4 narrative variants', result)
  assert(variantsOf('milim').length === 1, 'milim has the catalog look only', result)
  assert(chronologyPeriods().length === STORY_MISSIONS.length, 'chronology periods are story missions', result)
  assert(variantForPeriod('rimuru', 'prologue_reincarnation').id === 'rimuru-slime', 'chronology prologue is slime', result)
  assert(variantForPeriod('rimuru', 'harvest_festival').id === 'rimuru-demon-lord', 'chronology harvest is demon lord', result)
  assert(variantById('rimuru-slime')?.selectableInVersus === false, 'slime variant is cinematic only', result)
  const early = resolveLoadout('rimuru', { mode: VariantMode.CHRONOLOGY, chronologyMissionId: 'goblin_wolves', story: fresh })
  assert(early.variantId === 'rimuru-slime' && early.movesetId === MovesetId.NARRATIVE, 'chronology goblins locks slime narrative', result)
  assert(attackIsAllowed(early, 'water-blade') && attackIsAllowed(early, 'predator'), 'early rimuru keeps cave skills', result)
  assert(!attackIsAllowed(early, 'rimuru-ult') && !attackIsAllowed(early, 'megiddo'), 'chronology blocks later rimuru skills', result)
  const whatIf = resolveLoadout('rimuru', {
    mode: VariantMode.CUSTOM,
    story: fresh,
    pick: { fighterId: 'rimuru', variantId: 'rimuru-demon-lord', movesetId: MovesetId.CUSTOM },
  })
  assert(whatIf.movesetId === MovesetId.CUSTOM && attackIsAllowed(whatIf, 'rimuru-ult'), 'custom what-if keeps full kit', result)
  const freeSpawn = versusSpawnOpts(resolveLoadout('rimuru', { mode: VariantMode.FREE, story: fresh }))
  assert(freeSpawn.body === 'sprite' && freeSpawn.form === 'rimuru-demon-lord', 'free versus keeps roster sheets', result)
  const chronoSpawn = versusSpawnOpts(early)
  assert(chronoSpawn.body === 'sprite' && chronoSpawn.form === 'rimuru-demon-lord', 'cinematic variant still fights on roster sheets', result)
  assert(kitForLoadout(early) === kitFor(FighterId.rimuru), 'variant kit reuses kitFor', result)
  const sync = rosterSyncPayload(VariantMode.CHRONOLOGY, 'walpurgis_banquet', [early], [whatIf])
  assert(sync.player[0]?.variantId === 'rimuru-slime' && sync.cpu[0]?.movesetId === MovesetId.CUSTOM, 'online syncs ids not png', result)
  assert(storyMomentId(fresh, 'cave_veldora') === 'IN:cave_veldora', 'moment in cave', result)
  assert(storyMomentId({ ...fresh, completed: ['orc_war'] }, 'orc_war') === 'AFTER:orc_war', 'moment after orc war', result)
  assert(collectVisualIssues().every((issue) => issue.code !== 'rimuru-human-too-early'), 'no human rimuru on new game', result)
  assert(collectVisualIssues().length === 0, collectVisualIssues()[0]?.detail ?? 'visual continuity', result)
  assert(missionById('ogres_survivors')!.beats.some((beat) => beat.type === 'transform' && beat.appearanceId === 'benimaru-kijin'), 'ogre naming transform beat', result)
  assert(missionById('harvest_festival')!.beats.some((beat) => beat.type === 'transform' && beat.appearanceId === 'diablo-named'), 'diablo naming transform beat', result)
  const caveTalk = missionById('cave_veldora')!.beats.filter((beat) => beat.type === 'dialogue')
  const iRimuruName = caveTalk.findIndex((beat) => beat.type === 'dialogue' && beat.text.includes('Tu seras Rimuru'))
  const iTempest = caveTalk.findIndex((beat) => beat.type === 'dialogue' && beat.text.includes('Tempest. Dragon de la Tempête'))
  const iPredator = caveTalk.findIndex((beat) => beat.type === 'dialogue' && beat.text.includes('[Predator]'))
  assert(iRimuruName >= 0 && iTempest > iRimuruName && iPredator > iTempest, 'veldora names rimuru then tempest then predator', result)
  const harvestTalk = missionById('harvest_festival')!.beats.filter((beat) => beat.type === 'dialogue')
  const iNoir = harvestTalk.findIndex((beat) => beat.type === 'dialogue' && beat.speaker === 'Noir')
  const iDiabloNamed = harvestTalk.findIndex((beat) => beat.type === 'dialogue' && beat.speaker === 'Diablo')
  assert(iNoir >= 0 && iNoir < iDiabloNamed, 'noir before diablo naming', result)
  const goblinSpeakers = missionById('goblin_wolves')!.beats.filter((beat) => beat.type === 'dialogue').map((beat) => beat.type === 'dialogue' ? beat.speaker : '')
  assert(goblinSpeakers.indexOf('Rigurd') < goblinSpeakers.indexOf('Rigur') && goblinSpeakers.indexOf('Rigur') < goblinSpeakers.indexOf('Gobta') && goblinSpeakers.indexOf('Gobta') < goblinSpeakers.indexOf('Ranga'), 'goblin naming order', result)
  assert(hasMeleeFrames({ fighterId: 'rimuru', clips: { attack: ['attack/01.png'] } } as SpriteManifest), 'melee frames', result)
  const px = new Uint8ClampedArray([
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 40, 180, 80, 255, 255, 255, 255, 255,
    255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
  ])
  assert(punchBackdrop(px, 3, 3) && (px[19] ?? 0) === 255 && (px[3] ?? 1) === 0 && (px[0] ?? 1) === 0, 'white bg punch', result)
  const box = alphaBounds(px, 3, 3, 0)
  assert(Boolean(box && box.w === 1 && box.h === 1), 'alpha crop box', result)
  const studio = new Uint8ClampedArray([
    8, 16, 28, 255, 8, 16, 28, 255, 8, 16, 28, 255,
    8, 16, 28, 255, 176, 234, 246, 240, 8, 16, 28, 255,
    8, 16, 28, 255, 255, 255, 255, 255, 8, 16, 28, 255,
  ])
  assert(punchBackdrop(studio, 3, 3, 'studio'), 'studio punch runs', result)
  assert((studio[3] ?? 1) === 0, 'studio navy punched', result)
  assert((studio[19] ?? 0) > 200 && (studio[16] ?? 0) > 150, 'studio keeps cyan gel', result)
  assert((studio[31] ?? 0) > 200 && (studio[28] ?? 0) === 255, 'studio keeps slime highlight', result)
  if (typeof document !== 'undefined') {
    const slime = document.createElement('canvas')
    slime.width = 32
    slime.height = 32
    const sctx = slime.getContext('2d')
    if (sctx) {
      drawRimuruSlime(sctx, 32, 32)
      const mid = sctx.getImageData(16, 18, 1, 1).data
      const corner = sctx.getImageData(1, 1, 1, 1).data
      assert((corner[3] ?? 1) === 0, 'slime corner transparent', result)
      assert((mid[3] ?? 0) > 180 && (mid[2] ?? 0) > (mid[0] ?? 255), 'slime body cyan gel', result)
    }
  }

  const registry = new CinematicRegistry()
  registerCinematics(registry)
  assert(registry.has('battle_intro'), 'cinematic battle intro', result)
  assert(registry.resolveId('ultimate_shion') === 'ultimate', 'cinematic ult fallback', result)
  assert(registry.resolveId('transform_guy') === 'transform', 'cinematic transform fallback', result)
  assert(registry.findInteraction('rimuru', 'diablo') !== null, 'cinematic interaction pair', result)
  assert(interactionKey('diablo', 'rimuru') === interactionKey('rimuru', 'diablo'), 'interaction key sort', result)
  const intro = registry.build('battle_intro', {
    playerTeam: ['rimuru', 'shuna', 'souei'],
    cpuTeam: ['milim', 'diablo', 'benimaru'],
  })
  assert(Boolean(intro && intro.duration > 0 && intro.steps.length > 0), 'cinematic intro build', result)
  assert(CHARACTERS.rimuru.cinematicUltimate === 'ultimate_rimuru', 'rimuru cinematic ult id', result)
  assert(impactTier(30, false, false) === 'light', 'impact light', result)
  assert(impactTier(80, false, false) === 'medium', 'impact medium', result)
  assert(impactTier(140, false, false) === 'heavy', 'impact heavy', result)
  assert(impactTier(80, true, false) === 'extreme', 'impact extreme ult', result)
  assert(styleFor('rimuru').energyType === 'water', 'rimuru combat style', result)
  assert(styleFor('milim').auraType === 'dragon', 'milim combat style', result)
  const auraStub = {
    alive: true,
    hp: 800,
    energy: 50,
    def: { maxHp: 1000, maxEnergy: 100 },
    state: FighterState.IDLE,
    transform: { active: false },
    attack: null,
  }
  assert(auraLevelFor(auraStub) === 'off', 'aura off default', result)
  assert(auraLevelFor({ ...auraStub, state: FighterState.ULTIMATE }) === 'max', 'aura max ult', result)
  assert(auraLevelFor({ ...auraStub, transform: { active: true } }) === 'off', 'aura off after transform burst', result)
  assert(auraLevelFor({ ...auraStub, transform: { active: true, remaining: 4800 } }) === 'power', 'aura power transform start', result)
  assert(
    auraLevelFor({
      ...auraStub,
      state: FighterState.SKILL,
      attack: { frame: 2, data: { startup: 12 } },
    }) === 'charging',
    'aura charging skill',
    result,
  )

  const audioIds = new Set<string>()
  for (const id of PLAYABLE_FIGHTERS) {
    const releases = skillReleaseIds(id)
    assert(releases.length === 5, `${id} 4 skills + ult sfx`, result)
    assert(new Set(releases).size === 5, `${id} unique skill sfx`, result)
    const profile = profileFor(id)
    assert(profile.skills[0].activate.id !== profile.skills[1].activate.id, `${id} skill 1 != 2`, result)
    assert(profile.skills[2].release.id !== profile.ultimate.release.id, `${id} skill 3 != ult`, result)
    assert(profile.talkIds.length === 6, `${id} talk palette`, result)
    for (const skill of profile.skills) {
      audioIds.add(skill.release.id)
    }
  }
  assert(audioIds.size === PLAYABLE_FIGHTERS.length * 4, 'global unique skill releases', result)
  const seen = new Set<number>()
  for (let i = 0; i < 4; i += 1) {
    seen.add(sfxEngine.nextIndex('hit-test-full', 4))
  }
  assert(seen.size === 4, 'variant bag no immediate full repeat', result)

  const blinkA = nextBlinkDelay()
  const blinkB = nextBlinkDelay()
  assert(blinkA >= 2200 && blinkA <= 4400, 'blink delay range a', result)
  assert(blinkB >= 2200 && blinkB <= 4400, 'blink delay range b', result)
  assert(inferEmotion('On y va ?') === 'surprised', 'emotion question', result)
  assert(inferEmotion('Drago Buster !') === 'excited', 'emotion short bang', result)
  assert(inferEmotion('Essaie de rester un peu raisonnable...') === 'sad', 'emotion ellipsis', result)
  const voiceIds = new Set<string>()
  for (const id of PLAYABLE_FIGHTERS) {
    const talks = talkRecipeIds(id)
    assert(talks.length === 6, `${id} talk variants`, result)
    assert(new Set(talks).size === 6, `${id} unique talk sfx`, result)
    assert(talks[0] !== talks[1], `${id} talk 1 != 2`, result)
    for (const name of talks) {
      voiceIds.add(name)
    }
  }
  assert(voiceIds.size === PLAYABLE_FIGHTERS.length * 6, 'global unique talk sfx', result)

  const silence = resolveMusic({ role: MusicRole.SILENCE })
  assert(silence.silence && silence.trackId === null, 'music silence', result)
  const menu = resolveMusic({ role: MusicRole.MENU })
  assert(menu.trackId === 'menu.main', 'music menu fallback', result)
  assert(resolveMusic({ role: MusicRole.MENU, storyEvent: 'boot' }).trackId === 'menu.boot', 'music boot signature', result)
  assert(BOOT_BRANDING.creatorName === 'Furin@', 'boot creator name', result)
  assert(BOOT_BRANDING.studioName === 'WyzixSoftware', 'boot studio name', result)
  assert(bootLoadPercent({ phaser: 1, manifests: true, sprites: 1, ready: false }) === 99, 'boot percent waits for ready', result)
  assert(bootLoadPercent({ phaser: 1, manifests: true, sprites: 1, ready: true }) === 100, 'boot percent 100 when ready', result)
  assert(bootLoadPercent({ phaser: 0.2, manifests: false, sprites: 0, ready: false }) < 20, 'boot percent tracks phaser', result)
  assert(Boolean(UI_RECIPES.boot && UI_RECIPES.bootCreator && UI_RECIPES.bootStudio && UI_RECIPES.bootDone), 'boot sfx recipes', result)
  assert(Boolean(trackById('menu.boot')), 'boot music track', result)
  const cave = resolveMusic({ role: MusicRole.EXPLORATION, location: 'sealed_cave', arc: 'sealed_cave', intensity: 0 })
  assert(cave.trackId === 'explore.sealed_cave', 'music cave explore', result)
  const caveDanger = resolveMusic({ role: MusicRole.EXPLORATION, location: 'sealed_cave', intensity: 3 })
  assert(caveDanger.trackId === 'explore.sealed_cave_danger', 'music cave danger', result)
  assert(resolveMusic({ role: MusicRole.BATTLE, arc: 'sealed_cave' }).trackId === 'battle.first', 'music first battle', result)
  assert(resolveMusic({ role: MusicRole.BOSS, boss: 'orc_disaster' }).trackId === 'boss.orc_disaster', 'music orc boss', result)
  assert(resolveMusic({ role: MusicRole.BOSS, boss: 'clayman', phase: 1 }).trackId === 'boss.clayman_p1', 'music clayman p1', result)
  assert(resolveMusic({ role: MusicRole.BOSS, boss: 'clayman', phase: 3 }).trackId === 'boss.clayman_final', 'music clayman final', result)
  assert(phaseFromBossHp(0.8) === 1 && phaseFromBossHp(0.4) === 2 && phaseFromBossHp(0.2) === 3, 'music boss hp phases', result)
  const tempestTeam = resolveMusic({
    role: MusicRole.BATTLE,
    playerCharacter: FighterId.rimuru,
    team: [FighterId.rimuru, FighterId.benimaru, FighterId.shion],
  })
  assert(tempestTeam.trackId === 'battle.tempest', 'music 3v3 tempest team', result)
  const switchKeep = resolveMusic({
    role: MusicRole.BATTLE,
    playerCharacter: FighterId.benimaru,
    team: [FighterId.rimuru, FighterId.benimaru, FighterId.shion],
  })
  assert(switchKeep.trackId === tempestTeam.trackId, 'music switch keeps battle track', result)
  assert(sameMusicFamily('boss.clayman_p1', 'boss.clayman_final'), 'music clayman family', result)
  assert(trackById('missing-track') === undefined, 'music missing track is undefined', result)
  assert(MUSIC_TRACKS.every((track) => !track.title.includes('Falmuth')), 'music titles use Farmus naming', result)
  assert(resolveMusic({ role: MusicRole.EXPLORATION, arc: 'falmuth' }).trackId === 'explore.farmus', 'music farmus invasion', result)
  assert(Boolean(LEITMOTIFS.rimuru && LEITMOTIFS.veldora && LEITMOTIFS.diablo && LEITMOTIFS.clayman), 'music core leitmotifs', result)
  assert(canReplace(30, 55, false) && !canReplace(82, 30, false), 'music priority battle over explore', result)
  assert(resolveMusic({ role: MusicRole.EXPLORATION, location: 'tempest_city', boss: 'clayman' }).trackId === 'explore.tempest_city', 'music explore not stuck on boss', result)

  return result
}

export async function runAccountAsyncChecks(): Promise<CheckResult> {
  const result: CheckResult = { passed: 0, failed: [] }
  const save = defaultSave()
  save.collection = unlockCollection(save.collection, { cosmetics: ['skin-rimuru-gold'] })
  const guestId = save.account.id
  const registered = await registerOnGuest(save.account, save.gdpr, {
    email: 'rimuru@tempest.test',
    password: 'stormdragon',
    displayName: 'Rimuru',
    privacyAccepted: true,
  })
  assert(registered.ok, 'register guest', result)
  if (registered.ok) {
    assert(registered.account.kind === AccountKind.REGISTERED, 'register kind', result)
    assert(registered.account.id === guestId, 'register keeps id', result)
    assert(registered.account.claimedFromGuestId === guestId, 'register claims guest', result)
    assert(
      Boolean(registered.account.credentials && !registered.account.credentials.hash.includes('stormdragon')),
      'password hashed',
      result,
    )
    save.account = registered.account
    save.gdpr = registered.gdpr
    const login = await verifyLogin(save.account, 'rimuru@tempest.test', 'stormdragon')
    assert(login, 'login after register', result)
    const dumped = JSON.stringify(exportAccount(save))
    assert(!dumped.includes(save.account.credentials?.hash ?? 'missing-hash'), 'export json omits hash', result)
  }
  assert(save.collection.cosmetics.includes('skin-rimuru-gold'), 'register keeps collection', result)
  const noPrivacy = await registerOnGuest(defaultSave().account, defaultSave().gdpr, {
    email: 'a@b.co',
    password: 'stormdragon',
    displayName: 'X',
    privacyAccepted: false,
  })
  assert(!noPrivacy.ok && noPrivacy.reason === 'privacy_required', 'register requires privacy', result)
  return result
}

function computeUlt(current: number, add: number): number {
  return Math.min(100, current + add)
}
