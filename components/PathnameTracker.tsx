'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { reportPathname } from '@/lib/viewTransition'

// Renders nothing — just reports pathname changes so navigateWithTransition
// can detect when a destination route has actually rendered.
export default function PathnameTracker() {
  const pathname = usePathname()
  useEffect(() => {
    reportPathname(pathname)
  }, [pathname])
  return null
}
