'use client'

import DesktopLibraryScreen from '@/components/library/DesktopLibraryScreen'
import MobileLibraryScreen from '@/components/library/MobileLibraryScreen'
import { useIsMobile } from '@/hooks/useIsMobile'

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
  const isMobile = useIsMobile()

  return isMobile
    ? <MobileLibraryScreen decks={decks} cardCounts={cardCounts} greeting={greeting} />
    : <DesktopLibraryScreen decks={decks} cardCounts={cardCounts} userName={userName} greeting={greeting} />
}
