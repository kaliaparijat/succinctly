interface Props {
  deckCount: number
  greeting: string
}

export default function MobileLibraryHeader({ deckCount, greeting }: Props) {
  return (
    <div style={{ padding: '4px 0 14px' }}>
      <div className="flex items-center" style={{ gap: '8px', marginBottom: '18px' }}>
        <span
          aria-hidden="true"
          style={{
            width: '14px',
            height: '18px',
            background: '#F5F5F7',
            borderRadius: '2px',
            transform: 'rotate(-6deg)',
            display: 'inline-block',
          }}
        />
        <span className="font-display text-[17px]" style={{ letterSpacing: '-0.2px', color: '#F5F5F7' }}>
          Succinctly
        </span>
      </div>

      <p
        className="font-mono text-[10px] uppercase"
        style={{ letterSpacing: '0.8px', color: 'rgba(245,245,247,0.38)', marginBottom: '6px' }}
      >
        Your library · {deckCount} {deckCount === 1 ? 'deck' : 'decks'}
      </p>

      <h1
        className="font-display"
        style={{ fontSize: '28px', fontWeight: 400, letterSpacing: '-0.5px', lineHeight: 1.08, color: '#F5F5F7' }}
      >
        {greeting}{' '}
        <em className="not-italic" style={{ fontStyle: 'italic', color: 'rgba(245,245,247,0.6)' }}>
          What are we studying?
        </em>
      </h1>
    </div>
  )
}
