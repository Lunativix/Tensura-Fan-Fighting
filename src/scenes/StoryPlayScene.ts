import Phaser from 'phaser'
import { CHARACTERS } from '../config/characters.ts'
import { storySkinFor } from '../config/characterSkins.ts'
import { appearanceById, appearanceFor, warnVisualGaps } from '../story/visual/index.ts'
import { Fighter } from '../characters/Fighter.ts'
import { ProjectilePool } from '../combat/Projectile.ts'
import { CinematicDialogue } from '../cinematics/CinematicDialogue.ts'
import { createArena, followFighters } from '../game/Arena.ts'
import { PlayMode, session } from '../game/GameState.ts'
import { SceneKeys } from '../game/SceneKeys.ts'
import { InputManager } from '../input/InputManager.ts'
import { emptyActions } from '../input/Actions.ts'
import { MenuInput } from '../input/MenuInput.ts'
import { DialogueAdvance } from '../input/DialogueAdvance.ts'
import { audio } from '../audio/AudioManager.ts'
import { combatSfx } from '../audio/CombatSfx.ts'
import { musicManager } from '../audio/music/MusicManager.ts'
import { BattleType, MusicEvent, MusicRole } from '../audio/music/types.ts'
import { clampDelta } from '../engine/GameLoop.ts'
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../engine/Time.ts'
import { GameFlow, FighterId, type FighterIdValue } from '../types/game.ts'
import { resolveDialoguePortrait } from '../ui/portraits.ts'
import { FONT, FONT_UI, UI } from '../ui/theme.ts'
import { MenuButton } from '../ui/MenuButton.ts'
import { missionById, nextPlayable } from '../story/StoryCatalog.ts'
import {
  loadStory,
  persistStory,
  markComplete,
  mergeUnlocks,
  grantStoryClearRewards,
  unlockStoryAppearances,
} from '../story/StoryProgress.ts'
import { saveManager } from '../save/SaveManager.ts'
import { markEncountered } from '../live/collection.ts'
import { gateStoryActions } from '../story/gates.ts'
import { enemyDef } from '../story/pve/EnemyCatalog.ts'
import { PveEnemy } from '../story/pve/PveEnemy.ts'
import { steerPve } from '../story/pve/PveBrain.ts'
import { resolvePve } from '../story/pve/PveCombat.ts'
import { PveProfile } from '../story/types.ts'
import { createSpriteAnims } from '../sprites/SpriteLoader.ts'
import type { StoryBeat, StoryMissionDef, StoryPresenceId, StorySaveSlice } from '../story/types.ts'
import { CombatSpectacle } from '../vfx/CombatSpectacle.ts'
import { HitStop } from '../combat/HitStop.ts'
import { enteredPhase } from '../combat/feel/FrameEvents.ts'
import { playTransformFeel } from '../combat/feel/TransformFeel.ts'
import { consumeBossPhase2 } from '../combat/feel/BossPhaseManager.ts'

export class StoryPlayScene extends Phaser.Scene {
  private mission!: StoryMissionDef
  private story!: StorySaveSlice
  private player!: Fighter
  private guest: Fighter | null = null
  private enemies: PveEnemy[] = []
  private projectiles!: ProjectilePool
  private inputPad!: InputManager
  private dialogue!: CinematicDialogue
  private dialogueAdvance!: DialogueAdvance
  private floor!: Phaser.GameObjects.Rectangle
  private beat = 0
  private wait: 'none' | 'dialogue' | 'title' | 'input' | 'clear' | 'goto' | 'transform' = 'none'
  private waitInput: 'move' | 'attack' | 'skill1' | 'guard' | 'dash' | 'jump' | null = null
  private gotoX = 0
  private titleLeft = 0
  private transformLeft = 0
  private hint!: Phaser.GameObjects.Text
  private hpText!: Phaser.GameObjects.Text
  private titleFx: Phaser.GameObjects.Container | null = null
  private paused = false
  private pauseMenu!: MenuButton
  private pauseResume!: MenuButton
  private menuInput!: MenuInput
  private ended = false
  private taught = { move: false, attack: false, skill1: false, guard: false, dash: false, jump: false }
  private spectacle!: CombatSpectacle
  private hitStop = new HitStop()

  constructor() {
    super(SceneKeys.StoryPlay)
  }

  create(): void {
    session.flow = GameFlow.FIGHT
    session.playMode = PlayMode.STORY
    session.paused = false
    this.ended = false
    this.enemies = []
    this.guest = null
    this.beat = 0
    this.wait = 'none'
    this.waitInput = null
    this.gotoX = 0
    this.titleLeft = 0
    this.transformLeft = 0
    this.titleFx?.destroy()
    this.titleFx = null
    this.story = loadStory()
    this.taught = {
      move: this.story.tutorials.includes('move'),
      attack: this.story.tutorials.includes('attack'),
      skill1: this.story.tutorials.includes('skill1'),
      guard: this.story.tutorials.includes('guard'),
      dash: this.story.tutorials.includes('dash'),
      jump: this.story.tutorials.includes('jump'),
    }
    const mission = missionById(session.storyMissionId || this.story.missionId) ?? missionById(this.story.missionId)
    if (!mission || mission.beats.length === 0) {
      this.scene.start(SceneKeys.Story)
      return
    }
    this.mission = mission
    session.stageId = mission.stageId
    audio.unlock()
    const stage = createArena(this)
    combatSfx.setEnvironment(stage.id)
    this.physics.world.setBounds(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT)
    this.cameras.main.setBounds(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT)
    this.floor = this.add.rectangle(960, 970, 1920, 100, 0x16324a, 0)
    this.physics.add.existing(this.floor, true)
    createSpriteAnims(this)

    const playerSkin = storySkinFor(FighterId.rimuru, this.story, { missionId: this.mission.id })
    this.player = new Fighter(this, 360, 700, CHARACTERS[FighterId.rimuru], 1, {
      body: playerSkin.body,
      form: playerSkin.id,
    })
    for (const warning of warnVisualGaps(this.story, this.mission.id)) {
      console.warn(warning)
    }
    this.physics.add.collider(this.player, this.floor)
    this.projectiles = new ProjectilePool(this)
    this.inputPad = new InputManager()
    this.dialogue = new CinematicDialogue(this)
    this.dialogueAdvance = new DialogueAdvance(this)
    musicManager.playContext({
      role: MusicRole.EXPLORATION,
      arc: this.mission.arc,
      location: this.mission.stageId,
      stageId: this.mission.stageId,
      playerCharacter: FighterId.rimuru,
      intensity: 1,
    }, true)

    this.add.text(64, 36, this.mission.title, {
      fontFamily: FONT,
      fontSize: '22px',
      color: UI.gold,
    }).setScrollFactor(0).setDepth(60)
    this.add.text(64, 64, this.mission.location, {
      fontFamily: FONT_UI,
      fontSize: '16px',
      color: '#9ec4e8',
    }).setScrollFactor(0).setDepth(60)
    this.hpText = this.add.text(64, 94, '', {
      fontFamily: FONT_UI,
      fontSize: '18px',
      color: '#c8f7c5',
      lineSpacing: 4,
    }).setScrollFactor(0).setDepth(60)
    this.hint = this.add.text(960, 86, '', {
      fontFamily: FONT_UI,
      fontSize: '20px',
      color: '#ffe082',
      align: 'center',
      wordWrap: { width: 900 },
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(60)

    this.pauseResume = new MenuButton(this, 960, 500, 'REPRENDRE', () => this.setPaused(false))
    this.pauseMenu = new MenuButton(this, 960, 590, 'JOURNAL', () => {
      session.paused = false
      this.scene.start(SceneKeys.Story)
    })
    this.pauseResume.container.setScrollFactor(0).setDepth(90).setVisible(false)
    this.pauseMenu.container.setScrollFactor(0).setDepth(90).setVisible(false)
    this.menuInput = new MenuInput()
    this.menuInput.attach()
    this.spectacle = new CombatSpectacle(this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.menuInput.detach()
      this.spectacle.destroy()
    })

    this.runBeat()
  }

  update(_t: number, delta: number): void {
    const dt = clampDelta(delta)
    if (this.ended) {
      this.dialogue.tick(dt)
      if (this.dialogueAdvance.consume()) {
        if (this.dialogue.visible) {
          this.dialogue.advanceBubble()
        } else {
          this.scene.restart()
        }
      }
      return
    }
    if (this.menuInput.justBack) {
      this.setPaused(!this.paused)
    }
    if (this.paused) {
      return
    }

    this.dialogue.tick(dt)
    if (this.dialogue.visible) {
      if (this.dialogueAdvance.consume()) {
        this.dialogue.advanceBubble()
      }
      this.freezeActors()
      this.refreshHud()
      return
    }

    if (this.wait === 'dialogue') {
      musicManager.event(MusicEvent.DialogueEnd)
      this.wait = 'none'
      this.beat += 1
      this.runBeat()
      return
    }

    if (this.wait === 'title') {
      this.titleLeft -= dt
      if (this.titleLeft <= 0 || this.dialogueAdvance.consume()) {
        this.titleFx?.destroy()
        this.titleFx = null
        this.wait = 'none'
        this.beat += 1
        this.runBeat()
      }
      return
    }
    this.dialogueAdvance.clear()
    if (this.wait === 'transform') {
      this.transformLeft -= dt
      this.spectacle.tick(dt)
      if (this.transformLeft <= 0) {
        this.wait = 'none'
        this.beat += 1
        this.runBeat()
      }
      return
    }

    const raw = this.inputPad.read()
    if (this.wait === 'input' && this.waitInput && this.matches(raw, this.waitInput)) {
      this.taught[this.waitInput] = true
      this.waitInput = null
      this.wait = 'none'
      this.hint.setText('')
      this.beat += 1
      this.runBeat()
      return
    }
    if (this.wait === 'clear' && this.enemies.every((enemy) => !enemy.alive)) {
      this.wait = 'none'
      musicManager.playContext({
        role: MusicRole.EXPLORATION,
        arc: this.mission.arc,
        location: this.mission.stageId,
        stageId: this.mission.stageId,
        playerCharacter: FighterId.rimuru,
        intensity: 1,
      })
      this.beat += 1
      this.runBeat()
      return
    }
    if (this.wait === 'goto' && this.player.x >= this.gotoX) {
      this.wait = 'none'
      this.beat += 1
      this.runBeat()
      return
    }

    if (this.hitStop.tick(dt)) {
      this.spectacle.tick(dt)
      this.refreshHud()
      return
    }

    const allow = {
      move: this.taught.move || this.waitInput === 'move',
      attack: this.taught.attack || this.waitInput === 'attack',
      skill1: this.taught.skill1 || this.waitInput === 'skill1' || this.story.unlockedSkills.includes('water-blade'),
      guard: this.taught.guard || this.waitInput === 'guard',
      dash: this.taught.dash || this.waitInput === 'dash',
      jump: this.taught.jump || this.waitInput === 'jump',
    }
    if (this.mission.arc !== 'prologue') {
      if (this.taught.move) {
        allow.jump = true
        allow.dash = true
        allow.guard = true
      }
      if (this.taught.attack) {
        allow.attack = true
      }
    }
    gateStoryActions(raw, this.story, allow)
    this.player.lookAt(this.guest?.x ?? this.nearestEnemyX())
    this.player.applyInput(raw, (attack) => this.projectiles.spawn(this.player, attack, this.nearestEnemyX()))
    this.player.tick(dt)
    this.guest?.lookAt(this.player.x)
    this.guest?.applyInput(emptyActions(), () => undefined)
    this.guest?.tick(dt)
    this.consumeMotion(this.player)
    if (this.guest) {
      this.consumeMotion(this.guest)
    }
    this.playSkillCues(this.player)
    if (this.guest) {
      this.playSkillCues(this.guest)
    }
    this.tickAttackFeel(this.player)
    for (const cue of this.player.drainAudio()) {
      combatSfx.cue(this.player, cue)
    }
    combatSfx.footstep(this.player)
    for (const shot of this.projectiles.active()) {
      shot.tick(dt)
      this.spectacle.traceProjectile(shot, dt)
      combatSfx.projectileTravel(shot)
      if (shot.consumeEdgeFx()) {
        this.spectacle.onProjectileEdge(shot)
      }
    }
    for (const enemy of this.enemies) {
      if (!enemy.alive) {
        continue
      }
      steerPve(enemy, this.player.x, dt)
      enemy.tick(dt)
    }
    const impact = resolvePve(this.player, this.enemies, this.projectiles)
    if (impact) {
      const feel = this.spectacle.onImpact(impact)
      this.hitStop.apply(feel.hitStop)
    }
    for (const enemy of this.enemies) {
      consumeBossPhase2(this, this.spectacle, enemy)
    }
    this.spectacle.tick(dt)
    const living = this.enemies.filter((enemy) => enemy.alive)
    const boss = living.find((enemy) => enemy.def.profile === PveProfile.BOSS)
    if (boss) {
      musicManager.setCombatState(this.player.hp / this.player.def.maxHp, boss.hp / boss.def.hp, 0)
    } else if (living.length > 0) {
      musicManager.setCombatState(this.player.hp / this.player.def.maxHp, 0.7, living.length)
    }
    const focus = this.guest ?? this.enemies.find((enemy) => enemy.alive)
    followFighters(this.cameras.main, this.player.x, focus ? focus.x : this.player.x + 280, this.player.body.velocity.x, 0)
    this.refreshHud()
    if (!this.player.alive) {
      this.fail()
    }
  }

  private runBeat(): void {
    const beat = this.mission.beats[this.beat]
    if (!beat) {
      this.finish(true)
      return
    }
    this.apply(beat)
  }

  private apply(beat: StoryBeat): void {
    if (beat.type === 'title') {
      this.titleFx?.destroy()
      const sub = beat.sub
        ? this.add.text(0, 56, beat.sub, { fontFamily: FONT_UI, fontSize: '22px', color: '#ffe082' }).setOrigin(0.5)
        : null
      const head = this.add.text(0, 0, beat.text, { fontFamily: FONT, fontSize: '54px', color: '#eaf6ff' }).setOrigin(0.5)
      this.titleFx = this.add.container(960, 400, sub ? [head, sub] : [head])
      this.titleFx.setScrollFactor(0).setDepth(70)
      this.titleLeft = beat.ms ?? 2000
      this.wait = 'title'
      return
    }
    if (beat.type === 'narration') {
      this.dialogue.show({
        speaker: '',
        text: beat.text,
        kind: 'narration',
        duration: 120000,
      })
      this.wait = 'dialogue'
      musicManager.event(MusicEvent.DialogueStart)
      return
    }
    if (beat.type === 'dialogue') {
      this.dialogue.show({
        speaker: beat.speaker,
        speakerId: beat.speakerId,
        portrait: resolveDialoguePortrait({
          speaker: beat.speaker,
          speakerId: beat.speakerId,
          portrait: beat.portrait,
          missionId: this.mission.id,
          story: this.story,
        }),
        text: beat.text,
        emotion: beat.emotion,
        duration: 120000,
      })
      this.wait = 'dialogue'
      musicManager.event(MusicEvent.DialogueStart)
      return
    }
    if (beat.type === 'hint') {
      this.hint.setText(beat.text)
      this.beat += 1
      this.runBeat()
      return
    }
    if (beat.type === 'wait') {
      this.wait = 'input'
      this.waitInput = beat.input
      return
    }
    if (beat.type === 'spawn') {
      this.spawnEnemy(beat.enemy, beat.x, beat.y)
      const def = enemyDef(beat.enemy)
      if (def?.profile === PveProfile.BOSS) {
        musicManager.event(MusicEvent.BossSpawn, { boss: beat.enemy })
      } else {
        musicManager.playContext({
          role: MusicRole.BATTLE,
          arc: this.mission.arc,
          location: this.mission.stageId,
          stageId: this.mission.stageId,
          battleType: BattleType.PVE_WAVE,
          intensity: 2,
          playerCharacter: FighterId.rimuru,
        })
      }
      this.beat += 1
      this.runBeat()
      return
    }
    if (beat.type === 'clear') {
      this.wait = 'clear'
      return
    }
    if (beat.type === 'goto') {
      this.wait = 'goto'
      this.gotoX = beat.x
      this.hint.setText(beat.hint ?? 'Avance.')
      return
    }
    if (beat.type === 'heal') {
      this.player.hp = this.player.def.maxHp
      this.beat += 1
      this.runBeat()
      return
    }
    if (beat.type === 'unlock') {
      this.story = mergeUnlocks(this.story, beat.unlocks)
      persistStory(this.story)
      this.beat += 1
      this.runBeat()
      return
    }
    if (beat.type === 'presence') {
      this.setPresence(beat.who)
      if (beat.who === 'veldora') {
        musicManager.playContext({
          role: MusicRole.CINEMATIC,
          character: 'veldora',
          location: this.mission.stageId,
          stageId: this.mission.stageId,
          arc: this.mission.arc,
          storyEvent: 'veldora',
          intensity: 2,
        }, true)
      }
      if (beat.who === 'milim') {
        musicManager.playContext({
          role: MusicRole.CINEMATIC,
          character: 'milim',
          arc: this.mission.arc,
          storyEvent: 'milim',
          intensity: 2,
        }, true)
      }
      if (beat.who === 'diablo') {
        musicManager.playContext({
          role: MusicRole.CINEMATIC,
          character: 'diablo',
          arc: this.mission.arc,
          storyEvent: 'diablo',
          intensity: 2,
        }, true)
      }
      this.beat += 1
      this.runBeat()
      return
    }
    if (beat.type === 'transform') {
      this.applyTransform(beat.who, beat.appearanceId)
      this.transformLeft = 900
      this.wait = 'transform'
      return
    }
    if (beat.type === 'complete') {
      this.finish(true)
    }
  }

  private spawnEnemy(id: string, x: number, y?: number): void {
    const def = enemyDef(id)
    if (!def) {
      return
    }
    const enemy = new PveEnemy(this, x, y ?? (def.profile === PveProfile.BOSS ? 780 : 860), def)
    this.physics.add.collider(enemy, this.floor)
    this.enemies.push(enemy)
  }

  private setPresence(who: StoryPresenceId): void {
    this.guest?.destroy()
    this.guest = null
    if (who === 'none') {
      return
    }
    const id = presenceFighter(who)
    if (!id) {
      return
    }
    const look = appearanceFor(id, { story: this.story, missionId: this.mission.id })
    this.guest = new Fighter(this, 1640, 640, CHARACTERS[id], -1, {
      body: look.body,
      form: look.id,
    })
    this.physics.add.collider(this.guest, this.floor)
    this.guest.invuln = 999999
    this.guest.applyInput(emptyActions(), () => undefined)
    const data = saveManager.load()
    markEncountered(data, id)
    saveManager.save(data)
  }

  private applyTransform(who: FighterIdValue, appearanceId: string): void {
    const look = appearanceById(appearanceId)
    if (!look) {
      console.warn(`[visual] unknown appearance ${appearanceId}, keeping current look`)
      return
    }
    const fighter = this.player.def.id === who ? this.player : this.guest?.def.id === who ? this.guest : null
    if (!fighter) {
      console.warn(`[visual] no actor for transform ${who}`)
      return
    }
    playTransformFeel(this, this.spectacle, fighter)
    fighter.applyBody(look.body, look.id)
    unlockStoryAppearances([appearanceId])
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

  private freezeActors(): void {
    this.player.applyInput(emptyActions(), () => undefined)
    this.guest?.applyInput(emptyActions(), () => undefined)
  }

  private matches(raw: { left: boolean; right: boolean; light: boolean; medium: boolean; heavy: boolean; skill1: boolean; guard: boolean; dash: boolean; jump: boolean }, kind: string): boolean {
    if (kind === 'move') {
      return raw.left || raw.right
    }
    if (kind === 'attack') {
      return raw.light || raw.medium || raw.heavy
    }
    if (kind === 'skill1') {
      return raw.skill1
    }
    if (kind === 'guard') {
      return raw.guard
    }
    if (kind === 'dash') {
      return raw.dash
    }
    return raw.jump
  }

  private nearestEnemyX(): number {
    const living = this.enemies.filter((enemy) => enemy.alive)
    if (living.length === 0) {
      return this.player.x + 200
    }
    return living.reduce((best, enemy) => Math.abs(enemy.x - this.player.x) < Math.abs(best - this.player.x) ? enemy.x : best, living[0]!.x)
  }

  private refreshHud(): void {
    const boss = this.enemies.find((enemy) => enemy.alive && enemy.def.profile === PveProfile.BOSS)
    const name = appearanceFor(FighterId.rimuru, { story: this.story, missionId: this.mission.id }).displayName
    const rimuru = `${name}  ${Math.ceil(this.player.hp)} / ${this.player.def.maxHp}`
    this.hpText.setText(boss
      ? `${rimuru}\n${boss.def.name}  ${Math.ceil(boss.hp)} / ${boss.def.hp}`
      : rimuru)
  }

  private setPaused(value: boolean): void {
    this.paused = value
    session.paused = value
    this.pauseResume.container.setVisible(value)
    this.pauseMenu.container.setVisible(value)
    if (value) {
      this.physics.world.pause()
    } else {
      this.physics.world.resume()
    }
  }

  private fail(): void {
    this.ended = true
    musicManager.event(MusicEvent.Defeat, { arc: this.mission.arc })
    this.dialogue.show({
      speaker: 'Rimuru',
      speakerId: 'rimuru',
      portrait: resolveDialoguePortrait({
        speaker: 'Rimuru',
        speakerId: 'rimuru',
        missionId: this.mission.id,
        story: this.story,
      }),
      text: 'Mince... je n\'ai pas réussi à tenir.',
      emotion: 'sad',
      duration: 120000,
    })
    this.hint.setText('+  ou  Entrée : recommencer.')
  }

  private finish(won: boolean): void {
    if (this.ended) {
      return
    }
    this.ended = true
    if (won) {
      const firstClear = !this.story.completed.includes(this.mission.id)
      this.story = markComplete(this.story, this.mission.id)
      this.story = mergeUnlocks(this.story, this.mission.unlocks)
      const next = nextPlayable(this.story)
      this.story.missionId = next?.id ?? this.mission.id
      persistStory(this.story)
      if (firstClear) {
        grantStoryClearRewards(this.mission.rewards.xp, this.mission.rewards.coins)
      }
      session.storyMissionId = this.story.missionId
      session.storyIndex = Math.max(0, session.storyIndex)
    }
    this.time.delayedCall(600, () => {
      if (won) {
        musicManager.event(MusicEvent.Victory, { arc: this.mission.arc, battleType: BattleType.STORY })
        const next = nextPlayable(loadStory())
        if (next && next.id !== this.mission.id) {
          session.storyMissionId = next.id
          this.scene.restart()
          return
        }
      } else {
        musicManager.event(MusicEvent.Defeat, { arc: this.mission.arc })
      }
      this.scene.start(SceneKeys.Story)
    })
  }
}

function presenceFighter(who: StoryPresenceId): FighterIdValue | null {
  if (who === 'veldora') {
    return FighterId.veldora
  }
  if (who === 'benimaru') {
    return FighterId.benimaru
  }
  if (who === 'shion') {
    return FighterId.shion
  }
  if (who === 'milim') {
    return FighterId.milim
  }
  if (who === 'diablo') {
    return FighterId.diablo
  }
  if (who === 'guy') {
    return FighterId.guy
  }
  return null
}
