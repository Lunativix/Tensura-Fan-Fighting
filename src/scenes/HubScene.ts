import Phaser from 'phaser'
import { CHARACTERS } from '../config/characters.ts'
import { storySkinFor } from '../config/characterSkins.ts'
import { loadStory, nextPlayable } from '../story/index.ts'
import { audio } from '../audio/AudioManager.ts'
import { musicManager } from '../audio/music/MusicManager.ts'
import { MusicRole } from '../audio/music/types.ts'
import { GameFlow, MatchMode } from '../types/game.ts'
import { PlayMode, session } from '../game/GameState.ts'
import { SceneKeys } from '../game/SceneKeys.ts'
import { stageKey } from '../game/Stages.ts'
import { MenuInput } from '../input/MenuInput.ts'
import { FONT, FONT_UI, UI } from '../ui/theme.ts'
import { MenuButton } from '../ui/MenuButton.ts'
import { spriteAnimKey, spriteFrameKey, spritePackKey } from '../sprites/SpriteManifest.ts'
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../engine/Time.ts'
import { AssetKeys } from '../assets/AssetKeys.ts'
import { GAME_VERSION } from '../game/version.ts'
import { openDiscord } from '../config/community.ts'
import { saveManager } from '../save/SaveManager.ts'
import { AccountKind } from '../account/types.ts'
import { consumeBootHandoff } from '../boot/branding.ts'
import { ensureSlimeTextures, SLIME_BODY_KEY } from '../characters/slimeLook.ts'

interface HubSpot {
  id: string
  title: string
  hint: string
  x: number
  y: number
  icon: string
  run: () => void
}

export class HubScene extends Phaser.Scene {
  private inputMenu!: MenuInput
  private spots: HubSpot[] = []
  private index = 0
  private pins: Phaser.GameObjects.Container[] = []
  private hint!: Phaser.GameObjects.Text
  private avatar!: Phaser.GameObjects.Sprite
  private overlay: Phaser.GameObjects.Container | null = null
  private overlayButtons: MenuButton[] = []
  private overlayIndex = 0

  constructor() {
    super(SceneKeys.Hub)
  }

  create(): void {
    session.flow = GameFlow.HUB
    session.paused = false
    audio.unlock()
    musicManager.playContext({
      role: MusicRole.EXPLORATION,
      location: 'tempest_city',
      stageId: 'tempest_city',
      intensity: 1,
    }, true)
    this.drawCity()
    this.spots = this.makeSpots()
    this.pins = this.spots.map((spot, i) => this.makePin(spot, i))
    this.spawnAvatar()
    this.drawChrome()
    this.inputMenu = new MenuInput()
    this.inputMenu.attach()
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.inputMenu.detach())
    this.highlight(0)
    if (consumeBootHandoff()) {
      this.cameras.main.fadeIn(520, 2, 3, 8)
    }
    this.input.once('pointerdown', () => {
      audio.unlock()
      musicManager.ensureStarted()
    })
  }

  update(): void {
    if (this.overlay) {
      if (this.inputMenu.justBack) {
        this.closeOverlay()
      }
      if (this.inputMenu.justUp || this.inputMenu.justDown) {
        const dir = this.inputMenu.justDown ? 1 : -1
        const count = this.overlayButtons.length
        this.overlayIndex = ((this.overlayIndex + dir) % count + count) % count
        this.overlayButtons.forEach((button, i) => button.setSelected(i === this.overlayIndex))
        audio.playSfx('move')
      }
      if (this.inputMenu.justConfirm) {
        this.overlayButtons[this.overlayIndex]?.activate()
      }
      return
    }
    if (this.inputMenu.justLeft || this.inputMenu.justUp) {
      this.highlight(this.index - 1)
      audio.playSfx('move')
    }
    if (this.inputMenu.justRight || this.inputMenu.justDown) {
      this.highlight(this.index + 1)
      audio.playSfx('move')
    }
    if (this.inputMenu.justConfirm) {
      audio.playSfx('confirm')
      this.spots[this.index]?.run()
    }
  }

  private drawCity(): void {
    const key = stageKey('tempest_city')
    if (this.textures.exists(key)) {
      const bg = this.add.image(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, key)
      bg.setDisplaySize(LOGICAL_WIDTH, LOGICAL_HEIGHT)
    } else {
      this.add.rectangle(960, 540, 1920, 1080, 0x102038, 1)
    }
    const veil = this.add.graphics()
    veil.fillStyle(0x061018, 0.28)
    veil.fillRect(0, 0, LOGICAL_WIDTH, 180)
    veil.fillStyle(0x061018, 0.45)
    veil.fillRect(0, 860, LOGICAL_WIDTH, 220)
    this.add.particles(400, 220, AssetKeys.particle, {
      speedX: { min: -10, max: 18 },
      speedY: { min: -20, max: -6 },
      scale: { start: 0.22, end: 0 },
      lifespan: 2800,
      frequency: 90,
      tint: 0xffe082,
      blendMode: 'ADD',
    })
    this.add.particles(1500, 260, AssetKeys.particle, {
      speedX: { min: -16, max: 10 },
      speedY: { min: -18, max: -4 },
      scale: { start: 0.2, end: 0 },
      lifespan: 2600,
      frequency: 110,
      tint: 0x90caf9,
      blendMode: 'ADD',
    })
  }

  private drawChrome(): void {
    this.add.text(80, 48, 'TEMPEST', {
      fontFamily: FONT,
      fontSize: '42px',
      color: UI.gold,
    }).setOrigin(0, 0)
    this.add.text(80, 96, 'Cite federative  •  Lobby', {
      fontFamily: FONT_UI,
      fontSize: '18px',
      color: UI.muted,
    }).setOrigin(0, 0)
    const save = saveManager.load()
    const kind = save.account.kind === AccountKind.REGISTERED ? 'Compte' : 'Invité'
    const chip = this.add.text(80, 128, `${kind}  ${save.account.displayName}  •  ${save.inventory.credits} cr  •  ${save.inventory.tickets} tix`, {
      fontFamily: FONT_UI,
      fontSize: '16px',
      color: UI.cyan,
    }).setOrigin(0, 0).setInteractive({ useHandCursor: true })
    chip.on('pointerup', () => {
      audio.playSfx('confirm')
      this.scene.start(SceneKeys.Account, { from: 'hub' })
    })
    this.hint = this.add.text(960, 980, '', {
      fontFamily: FONT_UI,
      fontSize: '22px',
      color: UI.paper,
      align: 'center',
    }).setOrigin(0.5)
    this.add.text(1840, 48, 'OPTIONS', {
      fontFamily: FONT_UI,
      fontSize: '18px',
      color: UI.cyan,
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).on('pointerup', () => {
      audio.playSfx('confirm')
      this.scene.start(SceneKeys.Settings)
    })
    new MenuButton(this, 1690, 118, 'Discord', () => {
      audio.playSfx('confirm')
      openDiscord()
    }, { width: 260, height: 48, kind: 'primary' }).container.setDepth(8)
    this.add.text(1840, 1040, `v${GAME_VERSION}`, {
      fontFamily: FONT_UI,
      fontSize: '14px',
      color: UI.muted,
    }).setOrigin(1, 1)
  }

  private makeSpots(): HubSpot[] {
    return [
      { id: 'castle', title: 'Chateau', hint: 'Histoire et evenements de Tempest', x: 360, y: 300, icon: 'Chateau', run: () => this.openCastle() },
      { id: 'library', title: 'Bibliotheque', hint: 'Collection, apparences et encyclopedie', x: 250, y: 560, icon: 'Livres', run: () => this.go(SceneKeys.Characters) },
      { id: 'arena', title: 'Arene', hint: 'Combat rapide, classe ou non classe', x: 960, y: 320, icon: 'Arene', run: () => this.openArena() },
      { id: 'plaza', title: 'Place', hint: 'Joueurs, amis et salon', x: 1280, y: 500, icon: 'Place', run: () => this.go(SceneKeys.Online) },
      { id: 'market', title: 'Marche', hint: 'Boutique, packs et coffres mystere', x: 1600, y: 380, icon: 'Marche', run: () => this.go(SceneKeys.Shop) },
      { id: 'dojo', title: 'Entrainement', hint: 'Terrain d\'entrainement', x: 1520, y: 740, icon: 'Dojo', run: () => this.startTraining() },
    ]
  }

  private makePin(spot: HubSpot, index: number): Phaser.GameObjects.Container {
    const plate = this.add.rectangle(0, 0, 210, 86, UI.panel, 0.88)
    plate.setStrokeStyle(2, UI.panelEdge, 0.7)
    const title = this.add.text(0, -10, spot.title.toUpperCase(), {
      fontFamily: FONT,
      fontSize: '20px',
      color: UI.gold,
    }).setOrigin(0.5)
    const sub = this.add.text(0, 18, spot.icon, {
      fontFamily: FONT_UI,
      fontSize: '14px',
      color: UI.muted,
    }).setOrigin(0.5)
    const pin = this.add.container(spot.x, spot.y, [plate, title, sub])
    pin.setSize(210, 86)
    plate.setInteractive({ useHandCursor: true })
    plate.on('pointerover', () => {
      this.highlight(index)
    })
    plate.on('pointerup', () => {
      this.highlight(index)
      audio.playSfx('confirm')
      spot.run()
    })
    this.tweens.add({
      targets: pin,
      y: spot.y - 6,
      duration: 1600 + index * 80,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    })
    return pin
  }

  private spawnAvatar(): void {
    const id = session.playerFighter
    const story = loadStory()
    const mission = nextPlayable(story)
    const skin = storySkinFor(id, story, { missionId: mission?.id })
    if (skin.body === 'slime') {
      ensureSlimeTextures(this, true)
      this.avatar = this.add.sprite(960, 910, SLIME_BODY_KEY)
      this.avatar.setOrigin(0.5, 1)
      this.avatar.setDisplaySize(168, 168)
      this.avatar.setAlpha(0.92)
      this.tweens.add({
        targets: this.avatar,
        scaleX: this.avatar.scaleX * 1.06,
        scaleY: this.avatar.scaleY * 0.93,
        duration: 1700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      })
      this.add.text(960, 920, CHARACTERS[id].name, {
        fontFamily: FONT,
        fontSize: '18px',
        color: UI.gold,
      }).setOrigin(0.5, 0)
      return
    }
    const pack = spritePackKey(id, 'idle')
    const frame = spriteFrameKey(id, 'idle', 0)
    const key = this.textures.exists(pack) ? pack : this.textures.exists(frame) ? frame : ''
    if (!key) {
      const fallback = this.add.circle(960, 860, 36, CHARACTERS[id].color, 1)
      fallback.setStrokeStyle(3, 0xffd54f, 0.9)
      this.avatar = this.add.sprite(960, 860, AssetKeys.pixel)
      this.avatar.setVisible(false)
      return
    }
    this.avatar = this.add.sprite(960, 900, key, 0)
    this.avatar.setOrigin(0.5, 1)
    this.avatar.setScale(0.55)
    const anim = spriteAnimKey(id, 'idle')
    if (this.anims.exists(anim)) {
      this.avatar.play(anim)
    }
    this.add.text(960, 920, CHARACTERS[id].name, {
      fontFamily: FONT,
      fontSize: '18px',
      color: UI.gold,
    }).setOrigin(0.5, 0)
  }

  private highlight(next: number): void {
    this.index = ((next % this.spots.length) + this.spots.length) % this.spots.length
    this.pins.forEach((pin, i) => {
      const plate = pin.getAt(0) as Phaser.GameObjects.Rectangle
      plate.setStrokeStyle(3, i === this.index ? 0xfff3b0 : UI.panelEdge, i === this.index ? 1 : 0.55)
      plate.setFillStyle(UI.panel, i === this.index ? 0.96 : 0.78)
    })
    const spot = this.spots[this.index]
    if (!spot) {
      return
    }
    this.hint.setText(`${spot.title}  —  ${spot.hint}     Entree pour y aller`)
    this.tweens.add({
      targets: this.avatar,
      x: Phaser.Math.Clamp(spot.x, 420, 1500),
      duration: 280,
      ease: 'Sine.out',
    })
  }

  private go(key: string): void {
    this.scene.start(key)
  }

  private startTraining(): void {
    session.playMode = PlayMode.TRAINING
    session.trainingMode = true
    session.infiniteResources = true
    session.matchMode = MatchMode.PVE
    this.scene.start(SceneKeys.CharacterSelect)
  }

  private openArena(): void {
    this.showOverlay('ARENE DE TEMPEST', [
      { label: 'Combat rapide', run: () => this.launchFight(PlayMode.VERSUS_CPU, false) },
      { label: 'Classe', run: () => this.launchFight(PlayMode.VERSUS_CPU, true) },
      { label: 'Non classe', run: () => this.launchFight(PlayMode.VERSUS_CPU, false) },
      { label: 'Versus local', run: () => this.launchFight(PlayMode.VERSUS_LOCAL, false) },
    ])
  }

  private openCastle(): void {
    this.showOverlay('CHATEAU DE RIMURU', [
      { label: 'Histoire', run: () => this.go(SceneKeys.Story) },
      { label: 'Evenements', run: () => this.go(SceneKeys.Events) },
    ])
  }

  private launchFight(mode: typeof PlayMode[keyof typeof PlayMode], ranked: boolean): void {
    session.playMode = mode
    session.ranked = ranked
    session.trainingMode = false
    session.infiniteResources = false
    session.matchMode = mode === PlayMode.VERSUS_LOCAL ? MatchMode.PVP : MatchMode.PVE
    this.scene.start(SceneKeys.CharacterSelect)
  }

  private showOverlay(title: string, actions: { label: string, run: () => void }[]): void {
    this.closeOverlay()
    const dim = this.add.rectangle(960, 540, 1920, 1080, 0x000000, 0.55).setInteractive()
    const panel = this.add.rectangle(960, 520, 560, 420, 0x0a1420, 0.96)
    panel.setStrokeStyle(2, 0x4aa8c4, 0.65)
    const head = this.add.text(960, 360, title, {
      fontFamily: FONT,
      fontSize: '32px',
      color: UI.gold,
    }).setOrigin(0.5)
    this.overlayIndex = 0
    this.overlayButtons = actions.map((action, i) => {
      const button = new MenuButton(this, 960, 440 + i * 70, action.label, () => {
        audio.playSfx('confirm')
        this.closeOverlay()
        action.run()
      }, { width: 420, height: 56, kind: i === 0 ? 'primary' : 'secondary' })
      button.container.setDepth(41)
      return button
    })
    this.overlayButtons[0]?.setSelected(true)
    const back = this.add.text(960, 690, 'ECHAP POUR FERMER', {
      fontFamily: FONT_UI,
      fontSize: '16px',
      color: UI.muted,
    }).setOrigin(0.5)
    this.overlay = this.add.container(0, 0, [dim, panel, head, back])
    this.overlay.setDepth(40)
  }

  private closeOverlay(): void {
    this.overlayButtons.forEach((button) => button.destroy())
    this.overlayButtons = []
    this.overlayIndex = 0
    this.overlay?.destroy()
    this.overlay = null
  }
}
