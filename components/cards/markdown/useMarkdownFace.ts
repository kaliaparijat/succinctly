import { useRef, useState } from 'react'

interface Options {
  initialText?: string
  initialEditing?: boolean
}

export function useMarkdownFace({ initialText = '', initialEditing = false }: Options = {}) {
  const [text, setText] = useState(initialText)
  const [editing, setEditing] = useState(initialEditing)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const open = () => setEditing(true)
  const close = () => setEditing(false)

  return { text, setText, editing, open, close, textareaRef }
}
