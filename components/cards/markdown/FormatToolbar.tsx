import type { FormatKind } from '@/lib/applyFormat'

interface Props {
  onFmt: (kind: FormatKind) => void
  size?: number
  gap?: number
  color?: string
}

const BUTTONS: { kind: FormatKind; title: string; icon: React.ReactNode }[] = [
  { kind: 'bold', title: 'Bold ⌘B', icon: <span className="font-sans font-700 text-[13px]">B</span> },
  { kind: 'italic', title: 'Italic ⌘I', icon: <span className="font-display italic text-[16px]">I</span> },
  {
    kind: 'code',
    title: 'Code',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 8l-4 4 4 4" />
        <path d="M16 8l4 4-4 4" />
        <path d="M14 5l-4 14" />
      </svg>
    ),
  },
  {
    kind: 'math',
    title: 'Math',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 5H6l6 7-6 7h12" />
      </svg>
    ),
  },
  {
    kind: 'list',
    title: 'List',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 6h11" />
        <path d="M9 12h11" />
        <path d="M9 18h11" />
        <path d="M4.5 6h.01" />
        <path d="M4.5 12h.01" />
        <path d="M4.5 18h.01" />
      </svg>
    ),
  },
]

export default function FormatToolbar({ onFmt, size = 26, gap = 2, color }: Props) {
  return (
    <div className="flex items-center" style={{ gap }}>
      {BUTTONS.map(({ kind, title, icon }) => (
        <button
          key={kind}
          type="button"
          title={title}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onFmt(kind)}
          className="flex items-center justify-center rounded-[7px] border-none bg-transparent cursor-pointer"
          style={{ width: size, height: size, color }}
        >
          {icon}
        </button>
      ))}
    </div>
  )
}
