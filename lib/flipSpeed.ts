export const FLIP_MS = { slow: 570, normal: 380, fast: 190 } as const

export function resolveFlipDuration(flipSpeed?: 'slow' | 'normal' | 'fast'): number {
  return FLIP_MS[flipSpeed ?? 'normal']
}
