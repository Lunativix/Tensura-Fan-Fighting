import Phaser from 'phaser'
import { generateFallbackTextures } from '../assets/AssetService.ts'
import { BootSequence } from '../boot/BootSequence.ts'
import { markBootHandoff, pickBootVariation } from '../boot/branding.ts'
import { LoadProgress } from '../boot/LoadProgress.ts'
import { GameFlow } from '../types/game.ts'
import { session } from '../game/GameState.ts'
import { SceneKeys } from '../game/SceneKeys.ts'
import { runAccountAsyncChecks, runFoundationChecks } from '../tests/foundationChecks.ts'
import { runIntegrationChecks } from '../tests/integrationChecks.ts'
import { runCombatQa } from '../tests/combatQa.ts'
import { reportMissingSkillAnimsAtBoot } from '../combat/anim/audit.ts'
import { createSpriteAnims, loadPunchedClips, loadSpriteManifests } from '../sprites/SpriteLoader.ts'
import { FX_FRAME_COUNT, FX_FRAME_SIZE, FX_SHEETS, fxAnimKey, fxTextureKey } from '../vfx/FxLibrary.ts'
import { STAGES, stageKey } from '../game/Stages.ts'
import { queuePortraitLoads, punchMenuPortraits } from '../ui/portraits.ts'
import { ensureSlimeTextures } from '../characters/slimeLook.ts'

const SPRITE_STALL_MS = 90000

export class PreloadScene extends Phaser.Scene {
  private menuStarted = false
  private loadDone = false
  private coreStarted = false
  private sequence!: BootSequence
  private readonly progress = new LoadProgress()

  constructor() {
    super(SceneKeys.Preload)
  }

  preload(): void {
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.warn(`[preload] missing asset: ${file.url}`)
    })
  }

  create(): void {
    session.flow = GameFlow.PRELOAD
    this.cameras.main.setBackgroundColor('#020308')
    generateFallbackTextures(this)
    this.sequence = new BootSequence(this, pickBootVariation())
    this.runBootChecks()
    void runAccountAsyncChecks().then((account) => {
      if (account.failed.length > 0) {
        console.error('[account tests]', account.failed)
      } else {
        console.info(`[account tests] ${account.passed} passed`)
      }
    }).catch((error: unknown) => {
      console.error('[account tests] crashed', error)
    })
    this.queueCoreAssets()
    this.load.on(Phaser.Loader.Events.PROGRESS, (value: number) => {
      this.progress.phaser = value
    })
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.progress.phaser = 1
      this.afterCoreAssets()
    })
    this.load.start()
  }

  update(_time: number, delta: number): void {
    this.sequence.update(delta)
    this.sequence.sync(this.progress)
  }

  private queueCoreAssets(): void {
    for (const stage of STAGES) {
      this.load.image(stageKey(stage.id), `/stages/${stage.id}.png`)
    }
    for (const fx of FX_SHEETS) {
      this.load.spritesheet(fxTextureKey(fx.id), `/fx/${fx.file}`, {
        frameWidth: FX_FRAME_SIZE,
        frameHeight: FX_FRAME_SIZE,
      })
    }
    queuePortraitLoads(this.load)
  }

  private afterCoreAssets(): void {
    if (this.coreStarted) {
      return
    }
    this.coreStarted = true
    this.createFxAnims()
    punchMenuPortraits(this)
    ensureSlimeTextures(this, true)
    void this.loadSheets()
  }

  private runBootChecks(): void {
    const host = window as unknown as {
      tensuraQa?: { foundationFailed: string[], integrationFailed: string[], foundationPassed: number, integrationPassed: number }
    }
    try {
      const result = runFoundationChecks()
      runCombatQa(result)
      reportMissingSkillAnimsAtBoot()
      if (result.failed.length > 0) {
        console.error('[foundation tests]', result.failed)
      } else {
        console.info(`[foundation tests] ${result.passed} passed`)
      }
      const integration = runIntegrationChecks()
      if (integration.failed.length > 0) {
        console.error('[integration tests]', integration.failed)
      } else {
        console.info(`[integration tests] ${integration.passed} passed`)
      }
      host.tensuraQa = {
        foundationFailed: result.failed,
        integrationFailed: integration.failed,
        foundationPassed: result.passed,
        integrationPassed: integration.passed,
      }
    } catch (error) {
      console.error('[boot tests] crashed', error)
    }
  }

  private createFxAnims(): void {
    let ready = 0
    for (const fx of FX_SHEETS) {
      const key = fxTextureKey(fx.id)
      if (!this.textures.exists(key)) {
        continue
      }
      if (!this.anims.exists(fxAnimKey(fx.id))) {
        this.anims.create({
          key: fxAnimKey(fx.id),
          frames: this.anims.generateFrameNumbers(key, { start: 0, end: FX_FRAME_COUNT - 1 }),
          frameRate: fx.fps,
          repeat: fx.loop ? -1 : 0,
        })
      }
      ready += 1
    }
    if (ready > 0) {
      console.info(`[fx] ${ready} effect sheet(s) ready`)
    }
  }

  private async loadSheets(): Promise<void> {
    let stallTimer: number | undefined
    const bumpStall = (): void => {
      if (stallTimer !== undefined) {
        window.clearTimeout(stallTimer)
      }
      stallTimer = window.setTimeout(() => {
        console.warn('[sprites] still loading, opening menu')
        if (this.sys.isActive()) {
          createSpriteAnims(this)
          this.finishLoad()
        }
      }, SPRITE_STALL_MS)
    }
    bumpStall()
    try {
      const found = await loadSpriteManifests()
      this.progress.manifests = true
      bumpStall()
      if (found.length > 0) {
        await loadPunchedClips(this, found, {
          onProgress: (done, total) => {
            bumpStall()
            this.progress.sprites = total > 0 ? done / total : 1
          },
        })
        createSpriteAnims(this)
        console.info(`[sprites] ${found.length} fighter art pack(s) ready`)
      } else {
        this.progress.sprites = 1
      }
    } catch (error) {
      console.error('[sprites] load failed', error)
      this.progress.manifests = true
      this.progress.sprites = 1
    } finally {
      if (stallTimer !== undefined) {
        window.clearTimeout(stallTimer)
      }
    }
    this.finishLoad()
  }

  private finishLoad(): void {
    if (this.loadDone) {
      return
    }
    this.loadDone = true
    this.progress.ready = true
    void this.goMenu()
  }

  private async goMenu(): Promise<void> {
    if (this.menuStarted) {
      return
    }
    while (this.sys.isActive() && !this.sequence.ready) {
      await waitMs(40)
    }
    if (!this.sys.isActive() || this.menuStarted) {
      return
    }
    this.menuStarted = true
    markBootHandoff()
    await this.sequence.finish()
    if (!this.sys.isActive()) {
      return
    }
    this.scene.start(SceneKeys.Hub)
  }
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}
