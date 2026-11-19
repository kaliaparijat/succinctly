import { useLayoutEffect, useRef, useState } from 'react'
import { applyFormat, spliceSelection, type FormatKind } from '@/lib/applyFormat'
import { isInsideOpenFence, continueList } from '@/lib/markdownKeyboard'

interface Options {
  initialText?: string
  initialEditing?: boolean
}

export function useMarkdownFace({ initialText = '', initialEditing = false }: Options = {}) {
  const [text, setText] = useState(initialText)
  const [editing, setEditing] = useState(initialEditing)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pendingSelection = useRef<[number, number] | null>(null)

  // Set by Escape so the blur it causes can tell "cancel" from "click away" (see consumeCancel).
  const cancelled = useRef(false)

  // `seed` replaces the text on entry (a viewer re-seeds from the card each time). Either way the
  // caret lands at the end of the text, as in the design.
  const open = (seed?: string) => {
    const next = typeof seed === 'string' ? seed : text
    if (typeof seed === 'string') setText(seed)
    setEditing(true)
    pendingSelection.current = [next.length, next.length]
  }
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

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget
    const mod = e.metaKey || e.ctrlKey

    if (e.key === 'Escape') {
      e.preventDefault()
      cancelled.current = true
      el.blur()
      close()
      return
    }

    if (mod && (e.key === 'b' || e.key === 'i')) {
      e.preventDefault()
      fmt(e.key === 'b' ? 'bold' : 'italic')
      return
    }

    if (e.key === 'Tab' && isInsideOpenFence(text, el.selectionStart)) {
      e.preventDefault()
      e.stopPropagation()
      const result = spliceSelection(text, el.selectionStart, el.selectionEnd, '    ', 4)
      setText(result.text)
      pendingSelection.current = [result.selectionStart, result.selectionEnd]
      return
    }

    if (e.key === 'Enter' && !mod && !e.shiftKey && el.selectionStart === el.selectionEnd) {
      const result = continueList(text, el.selectionStart)
      if (result) {
        e.preventDefault()
        setText(result.text)
        pendingSelection.current = [result.selectionStart, result.selectionEnd]
      }
    }
  }

  // True once if Escape just fired. The blur that Escape triggers runs the face's blur handler;
  // a caller that saves on blur calls this to skip that save.
  function consumeCancel() {
    const was = cancelled.current
    cancelled.current = false
    return was
  }

  return { text, setText, editing, open, close, fmt, onKeyDown, textareaRef, consumeCancel }
}
