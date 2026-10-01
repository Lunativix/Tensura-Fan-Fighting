import { audio } from '../audio/AudioManager.ts'
import { musicManager } from '../audio/music/MusicManager.ts'
import { MusicEvent } from '../audio/music/types.ts'

export class CinematicAudio {
  private ducked = false

  duck(factor = 0.28): void {
    this.ducked = true
    audio.duckMusic(factor)
    musicManager.pulse()
  }

  stinger(id: string): void {
    if (id.includes('transform')) {
      musicManager.stinger('transform')
      musicManager.event(MusicEvent.Transformation)
      return
    }
    if (id.includes('ult') || id.includes('ultimate')) {
      musicManager.stinger('ultimate')
      musicManager.event(MusicEvent.Ultimate)
      return
    }
    if (id.includes('boss') || id.includes('appear')) {
      musicManager.stinger('boss')
      return
    }
    audio.playSfx(id)
  }

  restore(): void {
    if (!this.ducked) {
      return
    }
    audio.restoreMusic()
    this.ducked = false
  }
}
