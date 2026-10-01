/**
 * Validate drop-in skill / normal folders. Does not generate PNG.
 *
 *   npm run validate-sprites
 */
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('public/sprites')
const outFile = path.resolve('src/combat/anim/artValidationReport.ts')
const registryFile = path.resolve('src/combat/anim/registry.ts')

const SEQ = /^(?:frame[_-])?(\d+)\.(?:png|webp)$/i
const SHEETS = new Set(['sheet.png', 'spritesheet.png', 'atlas.png'])

function parseDefs(source) {
  const defs = []
  const re = /def\('(\w+)', '([^']+)', '([^']+)', '([^']+)', (\d)\)/g
  for (const match of source.matchAll(re)) {
    defs.push({
      fighterId: match[1],
      attackId: match[2],
      animId: match[3],
      skillName: match[4],
      slot: Number(match[5]),
    })
  }
  return defs
}

function pngSize(buf) {
  if (buf.length < 24 || buf[0] !== 0x89 || buf[1] !== 0x50) {
    return null
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

function listSequence(dir) {
  if (!fs.existsSync(dir)) {
    return []
  }
  const frames = []
  for (const name of fs.readdirSync(dir)) {
    if (SHEETS.has(name.toLowerCase())) {
      continue
    }
    const match = name.match(SEQ)
    if (match) {
      frames.push({ index: Number(match[1]), name })
    }
  }
  frames.sort((a, b) => a.index - b.index || a.name.localeCompare(b.name, 'en'))
  return frames
}

function inspectFolder(dir) {
  const issues = []
  const warnings = []
  if (!fs.existsSync(dir)) {
    return { status: 'READY FOR ART', frames: 0, issues: ['MISSING_FOLDER'], warnings, width: 0, height: 0, type: 'sequence' }
  }
  let meta = {}
  const metaPath = path.join(dir, 'anim.json')
  if (fs.existsSync(metaPath)) {
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
    } catch {
      issues.push('BROKEN_METADATA')
    }
  } else {
    warnings.push('MISSING_METADATA')
  }
  if (meta.projectileInSprite === true) {
    issues.push('PROJECTILE_IN_SPRITE')
  }

  const sheetName = ['sheet.png', 'spritesheet.png', meta.sheet].filter(Boolean).find((name) => fs.existsSync(path.join(dir, name)))
  if (meta.type === 'spritesheet' || sheetName) {
    if (!sheetName) {
      issues.push('MISSING_SHEET')
      return { status: 'ART INVALID', frames: 0, issues, warnings, width: 0, height: 0, type: 'spritesheet' }
    }
    if (!Number.isFinite(meta.frameWidth) || !Number.isFinite(meta.frameHeight)) {
      issues.push('INVALID_SHEET_SIZE')
    }
    const count = Number(meta.frames ?? meta.frameCount ?? 0)
    if (count <= 0) {
      issues.push('INVALID_SHEET_FRAMES')
    }
    const buf = fs.readFileSync(path.join(dir, sheetName))
    const size = pngSize(buf)
    if (!size) {
      issues.push('BROKEN_PNG')
    }
    const status = issues.length > 0 ? 'ART INVALID' : 'ART COMPLETE'
    return { status, frames: count, issues, warnings, width: size?.width ?? 0, height: size?.height ?? 0, type: 'spritesheet' }
  }

  const frames = listSequence(dir)
  if (frames.length === 0) {
    return { status: 'READY FOR ART', frames: 0, issues, warnings, width: 0, height: 0, type: 'sequence' }
  }
  const start = frames[0].index
  const last = frames[frames.length - 1].index
  const seen = new Set()
  for (const frame of frames) {
    if (seen.has(frame.index)) {
      issues.push(`DUPLICATE_FRAME_${String(frame.index).padStart(3, '0')}`)
    }
    seen.add(frame.index)
  }
  for (let i = start; i <= last; i += 1) {
    if (!seen.has(i)) {
      issues.push(`MISSING_FRAME_${String(i).padStart(3, '0')}`)
    }
  }
  let width = 0
  let height = 0
  for (const frame of frames) {
    const buf = fs.readFileSync(path.join(dir, frame.name))
    const size = pngSize(buf)
    if (!size) {
      issues.push(`BROKEN_PNG_${frame.name}`)
      continue
    }
    if (width === 0) {
      width = size.width
      height = size.height
    } else if (size.width !== width || size.height !== height) {
      issues.push('INVALID_CANVAS_SIZE')
    }
    const corner = buf[25]
    if (size.width > 8 && buf.length > 100 && corner !== undefined) {
      /* IHDR parsed; opaque-fill warning is best-effort via alpha byte if present later */
    }
  }
  if (frames[0].name.toLowerCase().endsWith('.png')) {
    const sample = fs.readFileSync(path.join(dir, frames[0].name))
    const colorType = sample.length > 25 ? sample[25] : 6
    if (colorType === 2) {
      warnings.push('ART_WARNING_BACKGROUND')
    }
  }
  const status = issues.length > 0 ? 'ART INVALID' : 'ART COMPLETE'
  return { status, frames: frames.length, issues, warnings, width, height, type: 'sequence' }
}

const FIGHTERS = [
  'rimuru', 'milim', 'diablo', 'benimaru', 'shion', 'veldora',
  'hinata', 'guy', 'shuna', 'souei', 'hakurou',
]
const NORMAL_SUFFIXES = [
  'light_1', 'light_2', 'light_3', 'medium', 'heavy', 'air_light', 'air_heavy', 'down_light',
]

function bestSkillFolder(fighterId, animId) {
  const candidates = [path.join(root, fighterId, animId)]
  const fighterDir = path.join(root, fighterId)
  if (fs.existsSync(fighterDir)) {
    for (const child of fs.readdirSync(fighterDir, { withFileTypes: true })) {
      if (!child.isDirectory() || child.name.startsWith('_') || child.name === 'normals') {
        continue
      }
      candidates.push(path.join(fighterDir, child.name, animId))
    }
  }
  let best = inspectFolder(candidates[0])
  let folder = candidates[0]
  for (const candidate of candidates) {
    const report = inspectFolder(candidate)
    if (report.frames > best.frames) {
      best = report
      folder = candidate
    }
  }
  return { ...best, folder: path.relative(path.resolve('.'), folder).replaceAll('\\', '/') }
}

const skills = parseDefs(fs.readFileSync(registryFile, 'utf8'))
const rows = []

for (const def of skills) {
  const report = bestSkillFolder(def.fighterId, def.animId)
  rows.push({
    kind: def.slot === 4 ? 'ultimate' : 'skill',
    fighterId: def.fighterId,
    id: def.animId,
    skillName: def.skillName,
    folder: report.folder,
    status: report.status,
    frames: report.frames,
    issues: report.issues,
    warnings: report.warnings,
    width: report.width,
    height: report.height,
    type: report.type,
  })
}

for (const fighterId of FIGHTERS) {
  for (const suffix of NORMAL_SUFFIXES) {
    const animId = `${fighterId}_${suffix}`
    const primary = path.join(root, fighterId, animId)
    const alt = path.join(root, fighterId, 'normals', animId)
    const report = inspectFolder(fs.existsSync(primary) ? primary : alt)
    const altReport = inspectFolder(alt)
    const chosen = report.frames > 0 ? report : altReport
    rows.push({
      kind: 'normal',
      fighterId,
      id: animId,
      skillName: animId,
      folder: `public/sprites/${fighterId}/${animId}`,
      ...chosen,
    })
  }
}

const skillsRows = rows.filter((row) => row.kind === 'skill' || row.kind === 'ultimate')
const skillComplete = skillsRows.filter((row) => row.status === 'ART COMPLETE').length
const ultComplete = rows.filter((row) => row.kind === 'ultimate' && row.status === 'ART COMPLETE').length
const normalComplete = rows.filter((row) => row.kind === 'normal' && row.status === 'ART COMPLETE').length

const summary = {
  skillsComplete: skillComplete,
  skillsTotal: 55,
  normalsComplete: normalComplete,
  normalsTotal: 88,
  ultimatesComplete: ultComplete,
  ultimatesTotal: 11,
  invalid: rows.filter((row) => row.status === 'ART INVALID').length,
}

const body = `/** Generated by scripts/validate-sprites.mjs. Do not edit by hand. */
export interface ArtValidationRow {
  kind: 'skill' | 'ultimate' | 'normal'
  fighterId: string
  id: string
  skillName: string
  folder: string
  status: string
  frames: number
  issues: string[]
  warnings: string[]
  width: number
  height: number
  type: string
}

export const ART_VALIDATION_SUMMARY = ${JSON.stringify(summary, null, 2)} as const

export const ART_VALIDATION_ROWS: ArtValidationRow[] = ${JSON.stringify(rows, null, 2)}
`

fs.writeFileSync(outFile, body)

const lines = [
  `[validate-sprites] SKILLS ${skillComplete} / 55 ART COMPLETE`,
  `[validate-sprites] NORMALS ${normalComplete} / 88 ART COMPLETE`,
  `[validate-sprites] ULTIMATES ${ultComplete} / 11 ART COMPLETE`,
  `[validate-sprites] INVALID ${summary.invalid}`,
]
for (const row of rows.filter((item) => item.status === 'ART INVALID').slice(0, 20)) {
  lines.push(`  ${row.id} ${row.issues.join(', ')}`)
}
console.info(lines.join('\n'))
