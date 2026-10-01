import type { SkillAnimResolution } from './types.ts'

const seen = new Set<string>()
const active = new Map<string, SkillAnimResolution>()

export function formatMissingSkillAnim(res: SkillAnimResolution): string {
  return [
    '[MISSING SKILL ANIMATION]',
    `Character: ${res.characterName}`,
    `Form: ${res.form}`,
    `Skill: ${res.skillName}`,
    `Anim: ${res.animId}`,
  ].join('\n')
}

export function noteMissingSkillAnim(res: SkillAnimResolution): void {
  const key = `${res.fighterId}::${res.form}::${res.animId}`
  active.set(key, res)
  if (seen.has(key)) {
    return
  }
  seen.add(key)
  console.warn(formatMissingSkillAnim(res))
}

export function clearFoundSkillAnim(res: Pick<SkillAnimResolution, 'fighterId' | 'form' | 'animId'>): void {
  active.delete(`${res.fighterId}::${res.form}::${res.animId}`)
}

export function missingSkillAnims(): SkillAnimResolution[] {
  return [...active.values()]
}

export function currentMissingLine(): string {
  const items = missingSkillAnims()
  if (items.length === 0) {
    return ''
  }
  const last = items[items.length - 1]
  if (!last) {
    return ''
  }
  return formatMissingSkillAnim(last)
}

export function missingSummaryLines(): string[] {
  return missingSkillAnims().map((item) => `${item.characterName} / ${item.form} / ${item.skillName} (${item.animId})`)
}
