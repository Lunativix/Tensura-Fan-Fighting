import Phaser from 'phaser'
import { GameFlow } from '../types/game.ts'
import { session } from '../game/GameState.ts'
import { emptyActions } from '../input/Actions.ts'
import type { Fighter } from '../characters/Fighter.ts'
import type { FighterIdValue } from '../types/game.ts'
import type { CinematicApi } from './CinematicApi.ts'
import { CinematicCamera } from './CinematicCamera.ts'
import { CinematicDialogue } from './CinematicDialogue.ts'
import { CinematicEffects } from './CinematicEffects.ts'
import { CinematicAudio } from './CinematicAudio.ts'
import { CinematicTimeline } from './CinematicTimeline.ts'
import { CinematicState } from './CinematicState.ts'
import { CinematicRegistry } from './CinematicRegistry.ts'
import { DialogueAdvance } from '../input/DialogueAdvance.ts'
import type { CinematicContext, CinematicDef, CinematicHost, CinematicPhase } from './types.ts'
import { registerCinematics } from './register.ts'

export class CinematicManager implements CinematicApi {
  readonly scene: Phaser.Scene
  readonly camera: CinematicCamera
  readonly dialogue: CinematicDialogue
  readonly fx: CinematicEffects
  readonly audio: CinematicAudio
  readonly registry = new CinematicRegistry()
  readonly state = new CinematicState()
  ctx: CinematicContext = { playerTeam: [], cpuTeam: [] }

  private readonly host: CinematicHost
  private timeline: CinematicTimeline | null = null
  private playing: CinematicDef | null = null
  private waiters: Array<() => void> = []
  private freezeLeft = 0
  private slowScale = 1
  private slowLeft = 0
  private recoverMs = 0
  private recoverFrom = 1
  private commitDone = false
  private enter!: Phaser.Input.Keyboard.Key
  private dialogueAdvance!: DialogueAdvance
  private padSkipPrev = false
  private sawDialogue = false

  constructor(scene: Phaser.Scene, host: CinematicHost) {
    this.scene = scene
    this.host = host
    this.camera = new CinematicCamera(scene)
    this.dialogue = new CinematicDialogue(scene)
    this.fx = new CinematicEffects(scene)
    this.audio = new CinematicAudio()
    registerCinematics(this.registry)
    const kb = scene.input.keyboard
    this.enter = kb?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER) ?? ({ isDown: false } as Phaser.Input.Keyboard.Key)
    this.dialogueAdvance = new DialogueAdvance(scene)
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.abort())
  }

  get busy(): boolean {
    return this.state.busy
  }

  get phase(): CinematicPhase {
    return this.state.phase
  }

  player(): Fighter {
    return this.host.getPlayer()
  }

  cpu(): Fighter {
    return this.host.getCpu()
  }

  fighter(id: FighterIdValue): Fighter | null {
    const p = this.host.getPlayer()
    const c = this.host.getCpu()
    if (p.def.id === id) {
      return p
    }
    if (c.def.id === id) {
      return c
    }
    return null
  }

  freezeFrame(ms: number): void {
    this.freezeLeft = Math.max(this.freezeLeft, ms)
  }

  ensureGameplay(): void {
    if (this.state.busy) {
      return
    }
    this.scene.tweens.timeScale = 1
    this.scene.anims.globalTimeScale = 1
    if (this.scene.physics.world.isPaused && !session.paused) {
      this.scene.physics.world.resume()
    }
  }

  slowMotion(scale: number, durationMs: number): void {
    if (scale >= 0.99) {
      this.recoverFrom = this.slowScale
      this.recoverMs = Math.max(16, durationMs)
      this.slowLeft = 0
      return
    }
    this.slowScale = Phaser.Math.Clamp(scale, 0.05, 1)
    this.slowLeft = durationMs
    this.recoverMs = 0
    this.applyTimeScale(this.slowScale)
  }

  letterbox(on: boolean, duration?: number): void {
    this.fx.letterbox(on, duration)
    this.fx.setSkipHint(this.timeline?.skippable !== false)
  }

  fireUltimate(who: 'player' | 'cpu' = 'player'): void {
    this.host.fireUltimate(who)
    this.commitDone = true
  }

  checkInteraction(a: string, b: string): string | null {
    return this.registry.findInteraction(a, b)
  }

  play(id: string, partial?: Partial<CinematicContext>): Promise<void> {
    if (this.busy) {
      this.finish(true)
    }
    const ctx: CinematicContext = {
      playerTeam: this.host.playerTeam(),
      cpuTeam: this.host.cpuTeam(),
      attacker: this.host.getPlayer(),
      target: this.host.getCpu(),
      ...partial,
    }
    this.ctx = ctx
    const built = this.registry.build(id, ctx)
    if (!built) {
      return Promise.resolve()
    }
    return new Promise((resolve) => {
      this.waiters.push(resolve)
      this.begin(built)
    })
  }

  skip(): void {
    if (!this.busy || this.timeline?.skippable === false) {
      return
    }
    this.finish(true)
  }

  tick(realDt: number): void {
    if (!this.busy) {
      if (this.dialogue.visible) {
        this.dialogue.tick(realDt)
      }
      return
    }
    if (!this.timeline) {
      this.finish(true)
      return
    }
    this.pollSkip()
    if (!this.busy || !this.timeline) {
      return
    }
    this.dialogue.tick(realDt)
    if (this.dialogue.visible) {
      this.sawDialogue = true
    }
    this.timeline.wallMs += realDt
    if (this.timeline.wallMs > this.timeline.def.duration + 4000) {
      this.finish(true)
      return
    }
    if (this.freezeLeft > 0) {
      this.freezeLeft -= realDt
      if (this.freezeLeft <= 0) {
        this.freezeLeft = 0
        this.applyTimeScale(this.slowScale)
      }
      return
    }
    const simDt = this.advanceTime(realDt)
    let done = false
    try {
      done = this.timeline.tick(simDt, this)
    } catch (error) {
      console.error('[cinematic] step failed', error)
      this.finish(true)
      return
    }
    if (done) {
      this.finish(false)
    }
  }

  abort(): void {
    if (!this.busy) {
      return
    }
    this.commitDone = true
    this.cleanup()
    this.flush()
  }

  private begin(def: CinematicDef): void {
    this.playing = def
    this.timeline = new CinematicTimeline(def)
    this.commitDone = false
    this.freezeLeft = 0
    this.slowScale = 1
    this.slowLeft = 0
    this.recoverMs = 0
    this.state.phase = 'start'
    this.state.flowBefore = session.flow
    session.flow = GameFlow.CINEMATIC
    this.camera.capture()
    this.enter.reset()
    this.padSkipPrev = true
    this.sawDialogue = false
    if (!this.scene.physics.world.isPaused) {
      this.scene.physics.world.pause()
      this.state.physicsPaused = true
    }
    this.host.getPlayer().applyInput(emptyActions(), () => undefined)
    this.host.getCpu().applyInput(emptyActions(), () => undefined)
    this.state.phase = 'running'
  }

  private finish(skipped: boolean): void {
    if (this.state.phase === 'idle' && !this.playing) {
      return
    }
    const def = this.playing
    const ctx = this.ctx
    this.state.phase = 'end'
    try {
      this.applyCommit(def, ctx, skipped)
    } catch (error) {
      console.error('[cinematic] commit failed', error)
    }
    this.cleanup()
    this.flush()
  }

  private cleanup(): void {
    this.freezeLeft = 0
    this.slowScale = 1
    this.slowLeft = 0
    this.recoverMs = 0
    this.scene.tweens.timeScale = 1
    this.scene.anims.globalTimeScale = 1
    try {
      this.dialogue.hide()
      this.fx.clear()
      this.audio.restore()
      this.camera.restoreImmediate()
    } catch (error) {
      console.error('[cinematic] cleanup failed', error)
    }
    if (!session.paused && this.scene.physics.world.isPaused) {
      this.scene.physics.world.resume()
    }
    this.state.physicsPaused = false
    if (session.flow === GameFlow.CINEMATIC) {
      const prev = this.state.flowBefore
      session.flow = prev === GameFlow.CINEMATIC ? GameFlow.FIGHT : prev
    }
    this.timeline = null
    this.playing = null
    this.state.phase = 'idle'
  }

  private applyCommit(def: CinematicDef | null, ctx: CinematicContext, _skipped: boolean): void {
    if (this.commitDone || !def?.commit) {
      return
    }
    const who = ctx.attacker && ctx.attacker === this.host.getCpu() ? 'cpu' : 'player'
    if (def.commit === 'ultimate') {
      this.host.fireUltimate(who)
    } else if (def.commit === 'transform') {
      this.host.applyTransform(who)
    }
    this.commitDone = true
  }

  private flush(): void {
    const pending = this.waiters.splice(0)
    for (const resolve of pending) {
      resolve()
    }
  }

  private advanceTime(realDt: number): number {
    if (this.slowLeft > 0) {
      this.slowLeft -= realDt
      this.applyTimeScale(this.slowScale)
      if (this.slowLeft <= 0) {
        this.recoverFrom = this.slowScale
        this.recoverMs = 220
      }
      return realDt * this.slowScale
    }
    if (this.recoverMs > 0) {
      const t = Math.min(1, realDt / this.recoverMs)
      this.slowScale = Phaser.Math.Linear(this.recoverFrom, 1, t)
      this.recoverMs -= realDt
      if (this.recoverMs <= 0 || this.slowScale >= 0.99) {
        this.slowScale = 1
        this.recoverMs = 0
      }
      this.applyTimeScale(this.slowScale)
      return realDt * this.slowScale
    }
    this.applyTimeScale(1)
    return realDt
  }

  private applyTimeScale(scale: number): void {
    this.scene.tweens.timeScale = scale
    this.scene.anims.globalTimeScale = scale
  }

  private pollSkip(): void {
    if (this.timeline?.skippable === false) {
      return
    }
    if (this.timeline && !this.sawDialogue && this.timeline.wallMs < 800) {
      this.dialogueAdvance.clear()
      this.padSkipPrev = Boolean(navigator.getGamepads?.()[0]?.buttons[8]?.value)
      return
    }
    const keySkip = this.dialogueAdvance.consume()
    const pad = navigator.getGamepads?.()[0]
    const padDown = Boolean(pad && ((pad.buttons[8]?.value ?? 0) > 0.45))
    const padEdge = padDown && !this.padSkipPrev
    this.padSkipPrev = padDown
    if (this.dialogue.visible) {
      if (keySkip || padEdge) {
        this.dialogue.advanceBubble()
      }
      return
    }
    if (keySkip || padEdge) {
      this.skip()
    }
  }
}
