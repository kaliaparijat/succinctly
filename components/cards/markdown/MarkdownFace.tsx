import type { useMarkdownFace } from '@/components/cards/markdown/useMarkdownFace'
import MarkdownRenderer from '@/components/cards/markdown/MarkdownRenderer'

interface Props {
  name: string
  face: ReturnType<typeof useMarkdownFace>
  placeholder: string
  size?: number
  codeSize?: number
  ink?: string
  className?: string
  /**
   * Called after the face's own onKeyDown (Escape/⌘B/⌘I/Tab-in-fence/list
   * Enter), but only if that didn't call stopPropagation() — e.g. CardEditor's
   * Tab-to-flip, which should still fire for a plain Tab outside a fence.
   */
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  /**
   * Whether this face's textarea takes focus on mount. Default true, but a
   * caller rendering two editing faces at once (CardEditor's both-faces-
   * start-editing initial state) must set this false on every face but the
   * currently-visible one — two autoFocus textareas mounting together race,
   * and the later one's autofocus steals focus from the earlier one, which
   * then reads the resulting blur as "focus left the face" and self-closes.
   */
  autoFocus?: boolean
}

export default function MarkdownFace({ name, face, placeholder, size = 24, codeSize = 13, ink, className, onKeyDown, autoFocus = true }: Props) {
  const { text, editing, open, close, setText, textareaRef, onKeyDown: faceOnKeyDown } = face

  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    const next = e.relatedTarget as HTMLElement | null
    if (next && e.currentTarget.contains(next)) return
    // A Tab-driven flip focuses the sibling face programmatically (so typing
    // can continue immediately), which blurs this one as a side effect.
    // That's not "the user clicked away" — CardEditor's own flipTo() already
    // closes this face on its own schedule (after the flip animation), so
    // don't race it by closing instantly here too.
    if (next && next.closest('[data-face]')) return
    close()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    faceOnKeyDown(e)
    if (!e.isPropagationStopped()) onKeyDown?.(e)
  }

  return (
    <div data-face className={className} onBlur={handleBlur} style={{ position: 'relative', flex: 1 }}>
      <input type="hidden" name={name} value={text} readOnly />
      {editing ? (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="absolute inset-0 w-full h-full bg-transparent resize-none outline-none"
        />
      ) : (
        <div
          onMouseDown={(e) => {
            if ((e.target as HTMLElement).closest('button,a')) return
            e.preventDefault()
            open()
          }}
          className="absolute inset-0 cursor-text overflow-y-auto"
        >
          <MarkdownRenderer src={text} placeholder={placeholder} size={size} codeSize={codeSize} ink={ink} />
        </div>
      )}
    </div>
  )
}
