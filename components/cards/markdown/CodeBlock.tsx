import hljs from 'highlight.js/lib/core'
import python from 'highlight.js/lib/languages/python'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import { escapeHtml } from '@/lib/markdown'

hljs.registerLanguage('python', python)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)

interface Props {
  lang: string
  body: string
  size?: number
}

export default function CodeBlock({ lang, body, size = 13 }: Props) {
  let html: string
  try {
    html = hljs.getLanguage(lang) ? hljs.highlight(body, { language: lang }).value : escapeHtml(body)
  } catch {
    html = escapeHtml(body)
  }

  return (
    <div
      className="rounded-[10px] bg-[#1E1B14] py-[9px] text-[#EDE6D6] font-mono shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25)]"
      style={{ fontSize: size, lineHeight: 1.6 }}
    >
      <div className="flex items-center justify-between px-3 pb-[5px] text-[9.5px] tracking-[0.8px] uppercase text-[rgba(237,230,214,0.45)]">
        <span>{lang}</span>
      </div>
      <div className="overflow-x-auto">
        {html.split('\n').map((ln, i) => (
          <div key={i} className="flex px-3">
            <span className="w-[2.4ch] shrink-0 select-none text-[rgba(237,230,214,0.28)]">{i + 1}</span>
            <span className="whitespace-pre" dangerouslySetInnerHTML={{ __html: ln || ' ' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
