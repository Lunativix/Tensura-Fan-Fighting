import Phaser from 'phaser'
import { FighterBrain } from '../ai/FighterBrain.ts'
import { CHARACTERS } from '../config/characters.ts'
import { kitFor } from '../config/skills.ts'
import { AttackKind } from '../combat/Attack.ts'
import { Fighter, isPlayableId } from '../characters/Fighter.ts'
import { CombatSystem } from '../combat/CombatSystem.ts'
import { ProjectilePool } from '../combat/Projectile.ts'
import { TeamBench } from '../game/TeamBench.ts'
import { playAssist, playEmergency, playSwitchIn, playSwitchOut } from '../vfx/TeamFx.ts'
import { spawnCharge } from '../effects/EnergyEffect.ts'
import { clampDelta } from '../engine/GameLoop.ts'
import { createArena } from '../game/Arena.ts'
import { GameFlow, FighterId, MatchMode, type GameFlowId, type FighterIdValue } from '../types/game.ts'
import { PlayMode, session } from '../game/GameState.ts'
import { loadoutsForTeam, versusFighterOpts } from '../combat/variants/index.ts'
import { HitStop } from '../combat/HitStop.ts'
import { PRESET_PLAYER2 } from '../input/bindings.ts'
import type { FighterActions } from '../input/Actions.ts'
import { vfxEngine } from '../vfx/VfxEngine.ts'
import { CombatSpectacle } from '../vfx/CombatSpectacle.ts'
import { FxLayer } from '../vfx/FxLayers.ts'
import { adaptiveMusic } from '../audio/AdaptiveMusic.ts'
import { musicManager, battleTypeFrom } from '../audio/music/MusicManager.ts'
import { MusicEvent, MusicRole } from '../audio/music/types.ts'
import { CinematicManager } from '../cinematics/CinematicManager.ts'
import { SceneKeys } from '../game/SceneKeys.ts'
import { InputManager } from '../input/InputManager.ts'
import { audio } from '../audio/AudioManager.ts'
import { combatSfx } from '../audio/CombatSfx.ts'
import { FightHUD } from '../ui/FightHUD.ts'
import { MenuButton } from '../ui/MenuButton.ts'
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../engine/Time.ts'
import { FighterState } from '../combat/FighterState.ts'
import { createSpriteAnims } from '../sprites/SpriteLoader.ts'
import { saveManager } from '../save/SaveManager.ts'
import { equippedTint } from '../live/collection.ts'
import { attackPhase, enteredPhase } from '../combat/feel/FrameEvents.ts'
import { isFinisherHit, finisherTheme } from '../combat/feel/FinisherDirector.ts'
import { playTransformFeel } from '../combat/feel/TransformFeel.ts'
import { AnimationVariationManager } from '../combat/feel/AnimationVariationManager.ts'
import { characterDisplayName, normalsOf, skillAnimOf } from '../combat/anim/registry.ts'
import { skillDebugLines, vfxHooksOf } from '../combat/anim/pipeline.ts'
import { timingFromAttack } from '../combat/anim/timing.ts'
import { formatSkillTimeline, skillUsesProjectile } from '../combat/anim/timeline.ts'
import { sfxHookFlag, vfxHookFlag } from '../combat/anim/hookStatus.ts'

interface PowerFxTracker {
  wasUltimate: boolean
  wasTransformed: boolean
  wasLowHp: boolean
  wasSkill: boolean
  chargeAura: Phaser.GameObjects.Sprite | null
  lowHpAura: Phaser.GameObjects.Sprite | null
}

function newPowerFxTracker(): PowerFxTracker {
  return {
    wasUltimate: false,
    wasTransformed: false,
    wasLowHp: false,
    wasSkill: false,
    chargeAura: null,
    lowHpAura: null,
  }
}

export class FightScene extends Phaser.Scene {
  private player!: Fighter
  private cpu!: Fighter
  private inputPad!: InputManager
  private ai = new FighterBrain()
  private combat = new CombatSystem()
  private projectiles!: ProjectilePool
  private hud!: FightHUD
  private ended = false
  private pausedText!: Phaser.GameObjects.Text
  private debugGfx!: Phaser.GameObjects.Graphics
  private skipFrames = 0
  private clock = 99
  private p2Pad: InputManager | null = null
  private hitStop = new HitStop()
  private pauseResume!: MenuButton
  private pauseMenu!: MenuButton
  private playerFx = newPowerFxTracker()
  private cpuFx = newPowerFxTracker()
  private victoryFxDone = false
  private floor!: Phaser.GameObjects.Rectangle
  private playerTeam!: TeamBench
  private cpuTeam!: TeamBench
  private finisherHold = 0
  private cinematics!: CinematicManager
  private spectacle!: CombatSpectacle

  constructor() {
    super(SceneKeys.Fight)
  }

  create(): void {
    session.flow = GameFlow.FIGHT
    session.paused = false
    session.framePause = false
    this.ended = false
    this.finisherHold = 0
    this.playerFx = newPowerFxTracker()
    this.cpuFx = newPowerFxTracker()
    this.victoryFxDone = false
    this.combat.combo.reset()
    audio.unlock()

    const stage = createArena(this)
    combatSfx.setEnvironment(stage.id)
    this.physics.world.setBounds(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT)
    this.cameras.main.setBounds(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT)

    this.floor = this.add.rectangle(960, 970, 1920, 100, 0x16324a, 0)
    this.physics.add.existing(this.floor, true)
    createSpriteAnims(this)

    const pId = isPlayableId(session.playerFighter) ? session.playerFighter : FighterId.rimuru
    const cId = isPlayableId(session.cpuFighter) ? session.cpuFighter : FighterId.milim
    const playerIds = session.playerTeam.length >= 2 ? session.playerTeam : [pId]
    const cpuIds = session.cpuTeam.length >= 2 ? session.cpuTeam : [cId]
    const story = saveManager.load()
    const resolveOpts = {
      mode: session.variantMode,
      chronologyMissionId: session.chronologyMissionId,
      story: story.story,
      collectionAppearances: story.collection.appearances,
    }
    session.playerLoadouts = loadoutsForTeam(playerIds, session.playerLoadouts, resolveOpts)
    session.cpuLoadouts = loadoutsForTeam(cpuIds, session.cpuLoadouts, resolveOpts)
    this.playerTeam = new TeamBench(playerIds, undefined, session.playerLoadouts)
    this.cpuTeam = new TeamBench(cpuIds, undefined, session.cpuLoadouts)
    this.player = new Fighter(this, 420, 700, CHARACTERS[this.playerTeam.current], 1, versusFighterOpts(this.playerTeam.currentLoadout))
    this.cpu = new Fighter(this, 1500, 700, CHARACTERS[this.cpuTeam.current], -1, versusFighterOpts(this.cpuTeam.currentLoadout))
    this.applyVersusCosmetics()
    if (session.playMode === PlayMode.SURVIVAL && session.survivalRound > 1) {
      this.player.hp = Math.max(120, Math.min(this.player.def.maxHp, session.survivalHp))
    }
    this.clock = 99
    this.physics.add.collider(this.player, this.floor)
    this.physics.add.collider(this.cpu, this.floor)

    this.add.text(960, 108, stage.name, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '16px',
      color: '#9ec4e8',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(52)

    this.projectiles = new ProjectilePool(this)
    this.inputPad = new InputManager()
    this.p2Pad = session.matchMode === MatchMode.PVP ? new InputManager({ map: PRESET_PLAYER2, padIndex: 1 }) : null
    musicManager.playContext({
      role: MusicRole.BATTLE,
      playerCharacter: this.playerTeam.current,
      team: this.playerTeam.slots,
      enemy: this.cpuTeam.current,
      battleType: battleTypeFrom(this.cpuTeam.current, session.ranked, session.trainingMode),
      stageId: stage.id,
      location: stage.id,
      intensity: 2,
    }, true)
    this.hud = new FightHUD(this, this.player, this.cpu, this.playerTeam, this.cpuTeam)
    this.debugGfx = this.add.graphics().setDepth(30)

    this.add.text(960, 500, `${this.player.def.name.toUpperCase()}  VS  ${this.cpu.def.name.toUpperCase()}`, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '36px',
      color: '#eaf6ff',
    }).setOrigin(0.5).setDepth(40).setVisible(false)

    const extra = session.trainingMode ? '\nF5 reset  F7 frame pause  F8 step\nF1 intro  F2 ult  F6 form  F9 talk  F10 win' : ''
    this.pausedText = this.add.text(960, 540, `PAUSED\nEsc resume   R restart   M menu${extra}`, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '28px',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(80).setVisible(false)

    this.add.text(960, 1020, session.trainingMode
      ? 'Q switch   E assist   F4 boxes  F5 reset  F7 pause-frame  F8 step'
      : 'Q changement   E assist', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '18px',
      color: '#8fb4d9',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(52)

    this.pauseResume = new MenuButton(this, 960, 640, 'RESUME', () => this.setPaused(false))
    this.pauseMenu = new MenuButton(this, 960, 720, 'MENU', () => {
      session.trainingMode = false
      session.infiniteResources = false
      session.paused = false
      this.physics.world.resume()
      this.scene.start(SceneKeys.Hub)
    })
    this.pauseResume.container.setScrollFactor(0).setDepth(90).setVisible(false)
    this.pauseMenu.container.setScrollFactor(0).setDepth(90).setVisible(false)
    this.input.keyboard?.on('keydown-F5', (event: KeyboardEvent) => {
      if (event.shiftKey) {
        return
      }
      this.resetPositions()
    })
    this.input.keyboard?.on('keydown-F7', (event: KeyboardEvent) => {
      if (event.shiftKey) {
        return
      }
      session.framePause = !session.framePause
    })
    this.input.keyboard?.on('keydown-F8', (event: KeyboardEvent) => {
      if (event.shiftKey) {
        return
      }
      this.skipFrames = 1
    })
    this.input.keyboard?.on('keydown-Q', () => this.requestSwitch())
    this.input.keyboard?.on('keydown-E', () => this.requestAssist())

    this.cinematics = new CinematicManager(this, {
      scene: this,
      getPlayer: () => this.player,
      getCpu: () => this.cpu,
      playerTeam: () => this.playerTeam.slots,
      cpuTeam: () => this.cpuTeam.slots,
      fireUltimate: (who) => this.commitUltimate(who),
      applyTransform: (who) => {
        const fighter = who === 'player' ? this.player : this.cpu
        fighter.applyTransformBurst()
      },
    })
    this.bindCinematicDebug()
    this.spectacle = new CombatSpectacle(this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.clearPowerFx(this.playerFx)
      this.clearPowerFx(this.cpuFx)
      this.spectacle.destroy()
      session.combatFeel = null
    })
    void this.cinematics.play(
      AnimationVariationManager.intro(
        this.player.def.id,
        this.cpu.def.id,
        this.cinematics.checkInteraction(this.player.def.id, this.cpu.def.id),
      ),
      {
        attacker: this.player,
        target: this.cpu,
        attackerId: this.player.def.id,
        targetId: this.cpu.def.id,
      },
    )
  }

  update(_time: number, delta: number): void {
    const dt = clampDelta(delta)
    if (this.cinematics.busy) {
      if (this.inputPad.justRestart()) {
        this.scene.restart()
        return
      }
      this.cinematics.tick(dt)
      this.spectacle.tick(dt)
      this.hud.update(this.player, this.cpu, this.combat.combo.hits, this.clock, session.round)
      this.drawDebug()
      return
    }
    this.cinematics.ensureGameplay()
    this.cinematics.tick(dt)
    if (this.hitStop.frozen) {
      this.physics.world.pause()
    }
    if (this.inputPad.justPause()) {
      this.setPaused(!session.paused)
    }
    if (this.inputPad.justRestart()) {
      this.scene.restart()
      return
    }
    if (session.paused || this.ended) {
      this.drawDebug()
      return
    }
    if (session.framePause && this.skipFrames <= 0) {
      this.drawDebug()
      return
    }
    if (this.skipFrames > 0) {
      this.skipFrames -= 1
    }
    if (this.hitStop.tick(dt)) {
      this.physics.world.pause()
      this.hud.update(this.player, this.cpu, this.combat.combo.hits, this.clock, session.round)
      this.syncCombatFeel()
      this.drawDebug()
      return
    }
    if (!session.paused && this.physics.world.isPaused) {
      this.physics.world.resume()
    }

    this.player.lookAt(this.cpu.x)
    this.cpu.lookAt(this.player.x)
    if (this.player.state === FighterState.ULTIMATE && this.player.attack && !this.player.ultimateConfirmed) {
      this.player.aimLockX = this.cpu.x
    }
    if (this.cpu.state === FighterState.ULTIMATE && this.cpu.attack && !this.cpu.ultimateConfirmed) {
      this.cpu.aimLockX = this.player.x
    }

    const playerActions = this.inputPad.read()
    const cpuActions = this.p2Pad ? this.p2Pad.read() : this.ai.think(this.cpu, this.player, dt)
    this.interceptUltimate(playerActions)
    if (this.cinematics.busy) {
      this.cinematics.tick(dt)
      this.spectacle.tick(dt)
      this.hud.update(this.player, this.cpu, this.combat.combo.hits, this.clock, session.round)
      this.drawDebug()
      return
    }
    this.player.applyInput(playerActions, (attack) => {
      this.projectiles.spawn(this.player, attack, this.player.aimLockX ?? this.cpu.x)
    })
    this.cpu.applyInput(cpuActions, (attack) => {
      this.projectiles.spawn(this.cpu, attack, this.cpu.aimLockX ?? this.player.x)
    })

    this.playerTeam.tick(dt)
    this.player.tick(dt)
    this.cpu.tick(dt)
    if (session.infiniteResources) {
      this.player.energy = this.player.def.maxEnergy
      this.player.ultimate = 100
      this.cpu.energy = this.cpu.def.maxEnergy
    }
    for (const shot of this.projectiles.active()) {
      shot.tick(dt)
      this.spectacle.traceProjectile(shot, dt)
      combatSfx.projectileTravel(shot)
      if (shot.consumeEdgeFx()) {
        this.spectacle.onProjectileEdge(shot)
      }
    }
    this.combat.combo.update(dt)
    this.combat.update(this.player, this.cpu, this.projectiles)

    this.consumeMotion(this.player)
    this.consumeMotion(this.cpu)
    this.playSkillCues(this.player)
    this.playSkillCues(this.cpu)
    this.tickAttackFeel(this.player)
    this.tickAttackFeel(this.cpu)
    this.consumeAudio(this.player)
    this.consumeAudio(this.cpu)
    combatSfx.tickEnvironment()
    this.updatePowerFx(this.player, this.playerFx)
    this.updatePowerFx(this.cpu, this.cpuFx)
    this.spectacle.syncAura(this.player)
    this.spectacle.syncAura(this.cpu)
    this.spectacle.tick(dt)
    this.spectacle.chargeDim(
      this.isCharging(this.player) || this.isCharging(this.cpu),
    )

    const vx = (this.player.body.velocity.x + this.cpu.body.velocity.x) * 0.5
    if (this.combat.lastClash > 0) {
      combatSfx.clash(this.combat.lastClash, this.combat.lastClash >= 280, (this.player.x + this.cpu.x) * 0.5)
    }
    if (this.combat.lastImpact.power > 0) {
      const hit = this.combat.lastImpact
      combatSfx.impact({
        fighterId: hit.attackerId as FighterIdValue,
        attackId: hit.attackId,
        kind: hit.kind,
        slot: hit.slot,
        power: hit.power,
        combo: this.combat.combo.hits,
        blocked: hit.blocked,
        perfect: hit.perfect,
        armored: hit.armored,
        counter: hit.counter,
        airborne: hit.airborne,
        grounded: !hit.airborne,
        killing: hit.killing,
        launcher: hit.launcher,
        knockdown: hit.knockdown,
        flash: hit.flash,
        x: hit.x,
        y: hit.y,
      })
      const feel = this.spectacle.onImpact({
        x: this.combat.lastImpact.x,
        y: this.combat.lastImpact.y,
        power: this.combat.lastImpact.power,
        flash: this.combat.lastImpact.flash,
        perfect: this.combat.lastImpact.perfect,
        blocked: this.combat.lastImpact.blocked,
        facing: this.combat.lastImpact.facing,
        combo: this.combat.combo.hits,
        attackerId: this.combat.lastImpact.attackerId,
      })
      this.hitStop.apply(feel.hitStop)
      if (feel.hitStop > 0) {
        this.physics.world.pause()
      }
      const attacker = hit.attackerId === this.player.def.id ? this.player : this.cpu
      const defender = attacker === this.player ? this.cpu : this.player
      if (isFinisherHit({
        kind: hit.kind,
        power: hit.power,
        killing: hit.killing,
        attackerId: hit.attackerId,
      }, defender.hp / defender.def.maxHp)) {
        this.spectacle.onFinisher(attacker, defender)
        this.finisherHold = Math.max(this.finisherHold, 520)
      }
    }
    this.spectacle.follow(this.cameras.main, this.player, this.cpu, vx)

    if (this.finisherHold > 0) {
      this.finisherHold -= dt
    }

    this.clock -= dt / 1000
    adaptiveMusic.setCombat(this.player.hp / this.player.def.maxHp, this.cpu.hp / this.cpu.def.maxHp, this.combat.combo.hits)
    this.hud.update(this.player, this.cpu, this.combat.combo.hits, this.clock, session.round)
    this.syncCombatFeel()
    this.drawDebug()
    if (this.clock <= 0 && !this.ended) {
      void this.finishMatch(this.player.hp >= this.cpu.hp ? GameFlow.VICTORY : GameFlow.DEFEAT)
      return
    }
    this.checkEnd()
  }

  private requestSwitch(): void {
    if (session.paused || this.ended || this.cinematics.busy || !this.player.alive) {
      return
    }
    if (this.player.ultimateConfirmed) {
      return
    }
    const lowHp = this.player.hp / this.player.def.maxHp < 0.25
    if (this.player.hitstun > 0 && !lowHp) {
      return
    }
    const next = this.playerTeam.trySwitch()
    if (!next) {
      return
    }
    const x = this.player.x
    const y = this.player.y
    if (lowHp) {
      playEmergency(this, x, y)
    } else {
      playSwitchOut(this, x, y)
    }
    this.player.destroy()
    this.clearPowerFx(this.playerFx)
    this.player = new Fighter(this, x, y, CHARACTERS[next], 1, versusFighterOpts(this.playerTeam.currentLoadout))
    this.applyVersusCosmetics()
    this.physics.add.collider(this.player, this.floor)
    if (lowHp) {
      this.player.invuln = 480
    }
    playSwitchIn(this, x, y)
    this.spectacle.onSwitch(x, y, next)
    this.player.playOneShot('switch_in')
    this.playerFx = newPowerFxTracker()
    combatSfx.switch(lowHp ? 'ko' : this.combat.combo.hits > 2 ? 'combo' : 'normal', x)
    musicManager.event(MusicEvent.CharacterSwitch, { playerCharacter: next })
  }

  private clearPowerFx(fx: PowerFxTracker): void {
    fx.chargeAura?.destroy()
    fx.lowHpAura?.destroy()
    fx.chargeAura = null
    fx.lowHpAura = null
  }

  private requestAssist(): void {
    if (session.paused || this.ended || this.cinematics.busy || !this.player.alive) {
      return
    }
    const ally = this.playerTeam.tryAssist()
    if (!ally) {
      return
    }
    const x = this.player.x + this.player.facing * 120
    const y = this.player.y
    playAssist(this, x, y)
    const skill = kitFor(ally).skills[0]
    if (skill && (skill.kind === AttackKind.PROJECTILE || skill.kind === AttackKind.BEAM || skill.projectileSpeed)) {
      this.projectiles.spawn(this.player, skill, this.cpu.x)
    }
    combatSfx.switch('assist', x)
  }

  private updatePowerFx(fighter: Fighter, fx: PowerFxTracker): void {
    const centerY = fighter.y - 60

    const isUltimate = fighter.state === FighterState.ULTIMATE
    if (isUltimate && !fx.wasUltimate) {
      vfxEngine.playSheet(this, 'ULTIMATE_FLASH', fighter.x, centerY)
    }
    fx.wasUltimate = isUltimate

    const isTransformed = fighter.transform.active
    if (isTransformed && !fx.wasTransformed) {
      playTransformFeel(this, this.spectacle, fighter)
    }
    fx.wasTransformed = isTransformed

    const isSkill = fighter.state === FighterState.SKILL
    if (isSkill && !fx.wasSkill) {
      const sparks = spawnCharge(this, fighter.x, centerY, fighter.def.accent)
      this.time.delayedCall(480, () => sparks.destroy())
      vfxEngine.play(this, 'CHARGE', fighter.x, centerY)
    }
    fx.wasSkill = isSkill

    const charging = fighter.alive && this.isCharging(fighter)
    if (charging) {
      if (!fx.chargeAura || !fx.chargeAura.active) {
        fx.chargeAura = vfxEngine.playSheet(this, 'CHARGE_AURA', fighter.x, centerY, {
          depth: FxLayer.AURA,
          tint: fighter.def.accent,
          persist: true,
        })
      }
      fx.chargeAura?.setPosition(fighter.x, centerY)
    } else if (fx.chargeAura) {
      fx.chargeAura.destroy()
      fx.chargeAura = null
    }

    const lowHp = fighter.alive && fighter.hp / fighter.def.maxHp < 0.25
    if (lowHp && !fx.wasLowHp) {
      vfxEngine.playSheet(this, 'RAGE', fighter.x, centerY)
    }
    fx.wasLowHp = lowHp
    if (lowHp) {
      if (!fx.lowHpAura || !fx.lowHpAura.active) {
        fx.lowHpAura = vfxEngine.playSheet(this, 'LOW_HP', fighter.x, centerY, { depth: FxLayer.AURA, persist: true })
      }
      fx.lowHpAura?.setPosition(fighter.x, centerY)
    } else if (fx.lowHpAura) {
      fx.lowHpAura.destroy()
      fx.lowHpAura = null
    }
  }

  private playVictoryFx(): void {
    if (this.victoryFxDone) {
      return
    }
    this.victoryFxDone = true
    const winner = this.player.alive || this.player.hp >= this.cpu.hp ? this.player : this.cpu
    vfxEngine.playSheet(this, 'VICTORY_AURA', winner.x, winner.y - 60, { depth: FxLayer.AURA, persist: true })
  }

  private setPaused(value: boolean): void {
    session.paused = value
    session.flow = value ? GameFlow.PAUSED : GameFlow.FIGHT
    this.pausedText.setVisible(value)
    this.pauseResume.container.setVisible(value)
    this.pauseMenu.container.setVisible(value)
    this.pauseResume.setSelected(true)
    this.pauseMenu.setSelected(false)
    if (value) {
      this.physics.world.pause()
    } else {
      this.physics.world.resume()
    }
  }

  private resetPositions(): void {
    this.player.setPosition(420, 700)
    this.cpu.setPosition(1500, 700)
    this.player.refill()
    this.cpu.refill()
    this.projectiles.clear()
    this.combat.combo.reset()
    this.ended = false
  }

  private drawDebug(): void {
    this.debugGfx.clear()
    const showBoxes = session.showHitboxes
    const showProjectiles = session.showHitboxes || session.debugProjectiles
    if (!showBoxes && !showProjectiles) {
      return
    }
    if (showBoxes) {
      this.strokeBox(this.player.hurtbox(), 0x69f0ae)
      this.strokeBox(this.cpu.hurtbox(), 0x69f0ae)
      const pHit = this.player.currentHitbox()
      const cHit = this.cpu.currentHitbox()
      if (pHit) {
        this.strokeBox(pHit, 0xff5252)
      }
      if (cHit) {
        this.strokeBox(cHit, 0xff5252)
      }
    }
    if (showProjectiles) {
      for (const shot of this.projectiles.active()) {
        this.strokeBox(shot.getHitbox(), 0xffab40)
      }
    }
  }

  private strokeBox(box: { x: number; y: number; width: number; height: number }, color: number): void {
    this.debugGfx.lineStyle(2, color, 0.9)
    this.debugGfx.strokeRect(box.x, box.y, box.width, box.height)
  }

  private consumeMotion(fighter: Fighter): void {
    const event = fighter.motionEvent
    fighter.motionEvent = null
    if (event === 'dash') {
      this.spectacle.onDash(fighter)
    } else if (event === 'attack') {
      this.spectacle.onAttackStart(fighter)
    } else if (event === 'knock') {
      this.spectacle.onKnock(fighter)
    } else if (event === 'land') {
      this.spectacle.onLand(fighter)
    }
  }

  private playSkillCues(fighter: Fighter): void {
    for (const cue of fighter.drainSkillCues()) {
      this.spectacle.onSkillCue(fighter, cue)
    }
  }

  private tickAttackFeel(fighter: Fighter): void {
    const attack = fighter.attack
    if (!attack) {
      fighter.prevAttackFrame = -1
      return
    }
    if (enteredPhase(fighter.prevAttackFrame, attack, 'active')) {
      this.spectacle.onAttackActive(fighter)
    }
    fighter.prevAttackFrame = attack.frame
  }

  private syncCombatFeel(): void {
    session.combatFeel = {
      pState: this.player.state,
      cState: this.cpu.state,
      pPhase: this.player.attack ? attackPhase(this.player.attack) : '—',
      cPhase: this.cpu.attack ? attackPhase(this.cpu.attack) : '—',
      hitStopMs: this.hitStop.remaining,
      finisher: finisherTheme(this.player.def.id, this.cpu.def.id),
      pSkill: this.skillFeelLines(this.player),
      cSkill: this.skillFeelLines(this.cpu),
      projectiles: this.projectiles.active().length,
    }
  }

  private skillFeelLines(fighter: Fighter): string[] {
    const attack = fighter.attack
    if (!attack) {
      return []
    }
    const res = fighter.skillAnim.resolutionNow
    if (res) {
      const def = skillAnimOf(fighter.def.id, res.attackId)
      const vfx = def ? vfxHooksOf(attack.data, def) : { release: attack.data.vfx }
      const timeline = formatSkillTimeline(res.timing, { projectile: skillUsesProjectile(attack.data) })
      return [
        ...skillDebugLines({
          characterName: res.characterName,
          form: res.form,
          skillName: res.skillName,
          animId: res.animId,
          artStatus: res.artStatus,
          frame: attack.frame,
          timing: res.timing,
          hitboxes: session.showHitboxes,
          tag: res.source === 'missing' ? '[MISSING]' : '[OWN]',
          totalFrames: res.durationFrames,
          vfx: `VFX ${vfxHookFlag(vfx.release)}`,
          sfx: sfxHookFlag(fighter.def.id, res.slot),
          camera: fighter.ultimateConfirmed ? 'CAMERA lock-on' : 'CAMERA hooks',
          sourceTag: fighter.ultimateConfirmed ? 'ULT CONFIRMED' : '',
        }),
        timeline,
      ]
    }
    const normals = normalsOf(fighter.def.id)
    return skillDebugLines({
      characterName: characterDisplayName(fighter.def.id),
      form: fighter.animForm,
      skillName: attack.data.name,
      animId: attack.data.id,
      artStatus: null,
      frame: attack.frame,
      timing: timingFromAttack(attack.data),
      hitboxes: session.showHitboxes,
      tag: normals.source === 'own' ? '[OWN]' : '[FALLBACK]',
      sourceTag: normals.source === 'own' ? 'OWN' : 'FALLBACK',
    })
  }

  private consumeAudio(fighter: Fighter): void {
    for (const cue of fighter.drainAudio()) {
      combatSfx.cue(fighter, cue)
    }
    combatSfx.footstep(fighter)
  }

  private isCharging(fighter: Fighter): boolean {
    const attack = fighter.attack
    if (!attack) {
      return false
    }
    const heavy = fighter.state === FighterState.SKILL || fighter.state === FighterState.ULTIMATE || fighter.state === FighterState.TRANSFORM
    return heavy && attack.frame < attack.data.startup
  }

  private interceptUltimate(playerActions: FighterActions): void {
    if (playerActions.ultimate && this.player.ultimate >= 100) {
      playerActions.ultimate = false
      const id = this.player.def.cinematicUltimate ?? `ultimate_${this.player.def.id}`
      void this.cinematics.play(id, {
        attacker: this.player,
        target: this.cpu,
        attackerId: this.player.def.id,
        targetId: this.cpu.def.id,
      })
    }
  }

  private commitUltimate(who: 'player' | 'cpu'): void {
    const fighter = who === 'player' ? this.player : this.cpu
    fighter.triggerUltimate()
  }

  private bindCinematicDebug(): void {
    const kb = this.input.keyboard
    kb?.addCapture(['F1', 'F2', 'F6', 'F9', 'F10'])
    kb?.on('keydown-F1', () => {
      void this.cinematics.play('battle_intro')
    })
    kb?.on('keydown-F2', () => {
      this.player.ultimate = 100
      const id = this.player.def.cinematicUltimate ?? `ultimate_${this.player.def.id}`
      void this.cinematics.play(id, {
        attacker: this.player,
        target: this.cpu,
        attackerId: this.player.def.id,
        targetId: this.cpu.def.id,
      })
    })
    kb?.on('keydown-F6', (event: KeyboardEvent) => {
      if (event.shiftKey) {
        return
      }
      void this.cinematics.play(`transform_${this.player.def.id}`, { attacker: this.player, attackerId: this.player.def.id })
    })
    kb?.on('keydown-F9', () => {
      const id = this.cinematics.checkInteraction(this.player.def.id, this.cpu.def.id) ?? 'interaction'
      void this.cinematics.play(id, {
        attacker: this.player,
        target: this.cpu,
        attackerId: this.player.def.id,
        targetId: this.cpu.def.id,
      })
    })
    kb?.on('keydown-F10', () => {
      const winner = this.player.alive || this.player.hp >= this.cpu.hp ? this.player : this.cpu
      void this.cinematics.play('victory', { winner })
    })
  }

  private async finishMatch(flow: GameFlowId): Promise<void> {
    if (this.ended) {
      return
    }
    this.ended = true
    session.flow = flow
    session.survivalHp = this.player.hp
    this.playVictoryFx()
    const winner = this.player.alive || this.player.hp >= this.cpu.hp ? this.player : this.cpu
    if (flow === GameFlow.VICTORY) {
      combatSfx.victory()
      musicManager.event(MusicEvent.Victory, {
        battleType: battleTypeFrom(this.cpuTeam.current, session.ranked, session.trainingMode),
      })
    } else {
      combatSfx.defeat()
      musicManager.event(MusicEvent.Defeat)
    }
    await this.cinematics.play('victory', { winner })
    if (this.sys.isActive()) {
      this.scene.start(SceneKeys.Result)
    }
  }

  private applyVersusCosmetics(): void {
    if (session.playMode === PlayMode.STORY) {
      return
    }
    const data = saveManager.load()
    const tint = equippedTint(data, this.player.def.id)
    if (tint) {
      this.player.cosmeticTint(tint)
    }
  }

  private checkEnd(): void {
    if (this.player.alive && this.cpu.alive) {
      return
    }
    if (this.finisherHold > 0) {
      return
    }
    if (session.trainingMode) {
      this.time.delayedCall(400, () => this.resetPositions())
      return
    }
    void this.finishMatch(this.player.alive ? GameFlow.VICTORY : GameFlow.DEFEAT)
  }
}
