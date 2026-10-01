import Phaser from 'phaser'
import { CHARACTERS, PLAYABLE_FIGHTERS } from '../config/characters.ts'
import { flavorOf } from '../config/rosterFlavor.ts'
import { FighterId, GameFlow, type FighterIdValue } from '../types/game.ts'
import { PlayMode, session, syncLeadFromTeams } from '../game/GameState.ts'
import { cycleStageId, stageLabel } from '../game/Stages.ts'
import { SceneKeys } from '../game/SceneKeys.ts'
import { goHub } from '../game/nav.ts'
import { audio } from '../audio/AudioManager.ts'
import { musicManager } from '../audio/music/MusicManager.ts'
import { MusicRole } from '../audio/music/types.ts'
import { MenuInput } from '../input/MenuInput.ts'
import { FONT, FONT_UI, UI } from '../ui/theme.ts'
import { portraitArtKey, portraitHeadKey } from '../ui/portraits.ts'
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../engine/Time.ts'
import { saveManager } from '../save/SaveManager.ts'
import {
  MovesetId,
  VariantMode,
  cycleChronologyMission,
  cycleMode,
  cycleSelectableVariant,
  periodByMissionId,
  resolveLoadout,
  type FighterLoadout,
} from '../combat/variants/index.ts'
import { variantById } from '../combat/variants/catalog.ts'
import { appearanceById } from '../story/visual/catalog.ts'

const TEAM = 3
const PICK_SECONDS = 30
const COLS = 4
const TILE = 132
const GAP = 16

export class CharacterSelectScene extends Phaser.Scene {
  private ids: FighterIdValue[] = []
  private cursor = 0
  private slot = 0
  private playerSlots: Array<FighterIdValue | null> = [null, null, null]
  private cpuSlots: Array<FighterIdValue | null> = [null, null, null]
  private pickingCpu = false
  private locked = false
  private clock = PICK_SECONDS
  private inputMenu!: MenuInput
  private tiles: Phaser.GameObjects.Rectangle[] = []
  private cursorMark!: Phaser.GameObjects.Text
  private largeArt!: Phaser.GameObjects.Image
  private nameTxt!: Phaser.GameObjects.Text
  private metaTxt!: Phaser.GameObjects.Text
  private quoteTxt!: Phaser.GameObjects.Text
  private orderTxt!: Phaser.GameObjects.Text
  private timerTxt!: Phaser.GameObjects.Text
  private stageTxt!: Phaser.GameObjects.Text
  private heading!: Phaser.GameObjects.Text
  private variantTxt!: Phaser.GameObjects.Text
  private modeTxt!: Phaser.GameObjects.Text
  private teamHeads: Phaser.GameObjects.Image[] = []
  private foeHeads: Phaser.GameObjects.Image[] = []
  private hoverLoadout!: FighterLoadout
  private playerLoadouts: Array<FighterLoadout | null> = [null, null, null]
  private cpuLoadouts: Array<FighterLoadout | null> = [null, null, null]

  constructor() {
    super(SceneKeys.CharacterSelect)
  }

  create(): void {
    session.flow = GameFlow.CHARACTER_SELECT
    musicManager.playContext({
      role: MusicRole.MENU,
      storyEvent: 'character-select',
      intensity: 1,
    }, true)
    this.ids = PLAYABLE_FIGHTERS
    const prefs = saveManager.load().live.variantPrefs
    if (prefs) {
      session.variantMode = prefs.mode
      session.chronologyMissionId = prefs.chronologyMissionId
    }
    this.cursor = Math.max(0, this.ids.indexOf(session.playerFighter))
    this.slot = 0
    this.playerSlots = [null, null, null]
    this.cpuSlots = [null, null, null]
    this.playerLoadouts = [null, null, null]
    this.cpuLoadouts = [null, null, null]
    this.pickingCpu = false
    this.locked = false
    this.clock = PICK_SECONDS

    this.drawBackdrop()
    this.add.text(70, 28, '1P', {
      fontFamily: FONT, fontSize: '36px', color: '#7CFF7C',
    })
    this.heading = this.add.text(960, 36, 'CHOISISSEZ VOTRE EQUIPE', {
      fontFamily: FONT, fontSize: '34px', color: UI.gold,
    }).setOrigin(0.5, 0)
    this.timerTxt = this.add.text(960, 78, '00:30', {
      fontFamily: FONT, fontSize: '28px', color: UI.paper,
    }).setOrigin(0.5, 0)
    this.stageTxt = this.add.text(960, 112, '', {
      fontFamily: FONT_UI, fontSize: '16px', color: UI.muted,
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true })
    this.stageTxt.on('pointerup', () => {
      session.stageId = cycleStageId(session.stageId, 1)
      this.refresh()
    })
    const back = this.add.text(1840, 36, 'RETOUR', {
      fontFamily: FONT_UI, fontSize: '22px', color: UI.paper,
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true })
    back.on('pointerup', () => goHub(this))

    this.largeArt = this.add.image(380, 760, portraitArtKey(this.ids[this.cursor] ?? FighterId.rimuru))
    this.largeArt.setOrigin(0.5, 1)
    this.largeArt.setDisplaySize(520, 780)
    this.add.rectangle(380, 860, 620, 4, UI.panelEdge, 0.35)

    this.nameTxt = this.add.text(80, 880, '', { fontFamily: FONT, fontSize: '46px', color: UI.paper })
    this.metaTxt = this.add.text(80, 936, '', { fontFamily: FONT_UI, fontSize: '20px', color: UI.gold })
    this.quoteTxt = this.add.text(80, 976, '', {
      fontFamily: FONT, fontSize: '20px', color: '#ffe082', fontStyle: 'italic',
    })
    this.variantTxt = this.add.text(80, 1012, '', { fontFamily: FONT_UI, fontSize: '16px', color: UI.cyan })
    this.modeTxt = this.add.text(80, 1034, '', { fontFamily: FONT_UI, fontSize: '15px', color: UI.muted })

    this.buildGrid()
    this.buildTeamRow()
    this.orderTxt = this.add.text(80, 1056, '', {
      fontFamily: FONT_UI, fontSize: '16px', color: UI.gold,
    })

    this.inputMenu = new MenuInput()
    this.inputMenu.attach()
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.inputMenu.detach())
    this.input.keyboard?.on('keydown-Z', () => {
      session.stageId = cycleStageId(session.stageId, 1)
      this.refresh()
    })
    this.input.keyboard?.on('keydown-R', () => {
      session.variantMode = cycleMode(session.variantMode, 1)
      this.syncHoverLoadout()
      this.refresh()
    })
    this.input.keyboard?.on('keydown-C', () => {
      if (session.variantMode !== VariantMode.CHRONOLOGY) {
        return
      }
      session.chronologyMissionId = cycleChronologyMission(session.chronologyMissionId, 1)
      this.syncHoverLoadout()
      this.refresh()
    })
    this.input.keyboard?.on('keydown-X', () => {
      if (session.variantMode !== VariantMode.CUSTOM) {
        return
      }
      this.hoverLoadout = {
        ...this.hoverLoadout,
        movesetId: this.hoverLoadout.movesetId === MovesetId.CUSTOM ? MovesetId.NARRATIVE : MovesetId.CUSTOM,
      }
      this.refresh()
    })
    this.syncHoverLoadout()
    this.refresh()
  }

  update(_time: number, delta: number): void {
    if (this.inputMenu.justBack) {
      audio.playSfx('back')
      goHub(this)
      return
    }
    if (this.locked) {
      return
    }
    this.clock -= delta / 1000
    if (this.clock <= 0) {
      this.autoFillAndStart()
      return
    }
    this.timerTxt.setText(`00:${String(Math.max(0, Math.ceil(this.clock))).padStart(2, '0')}`)
    const cols = COLS
    if (this.inputMenu.justLeft) {
      this.moveCursor(-1)
    }
    if (this.inputMenu.justRight) {
      this.moveCursor(1)
    }
    if (this.inputMenu.justUp) {
      this.moveCursor(-cols)
    }
    if (this.inputMenu.justDown) {
      this.moveCursor(cols)
    }
    if (this.inputMenu.justPrevTab) {
      this.cycleHoverVariant(-1)
    }
    if (this.inputMenu.justNextTab) {
      this.cycleHoverVariant(1)
    }
    if (this.inputMenu.justConfirm) {
      this.confirm()
    }
  }

  private drawBackdrop(): void {
    this.add.rectangle(960, 540, LOGICAL_WIDTH, LOGICAL_HEIGHT, 0x08101c, 1)
    const g = this.add.graphics()
    g.fillGradientStyle(0x102038, 0x0a1424, 0x1a1030, 0x081018, 1)
    g.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT)
    g.fillStyle(0x4fc3f7, 0.05)
    g.fillCircle(380, 480, 360)
    g.lineStyle(2, 0xd4b45a, 0.2)
    g.strokeRect(24, 16, 1872, 1048)
  }

  private gridOrigin(): { x: number, y: number } {
    return { x: 980, y: 200 }
  }

  private buildGrid(): void {
    this.tiles = []
    const origin = this.gridOrigin()
    this.ids.forEach((id, i) => {
      const col = i % COLS
      const row = Math.floor(i / COLS)
      const x = origin.x + col * (TILE + GAP)
      const y = origin.y + row * (TILE + GAP)
      const tile = this.add.rectangle(x, y, TILE, TILE, 0x102038, 0.92)
      tile.setStrokeStyle(3, 0xffffff, 0.22)
      const head = this.add.image(x, y, portraitHeadKey(id))
      head.setDisplaySize(TILE - 10, TILE - 10)
      tile.setInteractive({ useHandCursor: true })
      tile.on('pointerover', () => {
        this.cursor = i
        this.syncHoverLoadout()
        this.refresh()
      })
      tile.on('pointerup', () => {
        this.cursor = i
        this.syncHoverLoadout()
        this.refresh()
        this.confirm()
      })
      this.tiles.push(tile)
    })
    this.cursorMark = this.add.text(0, 0, '1P ▼', {
      fontFamily: FONT_UI, fontSize: '18px', color: '#7CFF7C',
    }).setOrigin(0.5, 1)
  }

  private buildTeamRow(): void {
    this.teamHeads = []
    this.foeHeads = []
    this.add.text(980, 680, 'VOTRE EQUIPE', { fontFamily: FONT_UI, fontSize: '16px', color: UI.cyan })
    this.add.text(1480, 680, 'ADVERSAIRES', { fontFamily: FONT_UI, fontSize: '16px', color: UI.rose })
    for (let i = 0; i < TEAM; i += 1) {
      const tx = 1040 + i * 110
      const ox = 1540 + i * 110
      this.add.rectangle(tx, 760, 88, 88, UI.panel, 0.9).setStrokeStyle(2, UI.panelEdge, 0.7)
      this.add.rectangle(ox, 760, 88, 88, UI.panel, 0.9).setStrokeStyle(2, 0xff8a80, 0.55)
      this.add.text(tx, 818, String(i + 1), { fontFamily: FONT, fontSize: '16px', color: UI.gold }).setOrigin(0.5, 0)
      this.add.text(ox, 818, String(i + 1), { fontFamily: FONT, fontSize: '16px', color: UI.rose }).setOrigin(0.5, 0)
      const empty = portraitHeadKey(FighterId.rimuru)
      this.teamHeads[i] = this.add.image(tx, 760, empty).setDisplaySize(78, 78).setAlpha(0.15)
      this.foeHeads[i] = this.add.image(ox, 760, empty).setDisplaySize(78, 78).setAlpha(0.15)
    }
  }

  private moveCursor(delta: number): void {
    this.cursor = (this.cursor + delta + this.ids.length) % this.ids.length
    audio.playSfx('move')
    this.syncHoverLoadout()
    this.refresh()
  }

  private resolveOpts() {
    const data = saveManager.load()
    return {
      mode: session.variantMode,
      chronologyMissionId: session.chronologyMissionId,
      story: data.story,
      collectionAppearances: data.collection.appearances,
    }
  }

  private syncHoverLoadout(): void {
    const id = this.ids[this.cursor] ?? FighterId.rimuru
    this.hoverLoadout = resolveLoadout(id, { ...this.resolveOpts(), pick: this.hoverLoadout?.fighterId === id ? this.hoverLoadout : null })
  }

  private cycleHoverVariant(dir: 1 | -1): void {
    if (session.variantMode === VariantMode.CHRONOLOGY) {
      return
    }
    const id = this.ids[this.cursor] ?? FighterId.rimuru
    const next = cycleSelectableVariant(id, this.hoverLoadout.variantId, dir, this.resolveOpts())
    this.hoverLoadout = { ...this.hoverLoadout, fighterId: id, variantId: next.id }
    audio.playSfx('move')
    this.refresh()
  }

  private refresh(): void {
    const id = this.ids[this.cursor] ?? FighterId.rimuru
    const def = CHARACTERS[id]
    const flavor = flavorOf(id)
    this.tiles.forEach((tile, i) => {
      const picked = this.playerSlots.includes(this.ids[i] ?? 'rimuru') || this.cpuSlots.includes(this.ids[i] ?? 'rimuru')
      tile.setStrokeStyle(4, i === this.cursor ? 0x7CFF7C : picked ? 0xffd54f : 0xffffff, i === this.cursor ? 1 : picked ? 0.85 : 0.2)
    })
    const origin = this.gridOrigin()
    const col = this.cursor % COLS
    const row = Math.floor(this.cursor / COLS)
    this.cursorMark.setPosition(origin.x + col * (TILE + GAP), origin.y + row * (TILE + GAP) - TILE / 2 - 6)
    this.nameTxt.setText(def.name.toUpperCase())
    this.metaTxt.setText(`${flavor.role.toUpperCase()}   •   ${flavor.elementLabel.toUpperCase()}`)
    this.quoteTxt.setText(`« ${flavor.quote} »`)
    const variant = variantById(this.hoverLoadout.variantId)
    const look = variant ? appearanceById(variant.appearanceId) : undefined
    const period = periodByMissionId(session.chronologyMissionId)
    const modeLabel = session.variantMode === VariantMode.CHRONOLOGY
      ? 'CHRONOLOGY'
      : session.variantMode === VariantMode.CUSTOM
        ? 'CUSTOM / WHAT-IF'
        : 'FREE'
    this.variantTxt.setText(`Variante  ${variant?.label ?? '—'}   ${session.variantMode === VariantMode.CHRONOLOGY ? '' : '(Q / E)'}`)
    const movesetLine = session.variantMode === VariantMode.CUSTOM
      ? `Moveset  ${this.hoverLoadout.movesetId === MovesetId.CUSTOM ? 'Custom' : 'Narrative'}   (X)`
      : `Moveset  Narrative`
    const periodLine = session.variantMode === VariantMode.CHRONOLOGY
      ? `Periode  ${period?.title ?? session.chronologyMissionId}   (C)`
      : look?.artStatus === 'missing-period-art'
        ? 'Art de periode manquant — fallback roster'
        : ''
    this.modeTxt.setText(`Mode  ${modeLabel}   (R)     ${movesetLine}     ${periodLine}`.trim())
    const portraitId = look?.portrait && this.textures.exists(portraitArtKey(look.portrait)) ? look.portrait : id
    if (this.textures.exists(portraitArtKey(portraitId))) {
      this.largeArt.setTexture(portraitArtKey(portraitId))
      this.fitArt(this.largeArt, 560, 780)
    }
    this.stageTxt.setText(`Arene  ${stageLabel(session.stageId)}   (Z pour changer)`)
    this.heading.setText(this.pickingCpu ? 'CHOISISSEZ L\'EQUIPE ADVERSE' : 'CHOISISSEZ VOTRE EQUIPE')
    this.paintRow(this.teamHeads, this.playerSlots)
    this.paintRow(this.foeHeads, this.cpuSlots)
    const names = this.playerSlots.map((fid, i) => fid ? `${i + 1}.${CHARACTERS[fid].name}` : `${i + 1}.—`)
    this.orderTxt.setText(`Ordre de switch   ${names.join('  →  ')}`)
  }

  private fitArt(image: Phaser.GameObjects.Image, maxW: number, maxH: number): void {
    const src = image.texture.getSourceImage() as HTMLImageElement
    const w = src.width || 1
    const h = src.height || 1
    const scale = Math.min(maxW / w, maxH / h)
    image.setDisplaySize(w * scale, h * scale)
  }

  private paintRow(images: Phaser.GameObjects.Image[], slots: Array<FighterIdValue | null>): void {
    images.forEach((img, i) => {
      const fid = slots[i]
      if (!fid || !this.textures.exists(portraitHeadKey(fid))) {
        img.setAlpha(0.12)
        return
      }
      img.setTexture(portraitHeadKey(fid))
      img.setDisplaySize(78, 78)
      img.setAlpha(1)
    })
  }

  private confirm(): void {
    const id = this.ids[this.cursor]
    if (!id || !CHARACTERS[id].playable || this.locked) {
      return
    }
    const target = this.pickingCpu ? this.cpuSlots : this.playerSlots
    if (target.includes(id)) {
      audio.playSfx('back')
      return
    }
    target[this.slot] = id
    const loadouts = this.pickingCpu ? this.cpuLoadouts : this.playerLoadouts
    loadouts[this.slot] = { ...this.hoverLoadout, fighterId: id }
    audio.playSfx('confirm')
    this.tweens.add({
      targets: this.largeArt,
      x: this.largeArt.x + 12,
      duration: 90,
      yoyo: true,
    })
    const nextEmpty = target.findIndex((slot) => slot === null)
    if (nextEmpty >= 0) {
      this.slot = nextEmpty
      this.refresh()
      return
    }
    if (!this.pickingCpu && session.playMode === PlayMode.VERSUS_LOCAL) {
      this.pickingCpu = true
      this.slot = 0
      this.refresh()
      return
    }
    if (!this.pickingCpu) {
      this.cpuSlots = this.autoOpponents(target as FighterIdValue[])
      this.cpuLoadouts = this.cpuSlots.map((id) => id ? this.loadoutFor(id) : null)
    }
    this.finish()
  }

  private autoOpponents(taken: FighterIdValue[]): FighterIdValue[] {
    const pool = this.ids.filter((id) => !taken.includes(id))
    return [pool[0], pool[1], pool[2]].filter((id): id is FighterIdValue => Boolean(id))
  }

  private autoFillAndStart(): void {
    if (this.locked) {
      return
    }
    const fill = (slots: Array<FighterIdValue | null>): FighterIdValue[] => {
      const out = [...slots]
      const taken = out.filter((id): id is FighterIdValue => Boolean(id))
      for (let i = 0; i < TEAM; i += 1) {
        if (out[i]) {
          continue
        }
        const pick = this.ids.find((id) => !taken.includes(id))
        out[i] = pick ?? this.ids[i] ?? FighterId.rimuru
        taken.push(out[i]!)
      }
      return out as FighterIdValue[]
    }
    const player = fill(this.playerSlots)
    this.playerSlots = player
    this.playerLoadouts = player.map((id, i) => this.loadoutFor(id, this.playerLoadouts[i]))
    this.cpuSlots = this.cpuSlots.every(Boolean) ? this.cpuSlots as FighterIdValue[] : this.autoOpponents(player)
    this.cpuLoadouts = (this.cpuSlots as FighterIdValue[]).map((id, i) => this.loadoutFor(id, this.cpuLoadouts[i]))
    this.finish()
  }

  private loadoutFor(id: FighterIdValue, existing?: FighterLoadout | null): FighterLoadout {
    return resolveLoadout(id, { ...this.resolveOpts(), pick: existing?.fighterId === id ? existing : null })
  }

  private finish(): void {
    if (this.locked) {
      return
    }
    const player = this.playerSlots.filter((id): id is FighterIdValue => Boolean(id))
    const cpu = this.cpuSlots.filter((id): id is FighterIdValue => Boolean(id))
    if (player.length < TEAM || cpu.length < TEAM) {
      return
    }
    this.locked = true
    session.playerTeam = player
    session.cpuTeam = cpu
    session.playerLoadouts = player.map((id, i) => this.loadoutFor(id, this.playerLoadouts[i]))
    session.cpuLoadouts = cpu.map((id, i) => this.loadoutFor(id, this.cpuLoadouts[i]))
    const data = saveManager.load()
    data.live.variantPrefs = {
      mode: session.variantMode,
      chronologyMissionId: session.chronologyMissionId,
      preferred: Object.fromEntries(session.playerLoadouts.map((item) => [item.fighterId, {
        variantId: item.variantId,
        movesetId: item.movesetId,
      }])),
    }
    saveManager.save(data)
    syncLeadFromTeams()
    session.trainingMode = session.playMode === PlayMode.TRAINING
    session.infiniteResources = session.playMode === PlayMode.TRAINING
    this.time.delayedCall(350, () => this.scene.start(SceneKeys.Fight))
  }
}
