export class MenuInput {
  private readonly down = new Set<string>()
  private readonly prev = new Set<string>()
  private bound = false

  private readonly onDown = (event: KeyboardEvent): void => {
    this.down.add(event.code)
  }

  private readonly onUp = (event: KeyboardEvent): void => {
    this.down.delete(event.code)
  }

  attach(): void {
    if (this.bound) {
      return
    }
    this.bound = true
    window.addEventListener('keydown', this.onDown)
    window.addEventListener('keyup', this.onUp)
  }

  detach(): void {
    if (!this.bound) {
      return
    }
    this.bound = false
    window.removeEventListener('keydown', this.onDown)
    window.removeEventListener('keyup', this.onUp)
    this.down.clear()
    this.prev.clear()
  }

  get justUp(): boolean {
    return this.edge(['ArrowUp', 'KeyW'])
  }

  get justDown(): boolean {
    return this.edge(['ArrowDown', 'KeyS'])
  }

  get justLeft(): boolean {
    return this.edge(['ArrowLeft', 'KeyA'])
  }

  get justRight(): boolean {
    return this.edge(['ArrowRight', 'KeyD'])
  }

  get justConfirm(): boolean {
    return this.edge(['Enter', 'Space'])
  }

  get justBack(): boolean {
    return this.edge(['Escape'])
  }

  get justPrevTab(): boolean {
    return this.edge(['KeyQ', 'PageUp'])
  }

  get justNextTab(): boolean {
    return this.edge(['KeyE', 'PageDown'])
  }

  private edge(codes: string[]): boolean {
    let hit = false
    for (const code of codes) {
      const isDown = this.down.has(code)
      const was = this.prev.has(code)
      if (isDown && !was) {
        hit = true
      }
      if (isDown) {
        this.prev.add(code)
      } else {
        this.prev.delete(code)
      }
    }
    return hit
  }
}
