import Link from 'next/link'
import { PALETTES, PAPER_NOISE, stableTilt, type Palette } from '@/lib/palette'

interface Props {
  id: string
  title: string
  palette: Palette
  cardCount: number
}

export default function DeckThumb({ id, title, palette, cardCount }: Props) {
  const { bg, ink } = PALETTES[palette]
  const tilt = stableTilt(title)

  return (
    <Link href={`/decks/${id}`} className="group block" style={{ width: 220, height: 140 }}>
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
          {/* Paper texture */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: PAPER_NOISE, mixBlendMode: 'multiply', opacity: 0.5 }}
          />

          {/* Content */}
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
  )
}
