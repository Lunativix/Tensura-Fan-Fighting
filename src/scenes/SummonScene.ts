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
import { AssetKeys } from '../assets/AssetKeys.ts'
import { bannerById, BANNERS, rateLines } from '../live/banners.ts'
import { summon } from '../live/summon.ts'
import { itemById } from '../live/catalog.ts'
import { rarityOf } from '../live/rarity.ts'
import { emptyPity } from '../live/defaults.ts'
import { isDevPurchaseMode } from '../live/payment.ts'
import { devForceRarity, devGrantTickets, devResetPity } from '../live/dev.ts'
import { formatCountdown, remainingMs } from '../live/events.ts'
import { Rarity, type RarityId } from '../live/rarity.ts'
import type { SummonDrop } from '../live/types.ts'

export class SummonScene extends Phaser.Scene {
  private inputMenu = new MenuInput()
  private bannerId = 'chest-tempest'
  private count: 1 | 10 = 1
  private phase: 'ready' | 'cast' | 'reveal' = 'ready'
  private drops: SummonDrop[] = []
  private revealAt = 0
  private status!: Phaser.GameObjects.Text
  private rates!: Phaser.GameObjects.Text
  private pityTxt!: Phaser.GameObjects.Text
  private bar!: Phaser.GameObjects.Text
  private ring!: Phaser.GameObjects.Arc
  private particles?: Phaser.GameObjects.Particles.ParticleEmitter
  private resultLabels: Phaser.GameObjects.Text[] = []

  constructor() {
    super(SceneKeys.Summon)
  }

  create(): void {
    drawMenuBackdrop(this)
    this.inputMenu.attach()
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.inputMenu.detach()
      this.particles?.stop()
    })
    musicManager.playContext({ role: MusicRole.MENU, storyEvent: 'summon', intensity: 2 }, true)
    this.add.text(80, 28, 'INVOCATION', { fontFamily: FONT, fontSize: '40px', color: UI.gold })
    this.bar = drawCurrencyBar(this, 0, 0, 0, 0)
    this.add.text(1840, 32, 'RETOUR', { fontFamily: FONT_UI, fontSize: '20px', color: UI.paper }).setOrigin(1, 0)
      .setInteractive({ useHandCursor: true }).on('pointerup', () => this.leave())
    this.ring = this.add.circle(960, 520, 160, 0x000000, 0.2)
    this.ring.setStrokeStyle(3, 0x7ec8ff, 0.8)
    this.tweens.add({
      targets: this.ring, angle: 360, duration: 12000, repeat: -1,
    })
    this.particles = this.add.particles(960, 520, AssetKeys.particle, {
      speed: { min: 20, max: 80 },
      scale: { start: 0.35, end: 0 },
      lifespan: 1400,
      frequency: 40,
      tint: 0x7ec8ff,
      blendMode: 'ADD',
    })
    this.rates = this.add.text(80, 120, '', {
      fontFamily: FONT_UI, fontSize: '18px', color: UI.paper, lineSpacing: 8,
    })
    this.pityTxt = this.add.text(80, 360, '', { fontFamily: FONT_UI, fontSize: '18px', color: UI.gold })
    this.status = this.add.text(960, 980, '', {
      fontFamily: FONT_UI, fontSize: '20px', color: UI.muted, align: 'center',
    }).setOrigin(0.5)
    this.input.keyboard?.on('keydown-F8', () => {
      if (this.phase === 'ready') {
        this.devTick()
      }
    })
    this.refreshReady()
  }

  update(): void {
    if (this.phase === 'cast') {
      if (this.time.now >= this.revealAt) {
        this.showReveal()
      }
      return
    }
    if (this.phase === 'reveal') {
      if (this.inputMenu.justConfirm || this.inputMenu.justBack) {
        this.phase = 'ready'
        this.clearResults()
        this.refreshReady()
      }
      return
    }
    if (this.inputMenu.justBack) {
      this.leave()
      return
    }
    if (this.inputMenu.justLeft || this.inputMenu.justRight) {
      this.count = this.count === 1 ? 10 : 1
      audio.playSfx('move')
      this.refreshReady()
    }
    if (this.inputMenu.justUp || this.inputMenu.justDown) {
      const ids = BANNERS.map((banner) => banner.id)
      const i = ids.indexOf(this.bannerId)
      this.bannerId = ids[(i + 1) % ids.length] ?? ids[0]!
      audio.playSfx('tab')
      this.refreshReady()
    }
    if (this.inputMenu.justConfirm) {
      this.cast()
    }
  }

  private banner() {
    return bannerById(this.bannerId) ?? BANNERS[0]!
  }

  private refreshReady(): void {
    const data = saveManager.load()
    const banner = this.banner()
    const pity = data.live.pity[banner.id] ?? emptyPity()
    this.rates.setText([
      banner.title,
      banner.description,
      '',
      ...rateLines(banner.rates).map((row) => `${rarityOf(row.rarity).label} : ${row.pct} %`),
      '',
      `Garantie légendaire : après ${banner.pity.legendaryEvery} invocations sans légendaire.`,
      `Garantie mythique : après ${banner.pity.mythicEvery} invocations sans mythique.`,
      `Fin : ${formatCountdown(remainingMs(banner.endDate))}`,
    ].join('\n'))
    this.pityTxt.setText(`Pity L ${pity.sinceLegendary}/${banner.pity.legendaryEvery}    M ${pity.sinceMythic}/${banner.pity.mythicEvery}    Tirages ${pity.pulls}`)
    this.bar.setText(currencyBarText(
      data.inventory.credits,
      data.inventory.premium,
      data.inventory.tickets,
      data.inventory.fragments,
    ))
    this.status.setText(`x${this.count}  =  ${this.count === 10 ? banner.costX10 : banner.costX1} tickets\n↑↓ bannière   ←→ x1/x10   Entrée invoquer${isDevPurchaseMode() ? '    F8 tickets+pity' : ''}`)
    this.children.list.forEach((child) => {
      if (child instanceof Phaser.GameObjects.Text && child !== this.rates && child !== this.pityTxt && child !== this.status) {
        /* keep */
      }
    })
  }

  private cast(): void {
    const data = saveManager.load()
    const result = summon(data, this.bannerId, this.count)
    if (!result.ok) {
      audio.playSfx('error')
      this.status.setText(result.reason === 'insufficient_funds' ? 'Pas assez de tickets.' : 'Invocation refusée.')
      return
    }
    saveManager.save(result.data)
    this.bar.setText(currencyBarText(
      result.data.inventory.credits,
      result.data.inventory.premium,
      result.data.inventory.tickets,
      result.data.inventory.fragments,
    ))
    this.drops = result.drops
    this.phase = 'cast'
    audio.playSfx('chest')
    const best = this.drops.reduce((a, b) => rarityOf(a.rarity).rank >= rarityOf(b.rarity).rank ? a : b)
    const ms = this.count === 10 ? 900 : rarityOf(best.rarity).revealMs
    this.particles?.setParticleTint(rarityOf(best.rarity).glow)
    this.tweens.add({
      targets: this.ring, scale: 1.4, alpha: 0.2, duration: ms, yoyo: true,
    })
    this.revealAt = this.time.now + ms
    this.status.setText('Le cercle s’ouvre…')
  }

  private showReveal(): void {
    this.phase = 'reveal'
    this.clearResults()
    const best = this.drops.reduce((a, b) => rarityOf(a.rarity).rank >= rarityOf(b.rarity).rank ? a : b)
    audio.playSfx(rarityOf(best.rarity).sfx)
    if (best.rarity === Rarity.LEGENDARY || best.rarity === Rarity.MYTHIC) {
      const item = itemById(best.itemId)
      musicManager.playContext({
        role: MusicRole.MENU,
        storyEvent: 'summon',
        playerCharacter: item?.fighterId,
        intensity: 4,
      }, true)
    }
    this.drops.forEach((drop, i) => {
      const item = itemById(drop.itemId)
      const rarity = rarityOf(drop.rarity)
      const x = this.count === 1 ? 960 : 220 + (i % 5) * 370
      const y = this.count === 1 ? 780 : 780 + Math.floor(i / 5) * 70
      const label = this.add.text(x, y, `${rarity.label}  ${item?.name ?? drop.itemId}${drop.duplicate ? '  → fragments' : ''}`, {
        fontFamily: FONT_UI, fontSize: this.count === 1 ? '28px' : '16px', color: rarity.color,
      }).setOrigin(0.5)
      label.setAlpha(0)
      this.tweens.add({ targets: label, alpha: 1, duration: 220, delay: i * 40 })
      this.resultLabels.push(label)
    })
    this.status.setText('Entrée pour continuer')
  }

  private clearResults(): void {
    this.resultLabels.forEach((label) => label.destroy())
    this.resultLabels = []
  }

  private devTick(): void {
    const data = saveManager.load()
    devGrantTickets(data, 10)
    devResetPity(data)
    devForceRarity(data, 'legendary' as RarityId)
    saveManager.save(data)
    audio.playSfx('unlock')
    this.refreshReady()
    this.status.setText('DEV : +10 tickets, pity reset, prochain tirage légendaire.')
  }

  private leave(): void {
    audio.playSfx('back')
    this.scene.start(SceneKeys.Shop)
  }
}
