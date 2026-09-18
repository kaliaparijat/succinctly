'use client'

import MobileDeckRow from '@/components/library/MobileDeckRow'
import MobileLibraryHeader from '@/components/library/MobileLibraryHeader'
import MobileNewDeckRow from '@/components/library/MobileNewDeckRow'
import MobileTabBar from '@/components/library/MobileTabBar'
import type { Palette } from '@/lib/palette'

interface Deck {
  id: string
  title: string
  palette: string
}

interface Props {
  decks: Deck[]
  cardCounts: number[]
  greeting: string
}

export default function MobileLibraryScreen({ decks, cardCounts, greeting }: Props) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <main className="flex-1 px-9 py-10 pb-20">
        <MobileLibraryHeader deckCount={decks.length} greeting={greeting} />

        <div>
          <MobileNewDeckRow existingPalettes={decks.map(deck => deck.palette)} />
          {decks.map((deck, i) => (
            <MobileDeckRow
              key={deck.id}
              id={deck.id}
              title={deck.title}
              palette={deck.palette as Palette}
              cardCount={cardCounts[i] ?? 0}
            />
          ))}
        </div>
      </main>

      <MobileTabBar />
    </div>
  )
}
