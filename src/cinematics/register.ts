import type { CinematicRegistry } from './CinematicRegistry.ts'
import { battleIntro, characterIntro } from './scripts/battleIntro.ts'
import { ultimateGeneric, ultimateMilim, ultimateRimuru } from './scripts/ultimates.ts'
import { transformGeneric } from './scripts/transformations.ts'
import { INTERACTION_TABLE, interactionGeneric } from './scripts/interactions.ts'
import { victoryCinematic } from './scripts/victory.ts'

export function registerCinematics(registry: CinematicRegistry): void {
  registry.register('battle_intro', battleIntro)
  registry.register('character_intro', characterIntro)
  registry.register('ultimate', ultimateGeneric)
  registry.register('ultimate_rimuru', ultimateRimuru)
  registry.register('ultimate_milim', ultimateMilim)
  registry.register('transform', transformGeneric)
  registry.register('interaction', interactionGeneric)
  registry.register('victory', victoryCinematic)

  registry.alias('rimuru_intro', 'character_intro')
  registry.alias('milim_intro', 'character_intro')

  for (const row of INTERACTION_TABLE) {
    registry.registerInteraction(row.a, row.b, `interaction_${row.a}_${row.b}`)
    registry.alias(`interaction_${row.a}_${row.b}`, 'interaction')
    registry.alias(`interaction_${row.b}_${row.a}`, 'interaction')
  }
}
