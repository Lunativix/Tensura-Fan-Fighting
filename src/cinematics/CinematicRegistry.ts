import type { CinematicContext, CinematicDef, CinematicFactory } from './types.ts'
import type { FighterIdValue } from '../types/game.ts'

export function interactionKey(a: string, b: string): string {
  return [a, b].sort().join('|')
}

export class CinematicRegistry {
  private readonly factories = new Map<string, CinematicFactory>()
  private readonly aliases = new Map<string, string>()
  private readonly interactions = new Map<string, string>()

  register(id: string, factory: CinematicFactory): void {
    this.factories.set(id, factory)
  }

  alias(from: string, to: string): void {
    this.aliases.set(from, to)
  }

  registerInteraction(a: FighterIdValue, b: FighterIdValue, cinematicId: string): void {
    this.interactions.set(interactionKey(a, b), cinematicId)
  }

  has(id: string): boolean {
    return this.factories.has(this.resolveId(id))
  }

  resolveId(id: string): string {
    let current = id
    const seen = new Set<string>()
    while (this.aliases.has(current) && !seen.has(current)) {
      seen.add(current)
      current = this.aliases.get(current) ?? current
    }
    if (this.factories.has(current)) {
      return current
    }
    if (current.startsWith('ultimate_')) {
      return 'ultimate'
    }
    if (current.startsWith('transform_')) {
      return 'transform'
    }
    if (current.endsWith('_intro') || current.startsWith('enter_')) {
      return 'character_intro'
    }
    if (current.startsWith('interaction_')) {
      return 'interaction'
    }
    return current
  }

  build(id: string, ctx: CinematicContext): CinematicDef | null {
    const resolved = this.resolveId(id)
    const factory = this.factories.get(resolved)
    if (!factory) {
      return null
    }
    const def = factory(ctx)
    return { ...def, id }
  }

  findInteraction(a: string, b: string): string | null {
    return this.interactions.get(interactionKey(a, b)) ?? null
  }
}
