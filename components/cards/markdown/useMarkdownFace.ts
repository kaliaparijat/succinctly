import { useLayoutEffect, useRef, useState } from 'react'
import { applyFormat, type FormatKind } from '@/lib/applyFormat'

interface Options {
  initialText?: string
  initialEditing?: boolean
}

export function useMarkdownFace({ initialText = '', initialEditing = false }: Options = {}) {
  const [text, setText] = useState(initialText)
  const [editing, setEditing] = useState(initialEditing)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pendingSelection = useRef<[number, number] | null>(null)

  const open = () => setEditing(true)
  const close = () => setEditing(false)

  // After a text update that moves the caret (fmt()), restore focus and the
  // selection once the textarea has re-rendered with the new value.
  useLayoutEffect(() => {
    const el = textareaRef.current
    const pending = pendingSelection.current
    if (!el || !pending) return
    pendingSelection.current = null
    el.focus({ preventScroll: true })
    el.setSelectionRange(pending[0], pending[1])
  })

  function currentSelection(): [number, number] {
    const el = textareaRef.current
    if (editing && el) return [el.selectionStart, el.selectionEnd]
    return [text.length, text.length]
  }

  function fmt(kind: FormatKind) {
    const [selectionStart, selectionEnd] = currentSelection()
    const result = applyFormat(text, selectionStart, selectionEnd, kind)
    setText(result.text)
    setEditing(true)
    pendingSelection.current = [result.selectionStart, result.selectionEnd]
  }

  return { text, setText, editing, open, close, fmt, textareaRef }
}
