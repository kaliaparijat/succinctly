import katex from 'katex'
import { parseMarkdown, renderInline, type MarkdownBlock } from '@/lib/markdown'
import CodeBlock from '@/components/cards/markdown/CodeBlock'

interface Props {
  src: string
  placeholder: string
  /** Base text size: a number is pixels; a string is any CSS length (e.g. a fluid clamp()). */
  size?: number | string
  codeSize?: number
  ink?: string
}

// Everything but code is sized in em, relative to the root's font size, so `size` can be any CSS length.
function Block({ block, codeSize }: { block: MarkdownBlock; codeSize: number }) {
  if (block.type === 'text') {
    return (
      <div
        className="rt font-display"
        style={{ fontSize: '1em', lineHeight: 1.28, letterSpacing: -0.3 }}
        dangerouslySetInnerHTML={{ __html: renderInline(block.text) }}
      />
    )
  }

  if (block.type === 'math') {
    const html = (() => {
      try {
        return katex.renderToString(block.tex, { throwOnError: false, displayMode: true })
      } catch {
        return block.tex
      }
    })()
    return <div style={{ fontSize: '0.8em' }} className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: html }} />
  }

  if (block.type === 'code') {
    return <CodeBlock lang={block.lang} body={block.body} size={codeSize} />
  }

  if (block.type === 'list') {
    return (
      <ul className="font-display m-0 pl-[1.1em]" style={{ fontSize: '0.92em', lineHeight: 1.3 }}>
        {block.items.map((item, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
        ))}
      </ul>
    )
  }

  if (block.type === 'image') {
    return block.src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={block.src} alt={block.alt} className="block max-w-full rounded-[10px] object-contain" style={{ maxHeight: '9em' }} />
    ) : (
      <div
        className="flex items-center justify-center rounded-[10px] border-[1.5px] border-dashed font-mono text-[10px] uppercase tracking-[0.6px] opacity-70"
        style={{ height: '5em', borderColor: 'currentColor' }}
      >
        Image
      </div>
    )
  }

  return null
}

export default function MarkdownRenderer({ src, placeholder, size = 24, codeSize = 13, ink = 'var(--card-ink)' }: Props) {
  const blocks = parseMarkdown(src)
  const fontSize = typeof size === 'number' ? `${size}px` : size

  if (!blocks.length) {
    return (
      <div className="font-display text-center" style={{ fontSize, color: ink, opacity: 0.3 }}>
        {placeholder}
      </div>
    )
  }

  const center = blocks.length === 1 && blocks[0].type === 'text'

  return (
    <div
      className="flex flex-col"
      style={{ fontSize, gap: '0.55em', textAlign: center ? 'center' : 'left', color: ink }}
    >
      {blocks.map((block, i) => (
        <Block key={i} block={block} codeSize={codeSize} />
      ))}
    </div>
  )
}
