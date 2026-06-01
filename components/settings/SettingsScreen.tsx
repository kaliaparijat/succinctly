'use client'

import { useState, useActionState } from 'react'
import { SettingsBar } from '@/components/layout/TopBar'
import AccountDropdown from '@/components/layout/AccountDropdown'
import { updateProfile, updatePreferences } from '@/app/actions/profiles'
import type { ProfileState } from '@/app/actions/profiles'
import type { Preferences } from '@/lib/data/profiles'

interface Props {
  userName: string
  preferences: Preferences
}

type Tab = 'profile' | 'preferences'

export default function SettingsScreen({ userName, preferences }: Props) {
  const [tab, setTab] = useState<Tab>('profile')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const [profileState, profileAction, profilePending] = useActionState<ProfileState, FormData>(
    updateProfile, null
  )
  const [prefState, prefAction, prefPending] = useActionState<ProfileState, FormData>(
    updatePreferences, null
  )

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <SettingsBar
        userName={userName}
        onAvatarClick={() => setDropdownOpen(o => !o)}
      />

      {/* Tab strip */}
      <div className="px-9 md:px-[72px] border-b border-divider">
        <div className="flex gap-7">
          {(['profile', 'preferences'] as Tab[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`py-3.5 text-sm font-sans border-b-2 transition-colors capitalize -mb-px ${
                tab === t
                  ? 'border-primary text-primary'
                  : 'border-transparent text-secondary hover:text-primary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 px-9 md:px-[72px] py-10">
        <div className="max-w-[440px]">

          {/* ── Profile tab ─────────────────────────────────────────── */}
          {tab === 'profile' && (
            <form action={profileAction} className="flex flex-col gap-6">
              <div>
                <label className="block">
                  <span className="font-mono text-[11px] uppercase tracking-[0.8px] text-tertiary block mb-2">
                    Display name
                  </span>
                  <input
                    name="name"
                    defaultValue={userName !== 'U' ? userName : ''}
                    placeholder="Your name"
                    autoComplete="name"
                    className="w-full bg-surface-card border border-divider rounded-btn px-4 py-3 text-sm font-sans text-primary placeholder:text-tertiary focus:outline-none focus:border-divider-strong transition-colors"
                  />
                </label>
              </div>

              <div className="flex items-center gap-4">
                <SaveButton pending={profilePending} success={'success' in (profileState ?? {})} />
                {'error' in (profileState ?? {}) && (
                  <p className="text-[12px] font-sans text-red-400">
                    {(profileState as { error: string }).error}
                  </p>
                )}
              </div>
            </form>
          )}

          {/* ── Preferences tab ──────────────────────────────────────── */}
          {tab === 'preferences' && (
            <form action={prefAction} className="flex flex-col gap-8">

              {/* Flip speed */}
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.8px] text-tertiary mb-3">
                  Flip speed
                </p>
                <div className="flex gap-2">
                  {(['slow', 'normal', 'fast'] as const).map(speed => (
                    <label key={speed} className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="flipSpeed"
                        value={speed}
                        defaultChecked={(preferences.flipSpeed ?? 'normal') === speed}
                        className="sr-only peer"
                      />
                      <span className="block text-center py-2.5 text-sm font-sans text-secondary border border-divider rounded-btn peer-checked:text-primary peer-checked:border-divider-strong transition-colors capitalize select-none">
                        {speed}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-col divide-y divide-divider border-t border-b border-divider">
                <ToggleRow
                  name="tilt"
                  label="Card tilt"
                  description="Slight random angle on the study card"
                  defaultChecked={preferences.tilt !== false}
                />
                <ToggleRow
                  name="hints"
                  label="Keyboard hints"
                  description="Show shortcut labels during study"
                  defaultChecked={preferences.hints !== false}
                />
              </div>

              <div className="flex items-center gap-4">
                <SaveButton pending={prefPending} success={'success' in (prefState ?? {})} label="Save preferences" />
                {'error' in (prefState ?? {}) && (
                  <p className="text-[12px] font-sans text-red-400">
                    {(prefState as { error: string }).error}
                  </p>
                )}
              </div>
            </form>
          )}

        </div>
      </main>

      {dropdownOpen && (
        <AccountDropdown
          userName={userName}
          onClose={() => setDropdownOpen(false)}
          onHelp={() => setDropdownOpen(false)}
        />
      )}
    </div>
  )
}

function SaveButton({
  pending,
  success,
  label = 'Save',
}: {
  pending: boolean
  success: boolean
  label?: string
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2.5 bg-primary text-surface text-sm font-sans font-500 rounded-btn hover:bg-primary/90 disabled:opacity-50 transition-colors"
    >
      {pending ? 'Saving…' : success ? 'Saved ✓' : label}
    </button>
  )
}

function ToggleRow({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string
  label: string
  description: string
  defaultChecked: boolean
}) {
  const [checked, setChecked] = useState(defaultChecked)

  return (
    <div className="flex items-center justify-between py-4">
      <div>
        <p className="text-sm font-sans text-primary">{label}</p>
        <p className="text-[12px] font-sans text-tertiary mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => setChecked(c => !c)}
        className="relative w-10 h-6 shrink-0 rounded-pill border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        style={{
          backgroundColor: checked ? 'rgba(245,245,247,0.12)' : 'rgba(245,245,247,0.06)',
          borderColor: checked ? 'rgba(245,245,247,0.22)' : 'rgba(255,255,255,0.08)',
        }}
      >
        <span
          className="absolute top-1 w-4 h-4 rounded-full transition-all duration-200"
          style={{
            left: checked ? '20px' : '4px',
            background: checked ? '#F5F5F7' : 'rgba(245,245,247,0.38)',
          }}
        />
        {/* Hidden input so FormData carries the value */}
        <input
          type="checkbox"
          name={name}
          value="true"
          checked={checked}
          onChange={() => {}}
          className="sr-only"
        />
      </button>
    </div>
  )
}
