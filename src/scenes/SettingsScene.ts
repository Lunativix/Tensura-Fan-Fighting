import Phaser from 'phaser'
import { audio } from '../audio/AudioManager.ts'
import { musicManager } from '../audio/music/MusicManager.ts'
import { GameFlow } from '../types/game.ts'
import { session } from '../game/GameState.ts'
import { SceneKeys } from '../game/SceneKeys.ts'
import { strings } from '../i18n/strings.ts'
import { MenuInput } from '../input/MenuInput.ts'
import { saveManager, type SaveData } from '../save/SaveManager.ts'
import { drawMenuBackdrop } from '../ui/Backdrop.ts'
import { MenuButton } from '../ui/MenuButton.ts'
import { GAME_VERSION } from '../game/version.ts'

export class SettingsScene extends Phaser.Scene {
  private save!: SaveData
  private musicText!: Phaser.GameObjects.Text
  private sfxText!: Phaser.GameObjects.Text
  private langLabel!: Phaser.GameObjects.Text
  private buttons: MenuButton[] = []
  private index = 0
  private inputMenu!: MenuInput

  constructor() {
    super(SceneKeys.Settings)
  }

  create(): void {
    session.flow = GameFlow.SETTINGS
    this.save = saveManager.load()
    audio.setVolume('music', this.save.settings.musicVolume)
    audio.setVolume('sfx', this.save.settings.sfxVolume)
    this.syncMusic()
    drawMenuBackdrop(this)

    this.add.text(960, 140, strings.settings, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '48px',
      color: '#eaf6ff',
    }).setOrigin(0.5)

    const ver = this.add.text(960, 200, `Version ${GAME_VERSION}  (click: patch notes)`, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '20px',
      color: '#8fb4d9',
    }).setOrigin(0.5)
    ver.setInteractive({ useHandCursor: true })
    ver.on('pointerup', () => this.scene.start(SceneKeys.PatchNotes))
    const account = this.add.text(1840, 48, strings.account, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '18px',
      color: '#7ec8ff',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true })
    account.on('pointerup', () => this.scene.start(SceneKeys.Account))
    const lang = this.add.text(960, 228, '', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '18px',
      color: '#ffe082',
    }).setOrigin(0.5)
    lang.setInteractive({ useHandCursor: true })
    lang.on('pointerup', () => this.cycleLang())
    this.langLabel = lang

    this.musicText = this.add.text(960, 250, '', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '26px',
      color: '#d7ebff',
    }).setOrigin(0.5)
    this.musicText.setInteractive({ useHandCursor: true })
    this.musicText.on('pointerup', () => this.toggleDynamic())
    this.sfxText = this.add.text(960, 310, '', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '26px',
      color: '#d7ebff',
    }).setOrigin(0.5)

    this.buttons = [
      new MenuButton(this, 960, 400, `${strings.music} -`, () => this.adjust('music', -0.1)),
      new MenuButton(this, 960, 470, `${strings.music} +`, () => this.adjust('music', 0.1)),
      new MenuButton(this, 960, 540, `${strings.sfx} -`, () => this.adjust('sfx', -0.1)),
      new MenuButton(this, 960, 610, `${strings.sfx} +`, () => this.adjust('sfx', 0.1)),
      new MenuButton(this, 960, 680, 'SCREEN FX', () => this.toggleFx()),
      new MenuButton(this, 960, 750, 'VIBRATION', () => this.toggleVib()),
      new MenuButton(this, 960, 820, 'QUALITY', () => this.cycleQuality()),
      new MenuButton(this, 960, 890, 'CONTROLS', () => this.scene.start(SceneKeys.Controls)),
      new MenuButton(this, 960, 960, strings.back, () => this.back()),
    ]
    this.inputMenu = new MenuInput()
    this.inputMenu.attach()
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.inputMenu.detach())
    this.select(0)
    this.refreshLabels()
  }

  update(): void {
    if (this.inputMenu.justUp) {
      this.select(this.index - 1)
      audio.playSfx('move')
    }
    if (this.inputMenu.justDown) {
      this.select(this.index + 1)
      audio.playSfx('move')
    }
    if (this.inputMenu.justConfirm) {
      audio.playSfx('confirm')
      this.buttons[this.index]?.activate()
    }
    if (this.inputMenu.justBack) {
      this.back()
    }
  }

  private select(next: number): void {
    const count = this.buttons.length
    this.index = ((next % count) + count) % count
    this.buttons.forEach((button, i) => button.setSelected(i === this.index))
  }

  private adjust(kind: 'music' | 'sfx', delta: number): void {
    const current = kind === 'music' ? this.save.settings.musicVolume : this.save.settings.sfxVolume
    const next = Math.min(1, Math.max(0, current + delta))
    if (kind === 'music') {
      this.save.settings.musicVolume = next
    } else {
      this.save.settings.sfxVolume = next
    }
    audio.setVolume(kind, next)
    this.syncMusic()
    saveManager.save(this.save)
    this.refreshLabels()
  }

  private toggleDynamic(): void {
    this.save.settings.musicDynamic = !this.save.settings.musicDynamic
    this.syncMusic()
    saveManager.save(this.save)
    this.refreshLabels()
  }

  private syncMusic(): void {
    musicManager.applySettings({
      battleMusicVolume: this.save.settings.battleMusicVolume,
      cinematicMusicVolume: this.save.settings.cinematicMusicVolume,
      menuMusicVolume: this.save.settings.menuMusicVolume,
      musicDynamic: this.save.settings.musicDynamic,
      musicVariation: this.save.settings.musicVariation,
    })
  }

  private toggleFx(): void {
    this.save.settings.screenFx = !this.save.settings.screenFx
    saveManager.save(this.save)
    this.refreshLabels()
  }

  private toggleVib(): void {
    this.save.settings.vibration = !this.save.settings.vibration
    saveManager.save(this.save)
    this.refreshLabels()
  }

  private cycleQuality(): void {
    const order = ['low', 'medium', 'high'] as const
    const i = order.indexOf(this.save.settings.quality)
    this.save.settings.quality = order[(i + 1) % order.length] ?? 'high'
    saveManager.save(this.save)
    this.refreshLabels()
  }

  private cycleLang(): void {
    this.save.settings.language = this.save.settings.language === 'fr' ? 'en' : 'fr'
    saveManager.save(this.save)
    this.scene.restart()
  }

  private refreshLabels(): void {
    this.musicText.setText(`${strings.music}: ${Math.round(this.save.settings.musicVolume * 100)}%   DYN ${this.save.settings.musicDynamic ? 'ON' : 'OFF'}  (click)`)
    this.sfxText.setText(`${strings.sfx}: ${Math.round(this.save.settings.sfxVolume * 100)}%   FX ${this.save.settings.screenFx ? 'ON' : 'OFF'}   VIB ${this.save.settings.vibration ? 'ON' : 'OFF'}   ${this.save.settings.quality.toUpperCase()}`)
    this.langLabel?.setText(`${strings.language}: ${this.save.settings.language.toUpperCase()}  (click)`)
  }

  private back(): void {
    audio.playSfx('back')
    this.scene.start(SceneKeys.Hub)
  }
}
