export type Palette =
  | 'butter' | 'sky' | 'coral' | 'mint'
  | 'lilac' | 'paper' | 'terracotta' | 'sage'

export const PALETTES: Record<Palette, { bg: string; ink: string; label: string }> = {
  butter:     { bg: '#F5D96B', ink: '#3A2E0A', label: 'Butter' },
  sky:        { bg: '#A8C8E8', ink: '#0F2940', label: 'Sky' },
  coral:      { bg: '#F2A68F', ink: '#3A1509', label: 'Coral' },
  mint:       { bg: '#B8DFC4', ink: '#0F3320', label: 'Mint' },
  lilac:      { bg: '#D4BFE8', ink: '#2C1840', label: 'Lilac' },
  paper:      { bg: '#F0E9DC', ink: '#2A2418', label: 'Paper' },
  terracotta: { bg: '#D98A6B', ink: '#3A1509', label: 'Terracotta' },
  sage:       { bg: '#C5D4B0', ink: '#1F2B10', label: 'Sage' },
}

export const PAPER_NOISE = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='4'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.06 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`

/** Stable tilt in degrees, hashed from a string. Range: -0.6 to +0.6 */
export function stableTilt(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  }
  return ((Math.abs(h) % 100) / 100) * 1.2 - 0.6
}
