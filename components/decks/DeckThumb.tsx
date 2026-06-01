import Link from 'next/link'
import { PALETTES, PAPER_NOISE, stableTilt, type Palette } from '@/lib/palette'

interface Props {
  id: string
  title: string
  palette: Palette
  cardCount: number
  onEdit: () => void
}

export default function DeckThumb({ id, title, palette, cardCount, onEdit }: Props) {
  const { bg, ink } = PALETTES[palette]
  const tilt = stableTilt(title)

  return (
    <div className="group relative w-full" style={{ aspectRatio: '220/140' }}>

      {/* Navigation area covers the entire card */}
      <Link href={`/decks/${id}`} className="absolute inset-0 block">
        <div className="relative w-full h-full">

          {/* Back card — most rotated, darkest */}
          <div
            className="absolute inset-0 rounded-thumb"
            style={{
              background: bg,
              opacity: 0.5,
              transform: `rotate(${tilt + 3}deg)`,
              boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 6px 18px rgba(0,0,0,0.35)',
            }}
          />

          {/* Middle card */}
          <div
            className="absolute inset-0 rounded-thumb"
            style={{
              background: bg,
              opacity: 0.75,
              transform: `rotate(${tilt + 1.5}deg)`,
              boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 6px 18px rgba(0,0,0,0.35)',
            }}
          />

          {/* Front card */}
          <div
            className="absolute inset-0 rounded-thumb overflow-hidden transition-transform duration-200 group-hover:scale-[1.02]"
            style={{
              background: bg,
              transform: `rotate(${tilt}deg)`,
              boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 6px 18px rgba(0,0,0,0.35)',
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ backgroundImage: PAPER_NOISE, mixBlendMode: 'multiply', opacity: 0.5 }}
            />
            <div className="relative h-full flex flex-col justify-between p-4">
              <p
                className="font-display text-[18px] leading-tight"
                style={{ color: ink, letterSpacing: '-0.5px' }}
              >
                {title}
              </p>
              <p
                className="font-mono text-[10px] uppercase"
                style={{ color: ink, opacity: 0.5, letterSpacing: '0.8px' }}
              >
                {cardCount} {cardCount === 1 ? 'card' : 'cards'}
              </p>
            </div>
          </div>

        </div>
      </Link>

      {/* ⋯ options button — hover-only on desktop, always on mobile */}
      <button
        type="button"
        aria-label="Deck options"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit() }}
        className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-opacity md:opacity-0 md:group-hover:opacity-100"
        style={{ background: 'rgba(0,0,0,0.25)' }}
      >
        <span className="font-sans text-[14px] leading-none" style={{ color: ink }}>⋯</span>
      </button>

    </div>
  )
}
