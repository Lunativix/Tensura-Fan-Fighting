import Phaser from 'phaser'
import { audio } from '../audio/AudioManager.ts'
import { musicManager } from '../audio/music/MusicManager.ts'
import { MusicRole } from '../audio/music/types.ts'
import { SceneKeys } from '../game/SceneKeys.ts'
import { drawMenuBackdrop } from '../ui/Backdrop.ts'
import { VerticalMenu } from '../ui/VerticalMenu.ts'
import { PlayMode, session } from '../game/GameState.ts'
import { FONT, FONT_UI, UI } from '../ui/theme.ts'
import { FighterId, type FighterIdValue } from '../types/game.ts'
import {
  allArcs,
  isMissionOpen,
  loadStory,
  nextPlayable,
  playableMissions,
  resetStory,
  STORY_MISSIONS,
  unlockedArchiveEntries,
} from '../story/index.ts'

export class StoryScene extends Phaser.Scene {
  private menu!: VerticalMenu

  constructor() {
    super(SceneKeys.Story)
  }

  create(): void {
    musicManager.playContext({
      role: MusicRole.MENU,
      storyEvent: 'story-select',
      intensity: 1,
    }, true)
    drawMenuBackdrop(this)
    const story = loadStory()
    const current = nextPlayable(story) ?? playableMissions()[playableMissions().length - 1]
    this.add.text(960, 88, 'HISTOIRE', {
      fontFamily: FONT,
      fontSize: '48px',
      color: '#eaf6ff',
    }).setOrigin(0.5)
    this.add.text(960, 148, 'Satoru Mikami → Jura → Shizu → Tempest → Farmus → Walpurgis', {
      fontFamily: FONT_UI,
      fontSize: '20px',
      color: '#8fb4d9',
    }).setOrigin(0.5)

    const lines = allArcs().map((arc) => {
      const missions = STORY_MISSIONS.filter((mission) => mission.arc === arc.id)
      const playable = missions.filter((mission) => mission.playable)
      const done = playable.length > 0 && playable.every((mission) => story.completed.includes(mission.id))
      const open = playable.some((mission) => isMissionOpen(mission, story))
      const mark = done ? 'OK' : open ? '>>' : '--'
      return `${mark}  ${arc.title}`
    })
    this.add.text(280, 210, lines.join('\n'), {
      fontFamily: FONT_UI,
      fontSize: '22px',
      color: '#c9def5',
      lineSpacing: 8,
    })
    this.add.text(1180, 230, current ? `${current.title}\n${current.summary}` : 'Campagne terminée jusqu\'à Walpurgis.', {
      fontFamily: FONT_UI,
      fontSize: '22px',
      color: UI.gold,
      wordWrap: { width: 520 },
      align: 'left',
    }).setOrigin(0.5, 0)
    this.add.text(1180, 430, `Archives  ${unlockedArchiveEntries(story.archives).length}`, {
      fontFamily: FONT_UI,
      fontSize: '16px',
      color: '#8fb4d9',
    }).setOrigin(0.5, 0)

    this.menu = new VerticalMenu(this, 760, [
      {
        label: story.completed.length === 0 ? 'COMMENCER' : 'CONTINUER',
        run: () => this.launch(current?.id ?? 'prologue_reincarnation'),
      },
      {
        label: 'NOUVELLE HISTOIRE',
        run: () => {
          resetStory()
          this.scene.restart()
        },
      },
      { label: 'RETOUR', run: () => this.scene.start(SceneKeys.Hub) },
    ], 78)
  }

  update(): void {
    this.menu.update()
    if (this.menu.justBack) {
      audio.playSfx('back')
      this.scene.start(SceneKeys.Hub)
    }
  }

  private launch(missionId: string): void {
    session.playMode = PlayMode.STORY
    session.playerFighter = FighterId.rimuru
    session.playerTeam = [FighterId.rimuru]
    session.storyMissionId = missionId
    session.trainingMode = false
    this.scene.start(SceneKeys.StoryPlay)
  }
}

export function storyLength(): number {
  return playableMissions().length
}

export function storyCpu(_index: number): FighterIdValue {
  return FighterId.veldora
}
