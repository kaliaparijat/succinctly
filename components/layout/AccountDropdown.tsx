'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { signOut } from '@/app/actions/auth'

interface Props {
  userName: string
  onClose: () => void
  onHelp: () => void
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function AccountDropdown({ userName, onClose, onHelp }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="fixed top-[68px] right-6 z-50 w-[260px] rounded-[12px] border border-divider-strong overflow-hidden"
      style={{ background: '#111113', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-divider">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-mono text-[13px] font-500 shrink-0"
          style={{ background: '#F5D96B', color: '#3A2E0A' }}
        >
          {initials(userName)}
        </div>
        <span className="font-sans text-sm text-primary truncate">{userName}</span>
      </div>

      {/* Menu rows */}
      <div className="p-[6px]">
        <Row onClick={onClose} href="/settings">Settings</Row>
        <Row onClick={onHelp}>
          Keyboard shortcuts
          <span className="ml-auto font-mono text-[10px] px-1.5 py-0.5 rounded border border-divider-strong text-tertiary">?</span>
        </Row>
        <div className="border-t border-divider my-1" />
        <form action={signOut}>
          <button
            type="submit"
            className="w-full flex items-center px-[10px] py-2 rounded-[7px] text-sm font-sans text-left transition-colors hover:bg-[rgba(255,80,80,0.08)]"
            style={{ color: '#ff9999' }}
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}

function Row({ children, onClick, href }: { children: React.ReactNode; onClick?: () => void; href?: string }) {
  const cls = "flex items-center px-[10px] py-2 rounded-[7px] text-sm font-sans text-secondary hover:bg-surface-hover hover:text-primary transition-colors cursor-pointer w-full text-left"
  if (href) return <Link href={href} onClick={onClick} className={cls}>{children}</Link>
  return <button type="button" onClick={onClick} className={cls}>{children}</button>
}
