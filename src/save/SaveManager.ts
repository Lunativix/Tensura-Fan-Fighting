import type { ProgressData } from '../progression/Progression.ts'
import { defaultProgress } from '../progression/Progression.ts'
import { defaultStorySave, type StorySaveSlice } from '../story/types.ts'
import { restoreInputSave, snapshotInputSave, type InputSaveSlice } from '../input/BindingStore.ts'
import { clamp } from '../gameplay/Resources.ts'
import { defaultMusicSettings, type MusicSettingsSlice } from '../audio/music/types.ts'
import { AccountKind, type AccountSlice, type CollectionSlice, type EconomySlice, type GameProfileSlice, type GdprSlice, type InventorySlice } from '../account/types.ts'
import { defaultAccount, defaultCollection, defaultEconomy, defaultGdpr, defaultInventory, defaultProfile } from '../account/defaults.ts'
import { grantCredits, recomputeFromLedger } from '../account/economy.ts'
import { unique } from '../account/crypto.ts'
import { touchAccount } from '../account/auth.ts'
import { defaultLive, mergeLive } from '../live/defaults.ts'
import type { LiveSaveSlice } from '../live/types.ts'

export interface SaveSettings {
  musicVolume: number
  sfxVolume: number
  language: string
  quality: 'low' | 'medium' | 'high'
  vibration: boolean
  screenFx: boolean
  aiDifficulty: 'EASY' | 'NORMAL' | 'HARD' | 'EXPERT'
  input: InputSaveSlice
  battleMusicVolume: number
  cinematicMusicVolume: number
  menuMusicVolume: number
  musicDynamic: boolean
  musicVariation: boolean
}

export interface SaveData {
  version: number
  settings: SaveSettings
  account: AccountSlice
  profile: GameProfileSlice
  story: StorySaveSlice
  collection: CollectionSlice
  inventory: InventorySlice
  economy: EconomySlice
  gdpr: GdprSlice
  live: LiveSaveSlice
  /** Compatibility mirror of profile + credits. Do not treat coins as authoritative. */
  progress: ProgressData
}

const SAVE_KEY = 'tensura-fan-fighting-save'
const SAVE_VERSION = 7

function defaultSettings(): SaveSettings {
  return {
    musicVolume: 0.35,
    sfxVolume: 0.5,
    language: 'en',
    quality: 'high',
    vibration: true,
    screenFx: true,
    aiDifficulty: 'NORMAL',
    input: snapshotInputSave(),
    ...defaultMusicSettings(),
  }
}

export function defaultSave(): SaveData {
  return syncMirror({
    version: SAVE_VERSION,
    settings: defaultSettings(),
    account: defaultAccount(),
    profile: defaultProfile(),
    story: defaultStorySave(),
    collection: defaultCollection(),
    inventory: defaultInventory(),
    economy: defaultEconomy(),
    gdpr: defaultGdpr(),
    live: defaultLive(),
    progress: defaultProgress(),
  })
}

export function syncMirror(data: SaveData): SaveData {
  data.progress = {
    xp: data.profile.xp,
    level: data.profile.level,
    coins: data.inventory.credits,
    wins: data.profile.wins,
    losses: data.profile.losses,
    titles: data.profile.titles,
    ownedItems: data.collection.cosmetics,
    equippedTitle: data.profile.equippedTitle,
    lastWinDay: data.profile.lastWinDay,
  }
  return data
}

function migrate(raw: unknown): SaveData {
  const base = defaultSave()
  if (!raw || typeof raw !== 'object') {
    return base
  }
  const data = raw as Partial<SaveData> & { progress?: ProgressData, story?: StorySaveSlice, settings?: Partial<SaveSettings> }
  const settings = data.settings ?? base.settings
  const progress = { ...defaultProgress(), ...(data.progress ?? {}) }
  const account = { ...defaultAccount(), ...(data.account ?? {}) }
  if (!account.id) {
    account.id = defaultAccount().id
  }
  if (account.kind !== AccountKind.GUEST && account.kind !== AccountKind.REGISTERED) {
    account.kind = AccountKind.GUEST
  }
  const profile: GameProfileSlice = {
    ...defaultProfile(),
    ...(data.profile ?? {}),
    level: data.profile?.level ?? progress.level,
    xp: data.profile?.xp ?? progress.xp,
    wins: data.profile?.wins ?? progress.wins,
    losses: data.profile?.losses ?? progress.losses,
    titles: data.profile?.titles ?? progress.titles,
    equippedTitle: data.profile?.equippedTitle ?? progress.equippedTitle,
    lastWinDay: data.profile?.lastWinDay ?? progress.lastWinDay,
  }
  let collection: CollectionSlice = {
    ...defaultCollection(),
    ...(data.collection ?? {}),
    cosmetics: unique(data.collection?.cosmetics ?? [], progress.ownedItems),
    characters: unique(data.collection?.characters ?? [...defaultCollection().characters], data.story?.unlockedCharacters),
    codex: unique(data.collection?.codex ?? [], data.story?.archives),
    emotes: data.collection?.emotes ?? [],
    vfx: data.collection?.vfx ?? [],
    cards: data.collection?.cards ?? [],
    animations: data.collection?.animations ?? [],
  }
  let inventory: InventorySlice = {
    ...defaultInventory(),
    ...(data.inventory ?? {}),
    items: unique(data.inventory?.items ?? [], progress.ownedItems),
  }
  let economy: EconomySlice = {
    ...defaultEconomy(),
    ...(data.economy ?? {}),
    ledger: data.economy?.ledger ?? [],
    purchases: data.economy?.purchases ?? [],
    summons: data.economy?.summons ?? [],
  }
  if (economy.ledger.length === 0 && progress.coins > 0) {
    const opened = grantCredits(inventory, economy, progress.coins, 'migrate_legacy_coins')
    if (opened.ok) {
      inventory = opened.inventory
      economy = opened.economy
    }
  } else if (economy.ledger.length > 0) {
    const recomputed = recomputeFromLedger(economy)
    inventory = {
      ...inventory,
      credits: recomputed.credits,
      premium: recomputed.premium,
      tickets: recomputed.tickets,
      fragments: recomputed.fragments,
    }
  }

  const migrated: SaveData = {
    version: SAVE_VERSION,
    settings: {
      musicVolume: clamp(Number(settings.musicVolume) || 0.35, 0, 1),
      sfxVolume: clamp(Number(settings.sfxVolume) || 0.5, 0, 1),
      language: typeof settings.language === 'string' ? settings.language : 'en',
      quality: settings.quality === 'low' || settings.quality === 'medium' ? settings.quality : 'high',
      vibration: settings.vibration !== false,
      screenFx: settings.screenFx !== false,
      aiDifficulty: settings.aiDifficulty === 'EASY' || settings.aiDifficulty === 'HARD' || settings.aiDifficulty === 'EXPERT'
        ? settings.aiDifficulty
        : 'NORMAL',
      input: settings.input ?? snapshotInputSave(),
      battleMusicVolume: clamp(Number((settings as MusicSettingsSlice).battleMusicVolume) || 1, 0, 1),
      cinematicMusicVolume: clamp(Number((settings as MusicSettingsSlice).cinematicMusicVolume) || 1, 0, 1),
      menuMusicVolume: clamp(Number((settings as MusicSettingsSlice).menuMusicVolume) || 0.9, 0, 1),
      musicDynamic: (settings as MusicSettingsSlice).musicDynamic !== false,
      musicVariation: (settings as MusicSettingsSlice).musicVariation !== false,
    },
    account,
    profile,
    story: { ...defaultStorySave(), ...(data.story ?? {}) },
    collection,
    inventory,
    economy,
    gdpr: { ...defaultGdpr(), ...(data.gdpr ?? {}) },
    live: mergeLive(data.live),
    progress,
  }
  restoreInputSave(migrated.settings.input)
  return syncMirror(migrated)
}

export class SaveManager {
  private cache: SaveData | null = null

  load(): SaveData {
    if (this.cache) {
      return this.cache
    }
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      this.cache = raw ? migrate(JSON.parse(raw) as unknown) : defaultSave()
      if (!raw) {
        restoreInputSave(undefined)
      }
      this.cache.account = touchAccount(this.cache.account)
      this.save(this.cache)
      return this.cache
    } catch {
      restoreInputSave(undefined)
      this.cache = defaultSave()
      this.save(this.cache)
      return this.cache
    }
  }

  save(data: SaveData): void {
    try {
      data.settings.input = snapshotInputSave()
      data.account = touchAccount(data.account)
      data.version = SAVE_VERSION
      this.cache = syncMirror(data)
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.cache))
    } catch {
      this.cache = syncMirror(data)
    }
  }

  replace(data: SaveData): void {
    this.cache = null
    this.save(data)
  }

  wipeLocal(): SaveData {
    try {
      localStorage.removeItem(SAVE_KEY)
    } catch {
      /* ignore */
    }
    this.cache = defaultSave()
    this.save(this.cache)
    restoreInputSave(undefined)
    return this.cache
  }
}

export const saveManager = new SaveManager()
