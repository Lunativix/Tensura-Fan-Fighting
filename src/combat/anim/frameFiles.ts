/** Canonical frame filenames. Gameplay never interpolates missing numbers. */
export const FRAME_NAME_RE = /^(?:frame[_-])?(\d+)\.(?:png|webp)$/i
export const SHEET_NAMES = new Set(['sheet.png', 'spritesheet.png', 'atlas.png'])

export interface ParsedFrameFile {
  index: number
  name: string
}

export function parseFrameFileName(name: string): ParsedFrameFile | null {
  if (SHEET_NAMES.has(name.toLowerCase())) {
    return null
  }
  const match = name.match(FRAME_NAME_RE)
  if (!match) {
    return null
  }
  return { index: Number(match[1]), name }
}

export function sortFrameFiles(names: readonly string[]): ParsedFrameFile[] {
  return names
    .map(parseFrameFileName)
    .filter((item): item is ParsedFrameFile => item !== null)
    .sort((a, b) => a.index - b.index || a.name.localeCompare(b.name, 'en'))
}

export function missingFrameGaps(frames: readonly ParsedFrameFile[]): number[] {
  if (frames.length === 0) {
    return []
  }
  const start = frames[0]!.index
  const seen = new Set(frames.map((item) => item.index))
  const last = frames[frames.length - 1]!.index
  const missing: number[] = []
  for (let i = start; i <= last; i += 1) {
    if (!seen.has(i)) {
      missing.push(i)
    }
  }
  return missing
}

export function duplicateFrameIndexes(frames: readonly ParsedFrameFile[]): number[] {
  const counts = new Map<number, number>()
  for (const frame of frames) {
    counts.set(frame.index, (counts.get(frame.index) ?? 0) + 1)
  }
  return [...counts.entries()].filter(([, n]) => n > 1).map(([index]) => index)
}

export function canonicalFrameName(index: number): string {
  return `${String(index).padStart(3, '0')}.png`
}
