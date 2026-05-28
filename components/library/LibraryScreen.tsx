'use client'

import { useState } from 'react'
import { LibraryBar } from '@/components/layout/TopBar'
import DeckThumb from '@/components/decks/DeckThumb'
import NewDeckModal from '@/components/decks/NewDeckModal'
import AccountDropdown from '@/components/layout/AccountDropdown'
import HelpOverlay from '@/components/ui/HelpOverlay'
import type { Palette } from '@/lib/palette'

interface Deck {
  id: string
  title: string
  palette: string
}

interface Props {
  decks: Deck[]
  cardCounts: number[]
  userName: string
  greeting: string
}

export default function LibraryScreen({ decks, cardCounts, userName, greeting }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  const isEmpty = decks.length === 0

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <LibraryBar
        userName={userName}
        onAvatarClick={() => setDropdownOpen(o => !o)}
        onHelpClick={() => setHelpOpen(true)}
      />

      <main className="flex-1 px-9 md:px-[72px] py-10 md:py-14">
        {isEmpty ? (
          <EmptyLibrary onNew={() => setModalOpen(true)} />
        ) : (
          <>
            {/* Header row */}
            <div className="flex items-start justify-between mb-10">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.8px] text-tertiary mb-2">
                  Your library · {decks.length} {decks.length === 1 ? 'deck' : 'decks'}
                </p>
                <h1 className="font-display text-[40px] md:text-[56px] leading-tight text-primary" style={{ letterSpacing: '-0.5px' }}>
                  {greeting}{' '}
                  <em className="text-secondary not-italic" style={{ fontStyle: 'italic' }}>
                    What are we studying?
                  </em>
                </h1>
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-pill bg-primary text-surface font-sans font-500 text-sm shrink-0 mt-2 hover:opacity-90 transition-opacity"
              >
                <span className="text-lg leading-none">+</span>
                New deck
              </button>
            </div>

            {/* Deck grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-12">
              {decks.map((deck, i) => (
                <DeckThumb
                  key={deck.id}
                  id={deck.id}
                  title={deck.title}
                  palette={deck.palette as Palette}
                  cardCount={cardCounts[i] ?? 0}
                />
              ))}

              {/* Ghost new deck slot */}
              <button
                onClick={() => setModalOpen(true)}
                className="flex flex-col items-center justify-center gap-2 rounded-thumb border-2 border-dashed border-divider-strong text-tertiary hover:text-secondary hover:border-secondary transition-colors"
                style={{ width: 220, height: 140 }}
              >
                <span className="text-2xl leading-none">+</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.8px]">New deck</span>
              </button>
            </div>
          </>
        )}
      </main>

      {modalOpen && <NewDeckModal onClose={() => setModalOpen(false)} />}
      {dropdownOpen && (
        <AccountDropdown
          userName={userName}
          onClose={() => setDropdownOpen(false)}
          onHelp={() => { setDropdownOpen(false); setHelpOpen(true) }}
        />
      )}
      {helpOpen && <HelpOverlay onClose={() => setHelpOpen(false)} />}
    </div>
  )
}

function EmptyLibrary({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      {/* Dashed card stack */}
      <div className="relative w-48 h-36 mb-10">
        {[3, 2, 1, 0].map(i => (
          <div
            key={i}
            className="absolute inset-0 rounded-card border-2 border-dashed border-divider-strong flex items-center justify-center"
            style={{ transform: `rotate(${(i - 1.5) * 4}deg)` }}
          >
            {i === 0 && (
              <span className="font-mono text-[9px] uppercase tracking-[1px] text-tertiary">
                Nothing here yet
              </span>
            )}
          </div>
        ))}
      </div>

      <h1 className="font-display text-[36px] md:text-[44px] text-primary mb-3" style={{ letterSpacing: '-0.5px' }}>
        A blank deck.{' '}
        <em className="text-secondary" style={{ fontStyle: 'italic' }}>Ready when you are.</em>
      </h1>
      <p className="font-sans text-secondary text-base mb-8 max-w-xs">
        Create your first deck and start adding cards. Your memory will thank you.
      </p>
      <button
        onClick={onNew}
        className="flex items-center gap-2 px-5 py-3 rounded-pill bg-primary text-surface font-sans font-500 text-sm hover:opacity-90 transition-opacity"
      >
        <span className="text-lg leading-none">+</span>
        Create your first deck
      </button>
    </div>
  )
}
