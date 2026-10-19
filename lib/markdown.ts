export type MarkdownBlock =
  | { type: 'text'; text: string }
  | { type: 'code'; lang: string; body: string }
  | { type: 'math'; tex: string }
  | { type: 'image'; alt: string; src: string }
  | { type: 'list'; items: string[] }

const FENCE_OPEN = /^```(\w+)?\s*$/
const FENCE_CLOSE = /^```\s*$/
const IMAGE = /^!\[([^\]]*)\]\(([^)]*)\)/
const LIST_ITEM = /^\s*[-*] /

export function parseMarkdown(src: string): MarkdownBlock[] {
  const lines = (src || '').split('\n')
  const blocks: MarkdownBlock[] = []
  let paragraph: string[] = []
  let i = 0

  const flush = () => {
    if (paragraph.length) {
      blocks.push({ type: 'text', text: paragraph.join(' ') })
      paragraph = []
    }
  }

  while (i < lines.length) {
    const line = lines[i]

    const fence = line.match(FENCE_OPEN)
    if (fence) {
      flush()
      const body: string[] = []
      i++
      while (i < lines.length && !FENCE_CLOSE.test(lines[i])) {
        body.push(lines[i])
        i++
      }
      i++ // skip closing fence
      blocks.push({ type: 'code', lang: fence[1] || 'plaintext', body: body.join('\n') })
      continue
    }

    if (line.trim().startsWith('$$')) {
      flush()
      const rest = line.trim().slice(2)
      if (rest.endsWith('$$')) {
        blocks.push({ type: 'math', tex: rest.slice(0, -2) })
        i++
        continue
      }
      const body = [rest]
      i++
      while (i < lines.length && !lines[i].trim().endsWith('$$')) {
        body.push(lines[i])
        i++
      }
      if (i < lines.length) {
        body.push(lines[i].trim().slice(0, -2))
        i++
      }
      blocks.push({ type: 'math', tex: body.join('\n') })
      continue
    }

    const image = line.match(IMAGE)
    if (image) {
      flush()
      blocks.push({ type: 'image', alt: image[1], src: image[2] })
      i++
      continue
    }

    if (LIST_ITEM.test(line)) {
      flush()
      const items: string[] = []
      while (i < lines.length && LIST_ITEM.test(lines[i])) {
        items.push(lines[i].replace(LIST_ITEM, ''))
        i++
      }
      blocks.push({ type: 'list', items })
      continue
    }

    if (!line.trim()) {
      flush()
      i++
      continue
    }

    paragraph.push(line.trim())
    i++
  }

  flush()
  return blocks
}
