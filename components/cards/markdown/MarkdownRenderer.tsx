import katex from 'katex'
import { parseMarkdown, renderInline, type MarkdownBlock } from '@/lib/markdown'
import CodeBlock from '@/components/cards/markdown/CodeBlock'

interface Props {
  src: string
  placeholder: string
  size?: number
  codeSize?: number
  ink?: string
}

function Block({ block, size, codeSize }: { block: MarkdownBlock; size: number; codeSize: number }) {
  if (block.type === 'text') {
    return (
      <div
        className="rt font-display"
        style={{ fontSize: size, lineHeight: 1.28, letterSpacing: -0.3 }}
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
    return <div style={{ fontSize: size * 0.8 }} className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: html }} />
  }

  if (block.type === 'code') {
    return <CodeBlock lang={block.lang} body={block.body} size={codeSize} />
  }

  if (block.type === 'list') {
    return (
      <ul className="font-display m-0 pl-[1.1em]" style={{ fontSize: size * 0.92, lineHeight: 1.3 }}>
        {block.items.map((item, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
        ))}
      </ul>
    )
  }

  if (block.type === 'image') {
    return block.src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={block.src} alt={block.alt} className="block max-w-full rounded-[10px] object-contain" style={{ maxHeight: size * 9 }} />
    ) : (
      <div
        className="flex items-center justify-center rounded-[10px] border-[1.5px] border-dashed font-mono text-[10px] uppercase tracking-[0.6px] opacity-70"
        style={{ height: size * 5, borderColor: 'currentColor' }}
      >
        Image
      </div>
    )
  }

  return null
}

export default function MarkdownRenderer({ src, placeholder, size = 24, codeSize = 13, ink = 'var(--card-ink)' }: Props) {
  const blocks = parseMarkdown(src)

  if (!blocks.length) {
    return (
      <div className="font-display text-center" style={{ fontSize: size, color: ink, opacity: 0.3 }}>
        {placeholder}
      </div>
    )
  }

  const center = blocks.length === 1 && blocks[0].type === 'text'

  return (
    <div
      className="flex flex-col"
      style={{ gap: Math.round(size * 0.55), textAlign: center ? 'center' : 'left', color: ink }}
    >
      {blocks.map((block, i) => (
        <Block key={i} block={block} size={size} codeSize={codeSize} />
      ))}
    </div>
  )
}
