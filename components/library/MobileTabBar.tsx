import Link from 'next/link'

export default function MobileTabBar() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex z-20"
      style={{
        borderTop: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(10,10,11,0.92)',
        backdropFilter: 'blur(12px)',
        paddingBottom: '6px',
      }}
    >
      <Link
        href="/library"
        className="flex-1 flex flex-col items-center"
        style={{ padding: '9px 0 4px', gap: '3px', color: '#F5F5F7' }}
      >
        <GridIcon active />
        <span className="font-sans text-[10px]">Library</span>
      </Link>
      <Link
        href="/settings"
        className="flex-1 flex flex-col items-center"
        style={{ padding: '9px 0 4px', gap: '3px', color: 'rgba(245,245,247,0.38)' }}
      >
        <GearIcon />
        <span className="font-sans text-[10px]">Settings</span>
      </Link>
    </nav>
  )
}

function GridIcon({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth={active ? 2 : 1.6} />
      <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth={active ? 2 : 1.6} />
      <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth={active ? 2 : 1.6} />
      <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth={active ? 2 : 1.6} />
    </svg>
  )
}

function GearIcon({ active }: { active?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={active ? 2 : 1.6} />
      <path
        d="M19.4 13a7.97 7.97 0 0 0 0-2l2.1-1.6-2-3.4-2.5 1a8 8 0 0 0-1.7-1l-.4-2.6h-4l-.4 2.6a8 8 0 0 0-1.7 1l-2.5-1-2 3.4L6.4 11a7.97 7.97 0 0 0 0 2l-2.1 1.6 2 3.4 2.5-1a8 8 0 0 0 1.7 1l.4 2.6h4l.4-2.6a8 8 0 0 0 1.7-1l2.5 1 2-3.4L19.4 13Z"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
