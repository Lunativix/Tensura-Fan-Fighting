import Phaser from 'phaser'
import { CHARACTERS, PLAYABLE_FIGHTERS } from '../config/characters.ts'
import { flavorOf } from '../config/rosterFlavor.ts'
import { kitFor } from '../config/skills.ts'
import { GameFlow, type FighterIdValue } from '../types/game.ts'
import { session } from '../game/GameState.ts'
import { SceneKeys } from '../game/SceneKeys.ts'
import { audio } from '../audio/AudioManager.ts'
import { musicManager } from '../audio/music/MusicManager.ts'
import { MusicRole } from '../audio/music/types.ts'
import { MenuInput } from '../input/MenuInput.ts'
import { FONT, FONT_UI, UI } from '../ui/theme.ts'
import { portraitHeadKey } from '../ui/portraits.ts'
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../engine/Time.ts'
import { saveManager } from '../save/SaveManager.ts'
import { spawnIdleFighter } from '../live/preview.ts'
import { storySkinFor } from '../config/characterSkins.ts'
import { loadStory } from '../story/StoryProgress.ts'
import { ensureSlimeTextures, SLIME_BODY_KEY } from '../characters/slimeLook.ts'
import {
  CollectionTab,
  collectionProgress,
  itemsForTab,
  displayNameForItem,
  toggleFavorite,
  equipItem,
  characterOwned,
  clearNewFlag,
  type CollectionTabId,
} from '../live/collection.ts'
import { ownsItem } from '../live/grant.ts'
import { rarityOf } from '../live/rarity.ts'
import { itemById } from '../live/catalog.ts'

const TABS: { id: CollectionTabId, label: string }[] = [
  { id: CollectionTab.CHARACTERS, label: 'PERSONNAGES' },
  { id: CollectionTab.APPEARANCES, label: 'APPARENCES' },
  { id: CollectionTab.COSMETICS, label: 'COSMETIQUES' },
  { id: CollectionTab.MUSIC, label: 'MUSIQUES' },
  { id: CollectionTab.CARDS, label: 'CARTES' },
]

const COLS = 4
const TILE = 124
const GAP = 16

export class CharactersScene extends Phaser.Scene {
  private inputMenu!: MenuInput
  private tab = 0
  private cursor = 0
  private ids: FighterIdValue[] = []
  private itemIds: string[] = []
  private tiles: Phaser.GameObjects.Rectangle[] = []
  private tileArt: Phaser.GameObjects.GameObject[] = []
  private tabLabels: Phaser.GameObjects.Text[] = []
  private nameTxt!: Phaser.GameObjects.Text
  private metaTxt!: Phaser.GameObjects.Text
  private bioTxt!: Phaser.GameObjects.Text
  private statTxt!: Phaser.GameObjects.Text
  private progressTxt!: Phaser.GameObjects.Text
  private idle?: Phaser.GameObjects.GameObject
  private pose: 'idle' | 'skill' | 'ult' = 'idle'

  constructor() {
    super(SceneKeys.Characters)
  }

  create(): void {
    session.flow = GameFlow.CHARACTERS
    musicManager.playContext({ role: MusicRole.MENU, storyEvent: 'collection', intensity: 1 }, true)
    this.drawBackdrop()
    this.add.text(80, 28, 'COLLECTION', { fontFamily: FONT, fontSize: '40px', color: UI.gold })
    this.progressTxt = this.add.text(80, 78, '', { fontFamily: FONT_UI, fontSize: '18px', color: UI.muted })
    this.add.text(1840, 32, 'RETOUR', { fontFamily: FONT_UI, fontSize: '20px', color: UI.paper }).setOrigin(1, 0)
      .setInteractive({ useHandCursor: true }).on('pointerup', () => this.leave())
    this.tabLabels = TABS.map((tab, i) => {
      const label = this.add.text(80, 118, tab.label, {
        fontFamily: FONT_UI, fontSize: '16px', color: UI.muted,
      }).setInteractive({ useHandCursor: true })
      label.on('pointerup', () => {
        this.tab = i
        this.cursor = 0
        audio.playSfx('tab')
        this.rebuild()
      })
      return label
    })
    this.layoutTabs()
    this.nameTxt = this.add.text(80, 748, '', { fontFamily: FONT, fontSize: '36px', color: UI.paper })
    this.metaTxt = this.add.text(80, 792, '', { fontFamily: FONT_UI, fontSize: '18px', color: UI.gold })
    this.bioTxt = this.add.text(80, 828, '', {
      fontFamily: FONT_UI, fontSize: '16px', color: UI.paper, wordWrap: { width: 880 },
    })
    this.statTxt = this.add.text(1040, 748, '', {
      fontFamily: FONT_UI, fontSize: '16px', color: UI.muted, wordWrap: { width: 760 },
    })
    this.inputMenu = new MenuInput()
    this.inputMenu.attach()
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.inputMenu.detach())
    this.input.keyboard?.on('keydown-F', () => this.toggleFav())
    ensureSlimeTextures(this, true)
    this.rebuild()
  }

  update(): void {
    if (this.inputMenu.justBack) {
      this.leave()
      return
    }
    if (this.inputMenu.justPrevTab) {
      this.tab = (this.tab - 1 + TABS.length) % TABS.length
      this.cursor = 0
      audio.playSfx('tab')
      this.rebuild()
    }
    if (this.inputMenu.justNextTab) {
      this.tab = (this.tab + 1) % TABS.length
      this.cursor = 0
      audio.playSfx('tab')
      this.rebuild()
    }
    const count = this.tabId() === CollectionTab.CHARACTERS ? this.ids.length : this.itemIds.length
    if (count === 0) {
      return
    }
    if (this.inputMenu.justLeft) {
      this.move(-1, count)
    }
    if (this.inputMenu.justRight) {
      this.move(1, count)
    }
    if (this.inputMenu.justUp) {
      this.move(-COLS, count)
    }
    if (this.inputMenu.justDown) {
      this.move(COLS, count)
    }
    if (this.inputMenu.justConfirm) {
      this.confirm()
    }
  }

  private tabId(): CollectionTabId {
    return TABS[this.tab]?.id ?? CollectionTab.CHARACTERS
  }

  private move(delta: number, count: number): void {
    this.cursor = (this.cursor + delta + count) % count
    audio.playSfx('move')
    this.refresh()
  }

  private layoutTabs(): void {
    let x = 80
    this.tabLabels.forEach((label) => {
      label.setPosition(x, 118)
      x += label.width + 36
    })
  }

  private clearGrid(): void {
    this.tiles.forEach((tile) => tile.destroy())
    this.tileArt.forEach((obj) => obj.destroy())
    this.tiles = []
    this.tileArt = []
  }

  private rebuild(): void {
    this.clearGrid()
    this.ids = PLAYABLE_FIGHTERS
    this.itemIds = itemsForTab(this.tabId()).map((item) => item.id)
    const entries = this.tabId() === CollectionTab.CHARACTERS ? this.ids.length : this.itemIds.length
    this.cursor = Phaser.Math.Clamp(this.cursor, 0, Math.max(0, entries - 1))
    const originX = 1040
    const originY = 210
    const story = loadStory()
    for (let i = 0; i < entries; i += 1) {
      const col = i % COLS
      const row = Math.floor(i / COLS)
      const x = originX + col * (TILE + GAP)
      const y = originY + row * (TILE + GAP)
      const tile = this.add.rectangle(x, y, TILE, TILE, 0x102038, 0.92)
      tile.setStrokeStyle(3, 0xffffff, 0.22)
      tile.setInteractive({ useHandCursor: true })
      tile.on('pointerover', () => {
        this.cursor = i
        this.refresh()
      })
      tile.on('pointerup', () => {
        this.cursor = i
        this.confirm()
      })
      this.tiles.push(tile)
      this.paintTile(i, x, y, story)
    }
    this.tabLabels.forEach((label, i) => label.setColor(i === this.tab ? UI.gold : UI.muted))
    this.refresh()
  }

  private paintTile(index: number, x: number, y: number, story = loadStory()): void {
    if (this.tabId() === CollectionTab.CHARACTERS) {
      const id = this.ids[index]
      if (!id) {
        return
      }
      const slime = id === 'rimuru' && storySkinFor(id, story).body === 'slime'
      if (slime && this.textures.exists(SLIME_BODY_KEY)) {
        const blob = this.add.image(x, y - 4, SLIME_BODY_KEY)
        blob.setDisplaySize(TILE - 28, TILE - 28)
        this.tileArt.push(blob)
      } else {
        const headKey = portraitHeadKey(id)
        if (this.textures.exists(headKey)) {
          const head = this.add.image(x, y - 8, headKey)
          head.setDisplaySize(TILE - 22, TILE - 28)
          this.tileArt.push(head)
        } else {
          const mark = this.add.circle(x, y - 10, 36, CHARACTERS[id].color, 1)
          mark.setStrokeStyle(3, CHARACTERS[id].accent, 0.9)
          this.tileArt.push(mark)
        }
      }
      const caption = this.add.text(x, y + 46, CHARACTERS[id].name, {
        fontFamily: FONT_UI, fontSize: '13px', color: UI.paper, align: 'center',
      }).setOrigin(0.5, 0)
      this.tileArt.push(caption)
      return
    }
    const itemId = this.itemIds[index]
    const item = itemId ? itemById(itemId) : undefined
    const data = saveManager.load()
    if (!item) {
      return
    }
    const owned = ownsItem(data, item.id)
    const hidden = item.spoiler && !data.live.encountered.includes(item.fighterId ?? '') && !owned
    if (item.fighterId && this.textures.exists(portraitHeadKey(item.fighterId)) && !hidden) {
      const head = this.add.image(x, y - 8, portraitHeadKey(item.fighterId))
      head.setDisplaySize(TILE - 22, TILE - 28)
      head.setAlpha(owned ? 1 : 0.38)
      this.tileArt.push(head)
    } else {
      const mark = this.add.text(x, y - 8, hidden ? '?' : item.name.slice(0, 1).toUpperCase(), {
        fontFamily: FONT, fontSize: '42px', color: owned ? UI.gold : UI.muted,
      }).setOrigin(0.5)
      this.tileArt.push(mark)
    }
    const caption = this.add.text(x, y + 46, hidden ? '????' : item.name, {
      fontFamily: FONT_UI, fontSize: '12px', color: owned ? UI.paper : UI.muted,
      align: 'center', wordWrap: { width: TILE - 8 },
    }).setOrigin(0.5, 0)
    this.tileArt.push(caption)
  }

  private refresh(): void {
    const data = saveManager.load()
    const progress = collectionProgress(data)
    const tabItems = itemsForTab(this.tabId())
    const tabOwned = tabItems.filter((item) => ownsItem(data, item.id)).length
    if (this.tabId() === CollectionTab.CHARACTERS) {
      this.progressTxt.setText(`${this.ids.length} personnages   Q/E pour changer d’onglet`)
    } else {
      this.progressTxt.setText(
        `${tabOwned} / ${tabItems.length} dans l’onglet   Collection ${progress.owned} / ${progress.total}   Q/E   F favori   Entrée équiper`,
      )
    }
    this.tiles.forEach((tile, i) => {
      tile.setStrokeStyle(4, i === this.cursor ? 0xffd54f : 0xffffff, i === this.cursor ? 1 : 0.2)
    })
    this.idle?.destroy()
    this.idle = undefined
    if (this.tabId() === CollectionTab.CHARACTERS) {
      const id = this.ids[this.cursor] ?? 'rimuru'
      const def = CHARACTERS[id]
      const flavor = flavorOf(id)
      const kit = kitFor(id)
      const owned = characterOwned(data, id)
      const skin = storySkinFor(id, loadStory())
      this.idle = spawnIdleFighter(this, 390, 700, id, 0.62, skin.body)
      this.nameTxt.setText(def.name.toUpperCase())
      this.metaTxt.setText(`${flavor.role}  •  ${flavor.elementLabel}  •  ${owned ? 'Obtenu' : 'Roster de base'}`)
      this.bioTxt.setText(flavor.quote)
      this.statTxt.setText(
        `Skill 1  ${kit.skills[0].name}\nSkill 2  ${kit.skills[1].name}\nSkill 3  ${kit.skills[2].name}\nSkill 4  ${kit.skills[3].name}\nUlt  ${kit.ultimate.name}\n${def.description}`,
      )
      return
    }
    const itemId = this.itemIds[this.cursor]
    const item = itemId ? itemById(itemId) : undefined
    if (!item) {
      this.nameTxt.setText('')
      this.metaTxt.setText('')
      this.bioTxt.setText('Rien dans cet onglet.')
      this.statTxt.setText('')
      return
    }
    const owned = ownsItem(data, item.id)
    const rarity = rarityOf(item.rarity)
    const fav = data.live.favorites.includes(item.id)
    const neu = data.live.newFlags.includes(item.id)
    this.nameTxt.setText(displayNameForItem(data, item).toUpperCase())
    this.nameTxt.setColor(owned ? rarity.color : '#607d8b')
    this.metaTxt.setText(`${rarity.label}  •  ${item.kind}  •  ${owned ? 'Possédé' : 'Verrouillé'}${fav ? '  ★' : ''}${neu ? '  NEW' : ''}`)
    this.bioTxt.setText(owned || !item.spoiler ? item.description : 'Rencontre-le dans l’histoire pour en savoir plus.')
    this.statTxt.setText(owned ? 'Entrée : équiper (Versus)    F : favori\nLe Story Mode ignore ces skins.' : 'Achetable en boutique ou via coffre.')
    if (item.fighterId) {
      this.idle = spawnIdleFighter(this, 390, 700, item.fighterId, 0.62)
    }
  }

  private toggleFav(): void {
    if (this.tabId() === CollectionTab.CHARACTERS) {
      return
    }
    const itemId = this.itemIds[this.cursor]
    if (!itemId) {
      return
    }
    const data = saveManager.load()
    toggleFavorite(data, itemId)
    saveManager.save(data)
    audio.playSfx('notify')
    this.refresh()
  }

  private confirm(): void {
    const data = saveManager.load()
    if (this.tabId() === CollectionTab.CHARACTERS) {
      audio.playSfx('confirm')
      this.pose = this.pose === 'idle' ? 'skill' : this.pose === 'skill' ? 'ult' : 'idle'
      this.refresh()
      return
    }
    const itemId = this.itemIds[this.cursor]
    if (!itemId) {
      return
    }
    if (!ownsItem(data, itemId)) {
      audio.playSfx('error')
      return
    }
    const item = itemById(itemId)
    if (item?.fighterId) {
      equipItem(data, item.fighterId, itemId)
    }
    clearNewFlag(data, itemId)
    saveManager.save(data)
    audio.playSfx('unlock')
    this.refresh()
  }

  private leave(): void {
    audio.playSfx('back')
    this.scene.start(SceneKeys.Hub)
  }

  private drawBackdrop(): void {
    this.add.rectangle(960, 540, LOGICAL_WIDTH, LOGICAL_HEIGHT, 0x08101c, 1)
    const g = this.add.graphics()
    g.fillGradientStyle(0x102038, 0x0a1424, 0x1a1030, 0x081018, 1)
    g.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT)
    g.fillStyle(0x4fc3f7, 0.06)
    g.fillCircle(390, 460, 340)
    g.lineStyle(2, 0xd4b45a, 0.22)
    g.strokeRect(24, 16, 1872, 1048)
  }
}
