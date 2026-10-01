import Phaser from 'phaser'

/** Touches pour passer une bulle : Entrée, +, =, pavé +, Espace. */
export function isDialogueAdvanceEvent(event: KeyboardEvent): boolean {
  if (event.repeat) {
    return false
  }
  if (event.key === '+' || event.key === '=' || event.key === 'Enter' || event.key === ' ') {
    return true
  }
  return event.code === 'Enter'
    || event.code === 'NumpadEnter'
    || event.code === 'NumpadAdd'
    || event.code === 'Equal'
    || event.code === 'Space'
    || event.code === 'Plus'
}

export const DIALOGUE_ADVANCE_HINT = '▼  +  ou  Entrée'

export class DialogueAdvance {
  private queued = false
  private holding = false

  constructor(scene: Phaser.Scene) {
    const onDown = (event: KeyboardEvent): void => {
      if (!isDialogueAdvanceEvent(event)) {
        return
      }
      this.holding = true
      this.queued = true
    }
    const onUp = (event: KeyboardEvent): void => {
      if (event.key === '+' || event.key === '=' || event.key === 'Enter' || event.key === ' '
        || event.code === 'Enter' || event.code === 'NumpadEnter' || event.code === 'NumpadAdd'
        || event.code === 'Equal' || event.code === 'Space' || event.code === 'Plus') {
        this.holding = false
      }
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    })
  }

  /** Un appui. Consommé une seule fois. */
  consume(): boolean {
    const hit = this.queued
    this.queued = false
    return hit
  }

  held(): boolean {
    return this.holding
  }

  clear(): void {
    this.queued = false
  }
}
