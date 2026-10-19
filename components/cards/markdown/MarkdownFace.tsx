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
}

export default function MarkdownFace({ name, face, placeholder, size = 24, codeSize = 13, ink, className, onKeyDown }: Props) {
  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    const next = e.relatedTarget
    if (next && e.currentTarget.contains(next)) return
    face.close()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    face.onKeyDown(e)
    if (!e.isPropagationStopped()) onKeyDown?.(e)
  }

  return (
    <div data-face className={className} onBlur={handleBlur} style={{ position: 'relative', flex: 1 }}>
      <input type="hidden" name={name} value={face.text} readOnly />
      {face.editing ? (
        <textarea
          ref={face.textareaRef}
          value={face.text}
          onChange={(e) => face.setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus
          className="absolute inset-0 w-full h-full bg-transparent resize-none outline-none"
        />
      ) : (
        <div
          onMouseDown={(e) => {
            if ((e.target as HTMLElement).closest('button,a')) return
            e.preventDefault()
            face.open()
          }}
          className="absolute inset-0 cursor-text overflow-y-auto"
        >
          <MarkdownRenderer src={face.text} placeholder={placeholder} size={size} codeSize={codeSize} ink={ink} />
        </div>
      )}
    </div>
  )
}
