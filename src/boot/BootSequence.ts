import Phaser from 'phaser'
import { AssetKeys } from '../assets/AssetKeys.ts'
import { audio } from '../audio/AudioManager.ts'
import { musicManager } from '../audio/music/MusicManager.ts'
import { MusicRole } from '../audio/music/types.ts'
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../engine/Time.ts'
import { FONT, FONT_UI, UI } from '../ui/theme.ts'
import {
  bootIntroMs,
  BOOT_BRANDING,
  type BootVariation,
} from './branding.ts'
import { bootLoadingLabel, bootPhaseLabel, loadingDots } from './copy.ts'
import type { LoadProgress } from './LoadProgress.ts'
import { bootParticleCap, bootReducedMotion } from './motion.ts'
import { BootTexture } from './textures.ts'

const CX = LOGICAL_WIDTH * 0.5
const CREATOR_Y = 430
const STUDIO_Y = 528
const LOAD_Y = 678
const PCT_Y = 732
const PHASE_Y = 776

interface Speck {
  img: Phaser.GameObjects.Image
  vx: number
  vy: number
  life: number
  max: number
}

interface Streak {
  img: Phaser.GameObjects.Image
  vx: number
  life: number
}

export class BootSequence {
  readonly variation: BootVariation
  private readonly scene: Phaser.Scene
  private readonly reduced: boolean
  private readonly root: Phaser.GameObjects.Container
  private readonly specks: Speck[] = []
  private readonly streaks: Streak[] = []
  private readonly shards: Phaser.GameObjects.Image[] = []
  private readonly letters: Phaser.GameObjects.Text[] = []
  private readonly vein: Phaser.GameObjects.Rectangle
  private readonly studio: Phaser.GameObjects.Text
  private readonly loadText: Phaser.GameObjects.Text
  private readonly percentText: Phaser.GameObjects.Text
  private readonly phaseText: Phaser.GameObjects.Text
  private readonly meter: Phaser.GameObjects.Graphics
  private readonly core: Phaser.GameObjects.Image
  private readonly halo: Phaser.GameObjects.Image
  private readonly ring: Phaser.GameObjects.Image
  private readonly sweep: Phaser.GameObjects.Rectangle
  private readonly flash: Phaser.GameObjects.Rectangle
  private readonly veil: Phaser.GameObjects.Rectangle
  private elapsed = 0
  private dots = 0
  private dotAcc = 0
  private shownPercent = -1
  private brandingDone = false
  private loadVisible = false
  private finishing = false
  private sfxBoot = false
  private sfxCreator = false
  private sfxStudio = false
  private musicStarted = false
  private letterWidths: number[] = []

  constructor(
    scene: Phaser.Scene,
    variation: BootVariation,
  ) {
    this.scene = scene
    this.variation = variation
    this.reduced = bootReducedMotion()
    const particle = scene.textures.exists(AssetKeys.particle) ? AssetKeys.particle : AssetKeys.pixel
    const glow = scene.textures.exists(BootTexture.glow) ? BootTexture.glow : particle
    const ringKey = scene.textures.exists(BootTexture.ring) ? BootTexture.ring : AssetKeys.pixel

    this.veil = scene.add.rectangle(CX, LOGICAL_HEIGHT * 0.5, LOGICAL_WIDTH, LOGICAL_HEIGHT, 0x020308, 1)
    this.halo = scene.add.image(CX, CREATOR_Y - 8, glow).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD)
    this.halo.setDisplaySize(this.variation === 'core' ? 280 : 160, this.variation === 'core' ? 280 : 160)
    this.core = scene.add.image(CX, CREATOR_Y - 8, glow).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD)
    this.core.setDisplaySize(36, 36)
    this.ring = scene.add.image(CX, CREATOR_Y + 20, ringKey).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD)
    this.ring.setDisplaySize(this.variation === 'circle' ? 420 : 280, this.variation === 'circle' ? 420 : 280)
    this.vein = scene.add.rectangle(CX, CREATOR_Y + 42, 2, 2, 0x7ec8ff, 0).setOrigin(0.5, 0)
    this.sweep = scene.add.rectangle(CX - 220, CREATOR_Y, 18, 88, 0xd8f3ff, 0).setBlendMode(Phaser.BlendModes.ADD)

    const count = bootParticleCap(BOOT_BRANDING.particleDensity, this.reduced)
    for (let i = 0; i < count; i += 1) {
      const img = scene.add.image(CX, CREATOR_Y, particle).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD)
      img.setTint(i % 3 === 0 ? 0xffd54f : 0x7ec8ff)
      this.specks.push({ img, vx: 0, vy: 0, life: 0, max: 1 })
      this.respawnSpeck(this.specks[i]!, true)
    }

    if (this.variation === 'lines' && !this.reduced) {
      for (let i = 0; i < 5; i += 1) {
        const img = scene.add.image(0, 200 + i * 140, AssetKeys.pixel).setAlpha(0)
        img.setTint(0x8fd4ff)
        img.setDisplaySize(180, 2)
        img.setBlendMode(Phaser.BlendModes.ADD)
        this.streaks.push({ img, vx: 0, life: 0 })
      }
    }

    if (!this.reduced) {
      for (const dx of [-340, 340]) {
        const shard = scene.add.image(CX + dx, CREATOR_Y + 40, AssetKeys.pixel)
        shard.setTint(0x7ec8ff)
        shard.setAlpha(0.06)
        shard.setDisplaySize(46, 46)
        shard.setAngle(45)
        this.shards.push(shard)
      }
    }

    this.buildLetters()
    this.studio = scene.add.text(CX, STUDIO_Y, BOOT_BRANDING.studioName, {
      fontFamily: FONT_UI,
      fontSize: '28px',
      color: UI.muted,
      letterSpacing: 6,
    }).setOrigin(0.5).setAlpha(0)

    this.loadText = scene.add.text(CX, LOAD_Y, '', {
      fontFamily: FONT_UI,
      fontSize: '22px',
      color: UI.cyan,
      letterSpacing: 8,
    }).setOrigin(0.5).setAlpha(0)
    this.percentText = scene.add.text(CX, PCT_Y, '', {
      fontFamily: FONT_UI,
      fontSize: '36px',
      color: UI.paper,
    }).setOrigin(0.5).setAlpha(0)
    this.phaseText = scene.add.text(CX, PHASE_Y, '', {
      fontFamily: FONT_UI,
      fontSize: '16px',
      color: '#6f93b3',
      letterSpacing: 3,
    }).setOrigin(0.5).setAlpha(0)
    this.meter = scene.add.graphics().setAlpha(0)
    this.flash = scene.add.rectangle(CX, LOGICAL_HEIGHT * 0.5, LOGICAL_WIDTH, LOGICAL_HEIGHT, 0xeef7ff, 0)

    const kids: Phaser.GameObjects.GameObject[] = [
      this.veil, this.halo, this.ring, this.core, ...this.specks.map((s) => s.img),
      ...this.streaks.map((s) => s.img), ...this.shards, this.vein, this.sweep, ...this.letters,
      this.studio, this.loadText, this.percentText, this.phaseText, this.meter, this.flash,
    ]
    this.root = scene.add.container(0, 0, kids)
    this.root.setDepth(1000)

    scene.input.once('pointerdown', () => {
      audio.unlock()
      musicManager.ensureStarted()
    })
  }

  get ready(): boolean {
    return this.brandingDone
  }

  update(delta: number): void {
    if (this.finishing) {
      this.spinAmbient(delta)
      return
    }
    this.elapsed += delta
    this.spinAmbient(delta)
    this.driveIntro()
    this.tickDots(delta)
  }

  sync(progress: LoadProgress): void {
    if (!this.loadVisible && !this.reduced) {
      return
    }
    if (this.reduced && this.elapsed > 80) {
      this.showLoadingChrome()
    }
    const pct = progress.percent
    if (pct === this.shownPercent && this.loadVisible) {
      this.drawMeter(pct)
      return
    }
    this.shownPercent = pct
    this.percentText.setText(`${pct}%`)
    this.phaseText.setText(bootPhaseLabel(progress.phase))
    this.refreshLoadLine()
    this.drawMeter(pct)
  }

  finish(): Promise<void> {
    if (this.finishing) {
      return Promise.resolve()
    }
    this.finishing = true
    this.brandingDone = true
    this.showLoadingChrome()
    this.percentText.setText('100%')
    this.shownPercent = 100
    this.drawMeter(100)
    audio.unlock()
    audio.playSfx(BOOT_BRANDING.sfx.complete)
    const ms = this.reduced ? 220 : BOOT_BRANDING.finishMs
    return new Promise((resolve) => {
      let settled = false
      const done = (): void => {
        if (settled) {
          return
        }
        settled = true
        resolve()
      }
      this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, done)
      if (this.reduced) {
        this.scene.tweens.add({
          targets: this.root,
          alpha: 0,
          duration: ms,
          onComplete: done,
        })
        return
      }
      this.scene.tweens.add({
        targets: [this.core, this.halo],
        scale: 2.4,
        alpha: 0.9,
        duration: Math.floor(ms * 0.45),
        ease: 'Sine.easeIn',
      })
      this.scene.tweens.add({
        targets: this.flash,
        alpha: 0.72,
        duration: Math.floor(ms * 0.28),
        yoyo: true,
        hold: 40,
      })
      this.scene.tweens.add({
        targets: this.root,
        alpha: 0,
        delay: Math.floor(ms * 0.42),
        duration: Math.floor(ms * 0.55),
        onComplete: done,
      })
    })
  }

  destroy(): void {
    this.root.destroy(true)
  }

  private buildLetters(): void {
    const name = BOOT_BRANDING.creatorName
    const probe = this.scene.add.text(0, 0, '', {
      fontFamily: FONT,
      fontSize: '78px',
    }).setVisible(false)
    const widths: number[] = []
    let total = 0
    for (const ch of name) {
      probe.setText(ch)
      const w = Math.max(probe.width, ch === ' ' ? 22 : 18)
      widths.push(w)
      total += w + 4
    }
    probe.destroy()
    this.letterWidths = widths
    let x = CX - total * 0.5
    for (let i = 0; i < name.length; i += 1) {
      const w = widths[i] ?? 24
      const letter = this.scene.add.text(x + w * 0.5, CREATOR_Y + 16, name[i] ?? '', {
        fontFamily: FONT,
        fontSize: '78px',
        color: UI.paper,
      }).setOrigin(0.5).setAlpha(0)
      letter.setShadow(0, 0, '#7ec8ff', this.reduced ? 0 : 14, true, true)
      this.letters.push(letter)
      x += w + 4
    }
  }

  private driveIntro(): void {
    const black = this.reduced ? 40 : BOOT_BRANDING.blackMs
    const energyAt = black
    const creatorAt = energyAt + (this.reduced ? 60 : BOOT_BRANDING.energyMs)
    const studioAt = creatorAt + (this.reduced ? 80 : BOOT_BRANDING.creatorMs)
    const doneAt = this.reduced ? 280 : bootIntroMs()

    if (this.elapsed >= energyAt) {
      this.pulseEnergy()
      if (!this.sfxBoot) {
        this.sfxBoot = true
        audio.playSfx(BOOT_BRANDING.sfx.boot)
        this.ensureMusic()
      }
    }
    if (this.elapsed >= creatorAt) {
      this.revealCreator(this.elapsed - creatorAt)
      if (!this.sfxCreator) {
        this.sfxCreator = true
        audio.playSfx(BOOT_BRANDING.sfx.creator)
      }
    }
    if (this.elapsed >= studioAt) {
      this.revealStudio(this.elapsed - studioAt)
      if (!this.sfxStudio) {
        this.sfxStudio = true
        audio.playSfx(BOOT_BRANDING.sfx.studio)
      }
    }
    if (!this.brandingDone && this.elapsed >= doneAt) {
      this.brandingDone = true
      this.showLoadingChrome()
    }
  }

  private pulseEnergy(): void {
    const t = Math.min(1, (this.elapsed - (this.reduced ? 40 : BOOT_BRANDING.blackMs)) / 400)
    const pulse = 0.55 + Math.sin(this.elapsed * 0.006) * (this.variation === 'core' ? 0.22 : 0.12)
    this.core.setAlpha(0.35 + t * 0.45)
    this.core.setScale(0.7 + pulse)
    this.halo.setAlpha((this.reduced ? 0.08 : 0.18) * t * pulse)
    if (this.variation === 'circle' || this.variation === 'core') {
      this.ring.setAlpha((this.variation === 'circle' ? 0.28 : 0.12) * t)
    } else if (!this.reduced) {
      this.ring.setAlpha(0.08 * t)
    }
  }

  private revealCreator(local: number): void {
    const stagger = this.reduced ? 0 : 55
    for (let i = 0; i < this.letters.length; i += 1) {
      const letter = this.letters[i]!
      const u = this.reduced ? 1 : Phaser.Math.Clamp((local - i * stagger) / 280, 0, 1)
      const ease = 1 - (1 - u) * (1 - u)
      letter.setAlpha(ease)
      letter.y = CREATOR_Y + (1 - ease) * 18
      letter.setScale(0.92 + ease * 0.08)
    }
    if (!this.reduced && local > 120) {
      const sweepU = Phaser.Math.Clamp((local - 180) / 520, 0, 1)
      const span = this.letterSpan()
      this.sweep.setAlpha(sweepU > 0 && sweepU < 1 ? 0.45 : 0)
      this.sweep.x = CX - span * 0.5 + span * sweepU
    }
  }

  private revealStudio(local: number): void {
    const u = this.reduced ? 1 : Phaser.Math.Clamp(local / 380, 0, 1)
    const ease = 1 - (1 - u) * (1 - u)
    this.studio.setAlpha(ease * 0.92)
    this.studio.y = STUDIO_Y + (1 - ease) * 10
    const veinH = 18 + ease * 48
    this.vein.height = veinH
    this.vein.setAlpha(ease * 0.55)
  }

  private showLoadingChrome(): void {
    if (this.loadVisible) {
      return
    }
    this.loadVisible = true
    this.loadText.setAlpha(0.95)
    this.percentText.setAlpha(1)
    this.phaseText.setAlpha(0.9)
    this.meter.setAlpha(1)
    this.refreshLoadLine()
  }

  private refreshLoadLine(): void {
    this.loadText.setText(`${bootLoadingLabel()}${loadingDots(this.dots)}`)
  }

  private tickDots(delta: number): void {
    if (!this.loadVisible) {
      return
    }
    this.dotAcc += delta
    if (this.dotAcc >= 380) {
      this.dotAcc = 0
      this.dots += 1
      this.refreshLoadLine()
    }
  }

  private drawMeter(percent: number): void {
    this.meter.clear()
    const x = this.loadText.x - this.loadText.displayWidth * 0.5 - 26
    const y = LOAD_Y + 4
    this.meter.lineStyle(2, 0x1a3a58, 0.7)
    this.meter.strokeCircle(x, y, 11)
    const p = Phaser.Math.Clamp(percent, 0, 100) / 100
    if (p > 0) {
      this.meter.lineStyle(2, 0x7ec8ff, 0.95)
      this.meter.beginPath()
      this.meter.arc(x, y, 11, -Math.PI * 0.5, -Math.PI * 0.5 + p * Math.PI * 2, false)
      this.meter.strokePath()
    }
  }

  private spinAmbient(delta: number): void {
    if (!this.reduced) {
      const spin = this.variation === 'circle' ? 0.00022 : 0.00012
      this.ring.rotation += delta * spin
    }
    const drift = this.reduced ? 0.008 : 0.018
    for (const speck of this.specks) {
      speck.life += delta
      speck.img.x += speck.vx * delta * drift
      speck.img.y += speck.vy * delta * drift
      const fade = 1 - speck.life / speck.max
      speck.img.setAlpha(Math.max(0, fade) * (this.reduced ? 0.25 : 0.55))
      if (speck.life >= speck.max) {
        this.respawnSpeck(speck, false)
      }
    }
    for (const shard of this.shards) {
      shard.setAlpha(0.05 + Math.sin(this.elapsed * 0.0016) * 0.02)
    }
    for (const streak of this.streaks) {
      streak.life += delta
      streak.img.x += streak.vx * delta * 0.12
      streak.img.setAlpha(streak.life < 180 ? streak.life / 180 * 0.35 : Math.max(0, 1 - (streak.life - 180) / 420) * 0.35)
      if (streak.img.x > LOGICAL_WIDTH + 80 || streak.life > 700) {
        streak.img.x = -120
        streak.img.y = 160 + Math.random() * 760
        streak.vx = 4 + Math.random() * 6
        streak.life = 0
        streak.img.setDisplaySize(90 + Math.random() * 160, 2)
      }
    }
  }

  private respawnSpeck(speck: Speck, initial: boolean): void {
    const spread = this.variation === 'core' ? 90 : 280
    speck.img.x = CX + (Math.random() - 0.5) * spread * 2
    speck.img.y = CREATOR_Y + (Math.random() - 0.5) * (this.variation === 'core' ? 80 : 220)
    speck.vx = (Math.random() - 0.5) * 1.4
    speck.vy = this.variation === 'particles' ? -0.6 - Math.random() * 0.8 : (Math.random() - 0.5) * 0.8
    speck.max = 900 + Math.random() * 1400
    speck.life = initial ? Math.random() * speck.max : 0
    const s = 0.2 + Math.random() * 0.45
    speck.img.setDisplaySize(6 * s, 6 * s)
  }

  private letterSpan(): number {
    const extra = (this.letters.length - 1) * 4
    return this.letterWidths.reduce((sum, w) => sum + w, 0) + extra
  }

  private ensureMusic(): void {
    if (this.musicStarted) {
      return
    }
    this.musicStarted = true
    musicManager.playContext({
      role: MusicRole.MENU,
      storyEvent: 'boot',
      intensity: 0,
      emotionalState: 'wonder',
    }, true)
  }
}
