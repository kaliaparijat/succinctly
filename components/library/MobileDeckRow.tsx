'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { navigateWithTransition } from '@/lib/viewTransition'
import { updateDeck } from '@/app/actions/decks'
import { PALETTES, PAPER_NOISE, type Palette } from '@/lib/palette'
import InlineEditableField from '@/components/ui/InlineEditableField'

interface Props {
  id: string
  title: string
  palette: Palette
  cardCount: number
}

export default function MobileDeckRow({ id, title, palette, cardCount }: Props) {
  const [renaming, setRenaming] = useState(false)
  const router = useRouter()
  const { bg, ink } = PALETTES[palette]

  function handleOpen() {
    if (renaming) return
    navigateWithTransition(router, `/decks/${id}`, 'forward')
  }

  async function handleRenameConfirm(trimmedTitle: string) {
    const formData = new FormData()
    formData.set('id', id)
    formData.set('title', trimmedTitle)
    formData.set('palette', palette)
    await updateDeck(undefined, formData)
    setRenaming(false)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleOpen() }}
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
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          {renaming ? (
            <InlineEditableField
              initialValue={title}
              ariaLabel="Rename deck"
              onConfirm={handleRenameConfirm}
              onCancel={() => setRenaming(false)}
            />
          ) : (
            <>
              <p
                className="font-display text-[22px] leading-[1.1] truncate"
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
            </>
          )}
        </div>

        {!renaming && (
          <button
            type="button"
            aria-label="Rename deck"
            onClick={e => { e.stopPropagation(); setRenaming(true) }}
            className="shrink-0 flex items-center justify-center w-[30px] h-[30px] rounded-full"
            style={{ background: `${ink}14` }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"
                stroke={ink}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
