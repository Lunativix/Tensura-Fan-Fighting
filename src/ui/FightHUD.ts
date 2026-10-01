import type Phaser from 'phaser'
import type { Fighter } from '../characters/Fighter.ts'
import type { TeamBench } from '../game/TeamBench.ts'
import { CHARACTERS } from '../config/characters.ts'
import { spriteFrameKey, spritePackKey } from '../sprites/SpriteManifest.ts'
import { portraitHeadKey } from './portraits.ts'
import { FONT, FONT_UI, UI } from './theme.ts'

export class ResourceBar {
  private readonly fill: Phaser.GameObjects.Rectangle
  private readonly width: number

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    color: number,
    right = false,
  ) {
    this.width = width
    const bg = scene.add.rectangle(x, y, width + 6, height + 6, 0x071018, 0.92)
    bg.setStrokeStyle(1, UI.panelEdge, 0.55)
    bg.setScrollFactor(0).setDepth(50)
    this.fill = scene.add.rectangle(x - width / 2, y, width, height - 4, color, 1)
    this.fill.setOrigin(0, 0.5)
    this.fill.setScrollFactor(0)
    this.fill.setDepth(51)
    if (right) {
      this.fill.setOrigin(1, 0.5)
      this.fill.x = x + width / 2
    }
  }

  setRatio(ratio: number): void {
    const r = Math.max(0, Math.min(1, ratio))
    this.fill.displayWidth = this.width * r
  }
}

export class FightHUD {
  private readonly p1hp: ResourceBar
  private readonly p1en: ResourceBar
  private readonly p1ult: ResourceBar
  private readonly p2hp: ResourceBar
  private readonly p2en: ResourceBar
  private readonly p2ult: ResourceBar
  private readonly combo: Phaser.GameObjects.Text
  private readonly ultReady: Phaser.GameObjects.Text
  private readonly cds: Phaser.GameObjects.Text
  private readonly timer: Phaser.GameObjects.Text
  private readonly round: Phaser.GameObjects.Text
  private readonly form: Phaser.GameObjects.Text
  private readonly p1Name: Phaser.GameObjects.Text
  private readonly p2Name: Phaser.GameObjects.Text
  private readonly p1Order: Phaser.GameObjects.Text
  private readonly p2Order: Phaser.GameObjects.Text
  private readonly p1Portraits: Phaser.GameObjects.Arc[]
  private readonly p2Portraits: Phaser.GameObjects.Arc[]
  private readonly playerTeam: TeamBench | null
  private readonly cpuTeam: TeamBench | null

  constructor(scene: Phaser.Scene, p1: Fighter, p2: Fighter, playerTeam: TeamBench | null = null, cpuTeam: TeamBench | null = null) {
    this.playerTeam = playerTeam
    this.cpuTeam = cpuTeam

    scene.add.rectangle(360, 58, 560, 96, UI.panel, 0.72).setScrollFactor(0).setDepth(49)
      .setStrokeStyle(2, UI.panelEdge, 0.45)
    scene.add.rectangle(1560, 58, 560, 96, UI.panel, 0.72).setScrollFactor(0).setDepth(49)
      .setStrokeStyle(2, UI.panelEdge, 0.45)
    scene.add.rectangle(960, 62, 150, 78, UI.panel, 0.8).setScrollFactor(0).setDepth(49)
      .setStrokeStyle(2, UI.panelEdge, 0.7)

    this.p1Name = scene.add.text(86, 22, p1.def.name.toUpperCase(), {
      fontFamily: FONT, fontSize: '26px', color: UI.paper,
    }).setScrollFactor(0).setDepth(52)
    this.p2Name = scene.add.text(1834, 22, p2.def.name.toUpperCase(), {
      fontFamily: FONT, fontSize: '26px', color: UI.paper,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(52)

    this.p1hp = new ResourceBar(scene, 370, 72, 500, 22, UI.hp)
    this.p2hp = new ResourceBar(scene, 1550, 72, 500, 22, UI.hp, true)
    this.p1en = new ResourceBar(scene, 320, 100, 400, 12, UI.energy)
    this.p2en = new ResourceBar(scene, 1600, 100, 400, 12, UI.energy, true)
    this.p1ult = new ResourceBar(scene, 280, 120, 320, 8, UI.ult)
    this.p2ult = new ResourceBar(scene, 1640, 120, 320, 8, UI.ult, true)

    this.p1Portraits = this.drawTeamDots(scene, 90, 150, playerTeam, false)
    this.p2Portraits = this.drawTeamDots(scene, 1830, 150, cpuTeam, true)
    this.p1Order = scene.add.text(140, 150, this.orderText(playerTeam), {
      fontFamily: FONT_UI, fontSize: '14px', color: UI.gold,
    }).setScrollFactor(0).setDepth(52)
    this.p2Order = scene.add.text(1780, 150, this.orderText(cpuTeam), {
      fontFamily: FONT_UI, fontSize: '14px', color: UI.rose, align: 'right',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(52)

    this.combo = scene.add.text(960, 210, '', {
      fontFamily: FONT, fontSize: '40px', color: '#fff3b0',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(52)
    this.ultReady = scene.add.text(960, 258, '', {
      fontFamily: FONT_UI, fontSize: '18px', color: UI.gold,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(52)
    this.cds = scene.add.text(80, 188, '', {
      fontFamily: FONT_UI, fontSize: '15px', color: UI.muted,
    }).setScrollFactor(0).setDepth(52)
    this.timer = scene.add.text(960, 28, '99', {
      fontFamily: FONT, fontSize: '40px', color: UI.paper,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(52)
    this.round = scene.add.text(960, 78, 'ROUND 1', {
      fontFamily: FONT_UI, fontSize: '14px', color: UI.muted,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(52)
    this.form = scene.add.text(80, 230, '', {
      fontFamily: FONT_UI, fontSize: '15px', color: UI.gold,
    }).setScrollFactor(0).setDepth(52)

    this.drawMiniPortraits(scene, playerTeam, 70, 148, false)
    this.drawMiniPortraits(scene, cpuTeam, 1850, 148, true)
  }

  update(p1: Fighter, p2: Fighter, hits: number, timer = 99, round = 1): void {
    this.p1hp.setRatio(p1.hp / p1.def.maxHp)
    this.p2hp.setRatio(p2.hp / p2.def.maxHp)
    this.p1en.setRatio(p1.energy / p1.def.maxEnergy)
    this.p2en.setRatio(p2.energy / p2.def.maxEnergy)
    this.p1ult.setRatio(p1.ultimate / 100)
    this.p2ult.setRatio(p2.ultimate / 100)
    this.p1Name.setText(p1.def.name.toUpperCase())
    this.p2Name.setText(p2.def.name.toUpperCase())
    this.combo.setText(hits > 1 ? `${hits} HITS` : '')
    this.ultReady.setText(p1.ultimate >= 100 ? 'ULTIME PRET' : '')
    const labels = ['U', 'I', 'O', 'P']
    this.cds.setText(
      p1.kit.skills.map((skill, i) => {
        const ready = p1.cooldowns.ready(skill.id)
        return `${labels[i]} ${ready ? 'OK' : Math.ceil(p1.cooldowns.remainingMs(skill.id) / 1000)}s`
      }).join('   '),
    )
    this.timer.setText(String(Math.max(0, Math.ceil(timer))))
    this.round.setText(`ROUND ${round}`)
    this.form.setText(p1.transform.active ? 'TRANSFORME' : '')
    this.p1Order.setText(this.orderText(this.playerTeam))
    this.p2Order.setText(this.orderText(this.cpuTeam))
    this.p1Portraits.forEach((dot, i) => dot.setStrokeStyle(3, i === (this.playerTeam?.active ?? 0) ? 0xfff3b0 : 0xd4b45a, 1))
    this.p2Portraits.forEach((dot, i) => dot.setStrokeStyle(3, i === (this.cpuTeam?.active ?? 0) ? 0xff8a80 : 0xd4b45a, 1))
  }

  private orderText(team: TeamBench | null): string {
    if (!team) {
      return ''
    }
    return team.slots.map((id, i) => `${i + 1} ${CHARACTERS[id].name}`).join('  →  ')
  }

  private drawTeamDots(scene: Phaser.Scene, x: number, y: number, team: TeamBench | null, right: boolean): Phaser.GameObjects.Arc[] {
    if (!team) {
      return []
    }
    return team.slots.map((id, i) => {
      const px = right ? x - i * 28 : x + i * 28
      const color = CHARACTERS[id].color
      return scene.add.circle(px, y + 22, 8, color, 1).setScrollFactor(0).setDepth(52)
        .setStrokeStyle(2, UI.panelEdge, 0.9)
    })
  }

  private drawMiniPortraits(scene: Phaser.Scene, team: TeamBench | null, x: number, y: number, right: boolean): void {
    if (!team) {
      return
    }
    team.slots.forEach((id, i) => {
      const key = scene.textures.exists(portraitHeadKey(id))
        ? portraitHeadKey(id)
        : scene.textures.exists(spritePackKey(id, 'idle'))
          ? spritePackKey(id, 'idle')
          : spriteFrameKey(id, 'idle', 0)
      if (!scene.textures.exists(key)) {
        return
      }
      const px = right ? x - i * 54 : x + i * 54
      const sprite = scene.add.sprite(px, y + 48, key, 0)
      sprite.setOrigin(0.5, 0.5)
      sprite.setDisplaySize(44, 44)
      sprite.setScrollFactor(0)
      sprite.setDepth(52)
      if (right) {
        sprite.setFlipX(true)
      }
    })
  }
}
