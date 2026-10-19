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

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget
    const mod = e.metaKey || e.ctrlKey

    if (e.key === 'Escape') {
      e.preventDefault()
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

  return { text, setText, editing, open, close, fmt, onKeyDown, textareaRef }
}
