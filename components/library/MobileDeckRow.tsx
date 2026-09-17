'use client'

import { useRouter } from 'next/navigation'
import { navigateWithTransition } from '@/lib/viewTransition'
import { PALETTES, PAPER_NOISE, type Palette } from '@/lib/palette'

interface Props {
  id: string
  title: string
  palette: Palette
  cardCount: number
}

export default function MobileDeckRow({ id, title, palette, cardCount }: Props) {
  const router = useRouter()
  const { bg, ink } = PALETTES[palette]

  return (
    <button
      type="button"
      onClick={() => navigateWithTransition(router, `/decks/${id}`, 'forward')}
      className="relative w-full text-left rounded-[16px] overflow-hidden mb-[10px]"
      style={{
        background: bg,
        padding: '18px 20px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.25), 0 4px 14px rgba(0,0,0,0.25)',
        viewTransitionName: `card-${id}`,
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: PAPER_NOISE, mixBlendMode: 'multiply', opacity: 0.5 }}
      />
      <div className="relative">
        <p
          className="font-display text-[22px] leading-[1.1]"
          style={{ color: ink, letterSpacing: '-0.3px' }}
        >
          {title}
        </p>
        <p
          className="font-mono text-[10px] uppercase mt-1"
          style={{ color: ink, opacity: 0.55, letterSpacing: '0.6px' }}
        >
          {cardCount} {cardCount === 1 ? 'card' : 'cards'}
        </p>
      </div>
    </button>
  )
}
