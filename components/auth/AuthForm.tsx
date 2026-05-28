'use client'

import { useActionState } from 'react'
import { signInWithEmail, signUpWithEmail } from '@/app/actions/auth'

const INK = '#3A2E0A'

type Mode = 'signin' | 'signup'
type State = { error?: string } | null

export default function AuthForm({ mode, next, onToggle }: { mode: Mode; next: string; onToggle: () => void }) {
  const action = mode === 'signin' ? signInWithEmail : signUpWithEmail
  const [state, formAction, pending] = useActionState<State, FormData>(action, null)

  return (
    <div className="flex flex-col h-full p-8 md:p-10">
      {/* Header */}
      <div className="mb-7">
        <p className="font-mono text-[11px] uppercase tracking-[0.8px] opacity-50 mb-2" style={{ color: INK }}>
          {mode === 'signin' ? 'Welcome back' : 'Get started'}
        </p>
        <h1 className="font-display text-[26px] leading-tight" style={{ color: INK }}>
          {mode === 'signin' ? 'The deck is where\nyou left it.' : 'One deck,\nthen another.'}
        </h1>
      </div>

      {/* Email/password form */}
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="next" value={next} />
        {mode === 'signup' && (
          <input
            name="name"
            type="text"
            placeholder="Your name"
            required
            className="w-full px-4 py-3 rounded-btn text-sm font-sans outline-none placeholder:opacity-40 transition-colors"
            style={{
              background: 'rgba(58,46,10,0.08)',
              color: INK,
              border: `1.5px solid rgba(58,46,10,0.2)`,
            }}
          />
        )}

        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="w-full px-4 py-3 rounded-btn text-sm font-sans outline-none placeholder:opacity-40 transition-colors"
          style={{
            background: 'rgba(58,46,10,0.08)',
            color: INK,
            border: `1.5px solid rgba(58,46,10,0.2)`,
          }}
        />

        <div className="relative">
          <input
            name="password"
            type="password"
            placeholder="Password"
            required
            className="w-full px-4 py-3 rounded-btn text-sm font-sans outline-none placeholder:opacity-40 transition-colors"
            style={{
              background: 'rgba(58,46,10,0.08)',
              color: INK,
              border: `1.5px solid rgba(58,46,10,0.2)`,
            }}
          />
          {mode === 'signin' && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-sans opacity-50 hover:opacity-80 transition-opacity"
              style={{ color: INK }}
            >
              Forgot?
            </button>
          )}
        </div>

        {state?.error && (
          <p className="text-[12px] font-sans" style={{ color: '#c0392b' }}>
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full py-3 px-4 rounded-btn text-sm font-sans font-500 transition-opacity mt-1"
          style={{ background: INK, color: '#F5D96B', opacity: pending ? 0.6 : 1 }}
        >
          {pending
            ? (mode === 'signin' ? 'Signing in…' : 'Creating account…')
            : (mode === 'signin' ? 'Sign in' : 'Create account')}
        </button>
      </form>

      {/* Toggle */}
      <p className="mt-auto pt-6 text-center text-[12px] font-sans opacity-50" style={{ color: INK }}>
        {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
        <button
          type="button"
          onClick={onToggle}
          className="underline opacity-100 font-500 hover:opacity-80 transition-opacity"
          style={{ color: INK }}
        >
          {mode === 'signin' ? 'Sign up' : 'Sign in'}
        </button>
      </p>
    </div>
  )
}
