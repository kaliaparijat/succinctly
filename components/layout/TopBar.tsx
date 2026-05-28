import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'

// Succinctly logo mark — a rotated card
function LogoMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect
        x="2" y="2" width="14" height="14" rx="2"
        stroke="#F5F5F7" strokeWidth="1.5"
        transform="rotate(12 9 9)"
      />
    </svg>
  )
}

function QuestionButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-8 h-8 rounded-btn border border-divider text-secondary hover:text-primary hover:border-divider-strong transition-colors font-mono text-[12px]"
      aria-label="Keyboard shortcuts"
    >
      ?
    </button>
  )
}

// ── Variant: Library ──────────────────────────────────────────────────────────
interface LibraryBarProps {
  userName: string
  onAvatarClick: () => void
  onHelpClick: () => void
}

export function LibraryBar({ userName, onAvatarClick, onHelpClick }: LibraryBarProps) {
  return (
    <header className="flex items-center justify-between px-7 h-16 border-b border-divider shrink-0">
      <Link href="/library" className="flex items-center gap-2 text-primary hover:text-secondary transition-colors">
        <LogoMark />
        <span className="font-sans font-500 text-[14px] tracking-tight">Succinctly</span>
      </Link>
      <div className="flex items-center gap-3">
        <QuestionButton onClick={onHelpClick} />
        <Avatar name={userName} onClick={onAvatarClick} />
      </div>
    </header>
  )
}

// ── Variant: Viewer ───────────────────────────────────────────────────────────
interface ViewerBarProps {
  deckName: string
  current: number
  total: number
  onHelpClick: () => void
}

export function ViewerBar({ deckName, current, total, onHelpClick }: ViewerBarProps) {
  return (
    <header className="flex items-center justify-between px-7 h-16 border-b border-divider shrink-0">
      <div className="flex items-center gap-3">
        <Link href="/library" className="text-secondary hover:text-primary text-sm font-sans transition-colors">
          ← Library
        </Link>
        <span className="text-divider-strong">|</span>
        <span className="text-primary text-sm font-sans truncate max-w-[200px]">{deckName}</span>
        <span className="font-mono text-[11px] text-tertiary uppercase tracking-[0.8px]">
          {current} / {total}
        </span>
      </div>
      <QuestionButton onClick={onHelpClick} />
    </header>
  )
}

// ── Variant: Create card ──────────────────────────────────────────────────────
interface CreateBarProps {
  deckId: string
  deckName: string
}

export function CreateBar({ deckId, deckName }: CreateBarProps) {
  return (
    <header className="flex items-center px-7 h-16 border-b border-divider shrink-0">
      <Link href={`/decks/${deckId}`} className="text-secondary hover:text-primary text-sm font-sans transition-colors">
        ←
      </Link>
      <span className="ml-3 text-primary text-sm font-sans">
        {deckName}
        <span className="text-tertiary"> · New card</span>
      </span>
    </header>
  )
}

// ── Variant: Settings ─────────────────────────────────────────────────────────
interface SettingsBarProps {
  userName: string
  onAvatarClick: () => void
}

export function SettingsBar({ userName, onAvatarClick }: SettingsBarProps) {
  return (
    <header className="flex items-center justify-between px-7 h-16 border-b border-divider shrink-0">
      <div className="flex items-center gap-3">
        <Link href="/library" className="text-secondary hover:text-primary text-sm font-sans transition-colors">
          ←
        </Link>
        <span className="text-primary text-sm font-sans font-500">Settings</span>
      </div>
      <Avatar name={userName} onClick={onAvatarClick} />
    </header>
  )
}
