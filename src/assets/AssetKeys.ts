export const AssetKeys = {
  pixel: 'core-pixel',
  missing: 'core-missing',
  particle: 'core-particle',
} as const

export type AssetKey = (typeof AssetKeys)[keyof typeof AssetKeys]
