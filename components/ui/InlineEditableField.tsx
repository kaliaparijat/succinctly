'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  initialValue?: string
  placeholder?: string
  ariaLabel?: string
  onConfirm: (trimmedValue: string) => Promise<void>
  onCancel: () => void
}

export default function InlineEditableField({
  initialValue = '',
  placeholder,
  ariaLabel = 'Name',
  onConfirm,
  onCancel,
}: Props) {
  const [value, setValue] = useState(initialValue)
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleConfirm() {
    const trimmed = value.trim()
    if (!trimmed) return
    setSubmitting(true)
    try {
      await onConfirm(trimmed)
    } catch {
      // Swallow — stay in edit state with the typed text preserved so the
      // user can retry or cancel manually.
    } finally {
      setSubmitting(false)
    }
  }

  function handleBlur() {
    if (submitting) return
    onCancel()
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        aria-label={ariaLabel}
        disabled={submitting}
        className="flex-1 px-3 py-2 rounded-btn bg-surface-card text-primary font-sans text-sm outline-none border border-divider focus:border-divider-strong placeholder:text-tertiary"
      />
      <button
        type="button"
        aria-label="Confirm"
        onMouseDown={e => e.preventDefault()}
        onClick={handleConfirm}
        disabled={submitting}
        className="shrink-0 rounded-full p-2 text-primary disabled:opacity-50"
      >
        ✓
      </button>
    </div>
  )
}
