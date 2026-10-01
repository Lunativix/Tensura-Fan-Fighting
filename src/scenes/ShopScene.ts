import Phaser from 'phaser'
import { audio } from '../audio/AudioManager.ts'
import { musicManager } from '../audio/music/MusicManager.ts'
import { MusicRole } from '../audio/music/types.ts'
import { saveManager } from '../save/SaveManager.ts'
import { SceneKeys } from '../game/SceneKeys.ts'
import { drawMenuBackdrop } from '../ui/Backdrop.ts'
import { MenuInput } from '../input/MenuInput.ts'
import { FONT, FONT_UI, UI } from '../ui/theme.ts'
import { drawCurrencyBar, currencyBarText } from '../ui/CurrencyBar.ts'
import { spawnIdleFighter } from '../live/preview.ts'
import { featuredOffer, offersIn, purchaseOffer } from '../live/shop.ts'
import { itemById, ownsItem } from '../live/index.ts'
import { ShopCategory, type ShopCategoryId, type ShopOffer } from '../live/types.ts'
import { rarityOf } from '../live/rarity.ts'
import { activeEvents, formatCountdown, remainingMs } from '../live/events.ts'
import { isDevPurchaseMode } from '../live/payment.ts'
import { FighterId } from '../types/game.ts'
import { AssetKeys } from '../assets/AssetKeys.ts'

const TABS: { id: ShopCategoryId, label: string }[] = [
  { id: ShopCategory.FEATURED, label: 'VEDETTE' },
  { id: ShopCategory.APPEARANCES, label: 'APPARENCES' },
  { id: ShopCategory.COSMETICS, label: 'COSMETIQUES' },
  { id: ShopCategory.PACKS, label: 'PACKS' },
  { id: ShopCategory.CURRENCY, label: 'MONNAIE' },
  { id: ShopCategory.EVENT, label: 'EVENEMENT' },
  { id: ShopCategory.SUMMON, label: 'COFFRES' },
]

export class ShopScene extends Phaser.Scene {
  private inputMenu = new MenuInput()
  private tab = 0
  private index = 0
  private offers: ShopOffer[] = []
  private bar!: Phaser.GameObjects.Text
  private hint!: Phaser.GameObjects.Text
  private title!: Phaser.GameObjects.Text
  private blurb!: Phaser.GameObjects.Text
  private price!: Phaser.GameObjects.Text
  private tabLabels: Phaser.GameObjects.Text[] = []
  private cards: Phaser.GameObjects.Container[] = []
  private idle?: Phaser.GameObjects.GameObject
  private glow?: Phaser.GameObjects.Particles.ParticleEmitter
  private confirm: ShopOffer | null = null
  private confirmUi: Phaser.GameObjects.Container | null = null

  constructor() {
    super(SceneKeys.Shop)
  }

  create(): void {
    drawMenuBackdrop(this)
    this.inputMenu.attach()
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.inputMenu.detach()
      this.glow?.stop()
    })
    musicManager.playContext({ role: MusicRole.MENU, storyEvent: 'shop', intensity: 1 }, true)
    this.add.text(80, 28, 'BOUTIQUE', { fontFamily: FONT, fontSize: '40px', color: UI.gold })
    this.bar = drawCurrencyBar(this, 0, 0, 0)
    const back = this.add.text(1840, 32, 'RETOUR', { fontFamily: FONT_UI, fontSize: '20px', color: UI.paper }).setOrigin(1, 0)
    back.setInteractive({ useHandCursor: true }).on('pointerup', () => this.leave())
    this.tabLabels = TABS.map((tab, i) => {
      const label = this.add.text(80 + i * 230, 88, tab.label, {
        fontFamily: FONT_UI, fontSize: '16px', color: UI.muted,
      }).setInteractive({ useHandCursor: true })
      label.on('pointerup', () => {
        this.tab = i
        this.index = 0
        audio.playSfx('tab')
        this.rebuild()
      })
      return label
    })
    this.title = this.add.text(720, 200, '', { fontFamily: FONT, fontSize: '42px', color: UI.paper })
    this.blurb = this.add.text(720, 270, '', {
      fontFamily: FONT_UI, fontSize: '20px', color: UI.muted, wordWrap: { width: 1100 },
    })
    this.price = this.add.text(720, 400, '', { fontFamily: FONT_UI, fontSize: '26px', color: UI.gold })
    this.hint = this.add.text(960, 1036, 'Q / E onglets   ← → offres   Entrée acheter   Esc retour', {
      fontFamily: FONT_UI, fontSize: '16px', color: UI.muted,
    }).setOrigin(0.5)
    this.glow = this.add.particles(380, 520, AssetKeys.particle, {
      speed: { min: 8, max: 28 },
      scale: { start: 0.28, end: 0 },
      lifespan: 1800,
      frequency: 70,
      tint: 0xffd54f,
      blendMode: 'ADD',
    })
    this.rebuild()
  }

  update(): void {
    if (this.confirm) {
      if (this.inputMenu.justBack) {
        this.closeConfirm()
      }
      if (this.inputMenu.justLeft || this.inputMenu.justRight) {
        audio.playSfx('move')
      }
      if (this.inputMenu.justConfirm) {
        this.commit()
      }
      return
    }
    if (this.inputMenu.justBack) {
      this.leave()
      return
    }
    if (this.inputMenu.justPrevTab) {
      this.tab = (this.tab - 1 + TABS.length) % TABS.length
      this.index = 0
      audio.playSfx('tab')
      this.rebuild()
    }
    if (this.inputMenu.justNextTab) {
      this.tab = (this.tab + 1) % TABS.length
      this.index = 0
      audio.playSfx('tab')
      this.rebuild()
    }
    if (this.inputMenu.justLeft || this.inputMenu.justUp) {
      this.index = (this.index - 1 + Math.max(1, this.offers.length)) % Math.max(1, this.offers.length)
      audio.playSfx('move')
      this.refresh()
    }
    if (this.inputMenu.justRight || this.inputMenu.justDown) {
      this.index = (this.index + 1) % Math.max(1, this.offers.length)
      audio.playSfx('move')
      this.refresh()
    }
    if (this.inputMenu.justConfirm) {
      this.tryBuy()
    }
  }

  private category(): ShopCategoryId {
    return TABS[this.tab]?.id ?? ShopCategory.FEATURED
  }

  private rebuild(): void {
    this.cards.forEach((card) => card.destroy())
    this.cards = []
    this.idle?.destroy()
    this.idle = undefined
    const cat = this.category()
    if (cat === ShopCategory.SUMMON) {
      this.offers = []
      this.tabLabels.forEach((label, i) => label.setColor(i === this.tab ? UI.gold : UI.muted))
      this.title.setText('Coffres mystère')
      this.blurb.setText('Invocation séparée : probabilités, pity et révélation. Entrée pour ouvrir l’écran.')
      this.price.setText('')
      this.idle = spawnIdleFighter(this, 380, 900, FighterId.diablo, 0.62)
      this.refreshBar()
      return
    }
    this.offers = cat === ShopCategory.FEATURED
      ? [featuredOffer()].filter((offer): offer is ShopOffer => Boolean(offer))
      : offersIn(cat)
    this.index = Phaser.Math.Clamp(this.index, 0, Math.max(0, this.offers.length - 1))
    this.offers.forEach((offer, i) => {
      const x = 760 + (i % 3) * 360
      const y = 640 + Math.floor(i / 3) * 150
      const plate = this.add.rectangle(0, 0, 330, 128, 0x0b1626, 0.92)
      plate.setStrokeStyle(2, UI.panelEdge, 0.7)
      const name = this.add.text(0, -18, offer.label, {
        fontFamily: FONT_UI, fontSize: '18px', color: UI.paper, wordWrap: { width: 300 }, align: 'center',
      }).setOrigin(0.5)
      const cost = this.add.text(0, 28, this.costLabel(offer), {
        fontFamily: FONT_UI, fontSize: '16px', color: UI.gold,
      }).setOrigin(0.5)
      const card = this.add.container(x, y, [plate, name, cost])
      plate.setInteractive({ useHandCursor: true })
      plate.on('pointerover', () => {
        this.index = i
        this.refresh()
      })
      plate.on('pointerup', () => {
        this.index = i
        this.tryBuy()
      })
      this.cards.push(card)
    })
    this.tabLabels.forEach((label, i) => label.setColor(i === this.tab ? UI.gold : UI.muted))
    const featured = this.offers[0]
    const fighter = itemById(featured?.itemId ?? '')?.fighterId ?? FighterId.rimuru
    this.idle = spawnIdleFighter(this, 380, 920, fighter, cat === ShopCategory.FEATURED ? 0.85 : 0.62)
    this.refresh()
  }

  private refresh(): void {
    this.refreshBar()
    const offer = this.offers[this.index]
    const data = saveManager.load()
    this.cards.forEach((card, i) => {
      const plate = card.getAt(0) as Phaser.GameObjects.Rectangle
      plate.setStrokeStyle(3, i === this.index ? 0xfff3b0 : UI.panelEdge, i === this.index ? 1 : 0.55)
    })
    if (!offer) {
      this.title.setText(this.category() === ShopCategory.EVENT ? 'Aucun événement' : 'Aucune offre')
      this.blurb.setText('')
      this.price.setText('')
      return
    }
    const item = offer.itemId ? itemById(offer.itemId) : undefined
    const rarity = item ? rarityOf(item.rarity) : null
    this.title.setText(offer.label)
    this.title.setColor(rarity?.color ?? UI.paper)
    const owned = offer.itemId ? ownsItem(data, offer.itemId) : data.live.purchasedOffers.includes(offer.id)
    this.blurb.setText(item?.description ?? 'Pack ou monnaie. Le prix vient du catalogue, pas du client.')
    this.price.setText(owned && offer.itemId ? 'Possédé' : this.costLabel(offer))
    const event = activeEvents()[0]
    if (offer.eventId && event) {
      this.hint.setText(`Disponible encore  ${formatCountdown(remainingMs(event.endDate))}    Entrée pour confirmer`)
    } else {
      this.hint.setText('Q / E onglets   ← → offres   Entrée acheter   Esc retour   Aperçu : collection')
    }
    if (this.glow && rarity) {
      this.glow.setParticleTint(rarity.glow)
    }
  }

  private refreshBar(): void {
    const data = saveManager.load()
    this.bar.setText(currencyBarText(
      data.inventory.credits,
      data.inventory.premium,
      data.inventory.tickets,
      data.inventory.fragments,
    ))
  }

  private costLabel(offer: ShopOffer): string {
    if (offer.premiumSku) {
      return isDevPurchaseMode() ? `${offer.currencyGrant?.amount ?? 0} Premium TEST` : 'Paiement réel indisponible'
    }
    const unit = offer.price.currency === 'credits' ? 'cr' : offer.price.currency === 'tickets' ? 'tickets' : offer.price.currency
    return `${offer.price.amount} ${unit}`
  }

  private tryBuy(): void {
    if (this.category() === ShopCategory.SUMMON) {
      audio.playSfx('confirm')
      this.scene.start(SceneKeys.Summon)
      return
    }
    const offer = this.offers[this.index]
    if (!offer) {
      return
    }
    audio.playSfx('confirm')
    this.confirm = offer
    const box = this.add.rectangle(0, 0, 640, 280, 0x071018, 0.96)
    box.setStrokeStyle(2, 0x4aa8c4, 0.9)
    const text = this.add.text(0, -40, `Acheter ${offer.label} ?\n${this.costLabel(offer)}`, {
      fontFamily: FONT_UI, fontSize: '22px', color: UI.paper, align: 'center',
    }).setOrigin(0.5)
    const ok = this.add.text(-120, 70, '[ CONFIRMER ]', { fontFamily: FONT_UI, fontSize: '20px', color: UI.gold }).setOrigin(0.5)
    const no = this.add.text(140, 70, '[ ANNULER ]', { fontFamily: FONT_UI, fontSize: '20px', color: UI.muted }).setOrigin(0.5)
    this.confirmUi = this.add.container(960, 540, [box, text, ok, no])
    this.confirmUi.setDepth(40)
  }

  private commit(): void {
    const offer = this.confirm
    this.closeConfirm()
    if (!offer) {
      return
    }
    const data = saveManager.load()
    const result = purchaseOffer(data, offer.id)
    if (!result.ok) {
      audio.playSfx('error')
      this.hint.setText(result.reason === 'already_owned' ? 'Déjà possédé.' : result.reason === 'insufficient_funds' ? 'Pas assez de monnaie.' : result.reason === 'payments_not_enabled' ? 'Paiement réel non activé.' : 'Achat refusé.')
      return
    }
    saveManager.save(result.data)
    audio.playSfx('buy')
    this.hint.setText(result.message)
    this.rebuild()
  }

  private closeConfirm(): void {
    this.confirmUi?.destroy()
    this.confirmUi = null
    this.confirm = null
  }

  private leave(): void {
    audio.playSfx('back')
    this.scene.start(SceneKeys.Hub)
  }
}
