'use client'

import { useState } from 'react'
import AuthForm from './AuthForm'

const PAPER_NOISE = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='4'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.06 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`

export default function AuthCard({ next }: { next: string }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const flipped = mode === 'signup'

  return (
    <div className="w-full max-w-[380px]" style={{ perspective: '1200px' }}>
      {/* 3D flip container */}
      <div
        className="relative w-full"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 480ms cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '540px',
        }}
      >
        {/* Front face — sign in */}
        <div
          className="absolute inset-0 rounded-card overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: '#F5D96B',
            boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 24px 60px rgba(0,0,0,0.4)',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: PAPER_NOISE, mixBlendMode: 'multiply', opacity: 0.5 }}
          />
          <AuthForm mode="signin" next={next} onToggle={() => setMode('signup')} />
        </div>

        {/* Back face — sign up */}
        <div
          className="absolute inset-0 rounded-card overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: '#F5D96B',
            boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 24px 60px rgba(0,0,0,0.4)',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: PAPER_NOISE, mixBlendMode: 'multiply', opacity: 0.5 }}
          />
          <AuthForm mode="signup" next={next} onToggle={() => setMode('signin')} />
        </div>
      </div>
    </div>
  )
}
