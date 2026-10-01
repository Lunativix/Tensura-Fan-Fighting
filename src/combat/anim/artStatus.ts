/** Runtime detection only. Manual stages are never assigned here. */
export type ArtStatus = 'ready-for-art' | 'art-invalid' | 'art-complete'

/** Manual validation ladder. Never derived automatically. */
export type ArtPipelineStage = ArtStatus | 'integrated' | 'tested' | 'done'

export const AUTO_ART_STATUSES: readonly ArtStatus[] = ['ready-for-art', 'art-invalid', 'art-complete']

export function deriveArtStatus(hasValidSequence: boolean, invalid = false): ArtStatus {
  if (invalid) {
    return 'art-invalid'
  }
  return hasValidSequence ? 'art-complete' : 'ready-for-art'
}

export function artStatusLabel(status: ArtPipelineStage): string {
  switch (status) {
    case 'ready-for-art':
      return 'READY FOR ART'
    case 'art-invalid':
      return 'ART INVALID'
    case 'art-complete':
      return 'ART COMPLETE'
    case 'integrated':
      return 'INTEGRATED'
    case 'tested':
      return 'TESTED'
    case 'done':
      return 'DONE'
  }
}

/** Detection stops at ART COMPLETE. INTEGRATED / TESTED / DONE are human-only. */
export function autoPromoteBlocked(status: ArtStatus): boolean {
  return status === 'art-complete' || status === 'ready-for-art' || status === 'art-invalid'
}
