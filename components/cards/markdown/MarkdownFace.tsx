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
}

export default function MarkdownFace({ name, face, placeholder, size = 24, codeSize = 13, ink, className }: Props) {
  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    const next = e.relatedTarget
    if (next && e.currentTarget.contains(next)) return
    face.close()
  }

  return (
    <div data-face className={className} onBlur={handleBlur} style={{ position: 'relative', flex: 1 }}>
      <input type="hidden" name={name} value={face.text} readOnly />
      {face.editing ? (
        <textarea
          ref={face.textareaRef}
          value={face.text}
          onChange={(e) => face.setText(e.target.value)}
          onKeyDown={face.onKeyDown}
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
