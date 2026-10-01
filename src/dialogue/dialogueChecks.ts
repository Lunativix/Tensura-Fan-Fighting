import { INTERACTION_TABLE } from '../cinematics/scripts/interactions.ts'
import { CHARACTERS, PLAYABLE_FIGHTERS } from '../config/characters.ts'
import { flavorOf } from '../config/rosterFlavor.ts'
import { STORY_MISSIONS } from '../story/StoryCatalog.ts'
import { DEFEAT_LINE, INTRO_LINE, INTRO_REPLY, ULT_LINE, VICTORY_LINE } from './combatBanter.ts'

const GREAT_SAGE = new Set(['Great Sage', 'Grande Sagesse'])
const HINT_LEAK = /\b(Garde-toi|Utilise Water Blade|Esquive|Déplace-toi|Frappe\.|Contre-attaque)\b/i
const SELF_VERB = /^(pense|va |décide|dégaine|utilise |a gagné|a été vaincu|a été|s'approche|regarde |s'avance)/i

/** Voluntary third person: Gabiru boasts his own name. */
const NAME_BOAST = new Set(['Gabiru'])

function escapeRe(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function issuesForSpokenLine(speaker: string, text: string, where: string): string[] {
  const issues: string[] = []
  if (!speaker.trim()) {
    issues.push(`${where}: missing speaker`)
  }
  if (text.includes('Falmuth')) {
    issues.push(`${where}: spoken text uses Falmuth`)
  }
  if (speaker && (text.startsWith(`${speaker} :`) || text.startsWith(`${speaker}:`))) {
    issues.push(`${where}: speaker name duplicated inside text`)
  }
  if (GREAT_SAGE.has(speaker)) {
    if (!text.startsWith('Réponse.')) {
      issues.push(`${where}: Great Sage must start with Réponse.`)
    }
    if (/recommandation/i.test(text)) {
      issues.push(`${where}: Great Sage is a coach`)
    }
    if (HINT_LEAK.test(text)) {
      issues.push(`${where}: gameplay hint leaked into Great Sage`)
    }
    return issues
  }
  const first = speaker.split(/[\s-]/)[0] ?? ''
  if (first.length >= 3 && !NAME_BOAST.has(first)) {
    const selfStart = new RegExp(`^${escapeRe(first)}\\s+`, 'i')
    if (selfStart.test(text) && !text.startsWith(`${first}...`) && !text.startsWith(`${first}…`) && !text.startsWith(`${first} !`) && !text.startsWith(`${first}!`)) {
      const rest = text.slice(first.length).trimStart()
      if (SELF_VERB.test(rest)) {
        issues.push(`${where}: self-narration`)
      }
    }
  }
  return issues
}

export function collectDialogueIssues(): string[] {
  const issues: string[] = []
  for (const mission of STORY_MISSIONS) {
    for (const [index, beat] of mission.beats.entries()) {
      const where = `${mission.id}#${index}`
      if (beat.type === 'dialogue') {
        issues.push(...issuesForSpokenLine(beat.speaker, beat.text, `${where} ${beat.speaker}`))
      }
      if (beat.type === 'narration' && beat.text.includes('Falmuth')) {
        issues.push(`${where}: narration uses Falmuth`)
      }
      if (beat.type === 'hint' && beat.text.startsWith('Réponse.')) {
        issues.push(`${where}: Great Sage leaked into hint`)
      }
    }
  }
  for (const row of INTERACTION_TABLE) {
    issues.push(...issuesForSpokenLine(CHARACTERS[row.left.speaker].name, row.left.text, `interaction ${row.a}/${row.b} L`))
    issues.push(...issuesForSpokenLine(CHARACTERS[row.right.speaker].name, row.right.text, `interaction ${row.a}/${row.b} R`))
  }
  for (const id of PLAYABLE_FIGHTERS) {
    const name = CHARACTERS[id].name
    issues.push(...issuesForSpokenLine(name, INTRO_LINE[id], `intro ${id}`))
    issues.push(...issuesForSpokenLine(name, INTRO_REPLY[id], `intro-reply ${id}`))
    issues.push(...issuesForSpokenLine(name, VICTORY_LINE[id], `victory ${id}`))
    issues.push(...issuesForSpokenLine(name, DEFEAT_LINE[id], `defeat ${id}`))
    issues.push(...issuesForSpokenLine(name, ULT_LINE[id], `ult ${id}`))
    issues.push(...issuesForSpokenLine(name, flavorOf(id).quote, `roster ${id}`))
  }
  return issues
}
