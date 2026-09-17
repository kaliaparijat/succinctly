'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import InlineEditableField from '@/components/ui/InlineEditableField'
import { navigateWithTransition } from '@/lib/viewTransition'
import { createDeck } from '@/app/actions/decks'
import { nextPalette } from '@/lib/palette'

interface Props {
  existingPalettes: string[]
}

export default function MobileNewDeckRow({ existingPalettes }: Props) {
  const [editing, setEditing] = useState(false)
  const router = useRouter()

  async function handleConfirm(trimmedName: string) {
    const formData = new FormData()
    formData.set('title', trimmedName)
    formData.set('palette', nextPalette(existingPalettes))
    const deck = await createDeck(formData)
    navigateWithTransition(router, `/decks/${deck.id}/cards/new`, 'forward')
  }

  if (editing) {
    return (
      <div
        className="w-full rounded-[16px] mb-[10px]"
        style={{ padding: '16px 20px', border: '1.5px dashed rgba(255,255,255,0.08)' }}
      >
        <InlineEditableField
          placeholder="Deck name"
          ariaLabel="New deck name"
          onConfirm={handleConfirm}
          onCancel={() => setEditing(false)}
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="flex items-center gap-[10px] w-full rounded-[16px] mb-[10px] text-left"
      style={{ padding: '16px 20px', border: '1.5px dashed rgba(255,255,255,0.08)', background: 'transparent' }}
    >
      <span
        className="flex items-center justify-center w-[30px] h-[30px] rounded-full shrink-0"
        style={{ background: '#17171A', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <span aria-hidden className="text-[14px] leading-none" style={{ color: 'rgba(245,245,247,0.6)' }}>+</span>
      </span>
      <span className="font-sans text-[14px] font-500" style={{ color: 'rgba(245,245,247,0.6)' }}>
        New deck
      </span>
    </button>
  )
}
