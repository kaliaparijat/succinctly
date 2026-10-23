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
  /** Extra classes for the editing textarea itself — font/size/color/placeholder tokens, which differ per breakpoint. */
  textareaClassName?: string
  /**
   * Padding classes for the face's content, applied to the editing textarea and the rendered view
   * themselves. The face is absolutely positioned, so padding on a parent would not inset it.
   */
  paddingClassName?: string
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

export default function MarkdownFace({ name, face, placeholder, size = 24, codeSize = 13, ink, className, textareaClassName = '', paddingClassName = '', onKeyDown, autoFocus = true }: Props) {
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
    <div data-face className={`absolute inset-0 ${className ?? ''}`} onBlur={handleBlur}>
      <input type="hidden" name={name} value={text} readOnly />
      {editing ? (
        <div className={`absolute inset-0 overflow-y-auto flex flex-col ${paddingClassName}`}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`${placeholder}   **bold**  \`code\`  $math$`}
            autoFocus={autoFocus}
            className={`block w-full flex-1 min-h-[6em] [field-sizing:content] bg-transparent resize-none outline-none ${textareaClassName}`}
          />
          <div
            className="mt-[14px] pt-2 shrink-0 border-t border-dashed font-mono text-[9.5px] uppercase tracking-[0.6px]"
            style={{ borderColor: 'color-mix(in srgb, var(--card-ink) 19%, transparent)', color: 'color-mix(in srgb, var(--card-ink) 60%, transparent)' }}
          >
            Markdown supported
          </div>
        </div>
      ) : (
        <div
          onMouseDown={(e) => {
            if ((e.target as HTMLElement).closest('button,a')) return
            e.preventDefault()
            open()
          }}
          className={`absolute inset-0 cursor-text overflow-y-auto ${paddingClassName}`}
        >
          <MarkdownRenderer src={text} placeholder={placeholder} size={size} codeSize={codeSize} ink={ink} />
        </div>
      )}
    </div>
  )
}
