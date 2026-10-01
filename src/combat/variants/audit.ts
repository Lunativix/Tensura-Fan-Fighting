import type { FighterIdValue } from '../../types/game.ts'
import { pngExistsFor } from '../anim/audit.ts'
import { skillAnimDefsOf } from '../anim/registry.ts'
import { appearanceById } from '../../story/visual/catalog.ts'
import { isCinematicOnlyForm, versusAnimForm } from '../anim/forms.ts'
import { VARIANTS } from './catalog.ts'
import type { VariantMissing } from './types.ts'

function combatFormOf(variantId: string, fighterId: FighterIdValue): string {
  if (isCinematicOnlyForm(variantId)) {
    return versusAnimForm(fighterId)
  }
  return variantId
}

/** Missing drop-in frames for a narrative variant. Reuses the existing PNG index. */
export function variantMissingResources(variantId?: string): VariantMissing[] {
  const list = variantId ? VARIANTS.filter((item) => item.id === variantId) : VARIANTS
  const rows: VariantMissing[] = []
  for (const variant of list) {
    const missing: string[] = []
    const appearance = appearanceById(variant.appearanceId)
    if (appearance?.artStatus === 'missing-period-art') {
      missing.push('period art (fallback roster)')
    }
    if (!variant.selectableInVersus) {
      missing.push('combat sheets skipped (cinematic / portrait only)')
    } else {
      const form = combatFormOf(variant.id, variant.fighterId)
      for (const def of skillAnimDefsOf(variant.fighterId)) {
        if (!pngExistsFor(variant.fighterId, form, def.animId)) {
          missing.push(`${def.skillName} animation (${def.animId})`)
        }
      }
    }
    if (missing.length > 0) {
      rows.push({ variantId: variant.id, fighterId: variant.fighterId, missing })
    }
  }
  return rows
}

export function formatVariantMissing(row: VariantMissing): string {
  return `${row.fighterId} / ${row.variantId}\n  Missing:\n${row.missing.map((item) => `  * ${item}`).join('\n')}`
}
