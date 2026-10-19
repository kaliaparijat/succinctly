export type FormatKind = 'bold' | 'italic' | 'code' | 'math' | 'list'

export interface FormatResult {
  text: string
  selectionStart: number
  selectionEnd: number
}

function replace(text: string, a: number, b: number, ins: string, selA: number, selB = selA): FormatResult {
  return {
    text: text.slice(0, a) + ins + text.slice(b),
    selectionStart: a + selA,
    selectionEnd: a + selB,
  }
}

/**
 * Pure toolbar-insertion logic: given the face's current text and selection,
 * returns the new text plus where the selection should land afterward.
 * Ported from the design handoff's `useSimpleFace.fmt` (editor-simple.jsx).
 */
export function applyFormat(text: string, selectionStart: number, selectionEnd: number, kind: FormatKind): FormatResult {
  const a = selectionStart
  const b = selectionEnd
  const s = text.slice(a, b)
  // How much blank-line padding to prepend before inserting a block (code/math)
  // at a caret that isn't already at the start of its own blank paragraph.
  const nl = a > 0 && text[a - 1] !== '\n' ? '\n\n' : a > 0 && text[a - 2] !== '\n' ? '\n' : ''

  if (kind === 'bold') return replace(text, a, b, `**${s}**`, 2, 2 + s.length)
  if (kind === 'italic') return replace(text, a, b, `*${s}*`, 1, 1 + s.length)

  if (kind === 'code') {
    if (s && !s.includes('\n')) return replace(text, a, b, '`' + s + '`', 1, 1 + s.length)
    const ins = `${nl}\`\`\`python\n${s}\n\`\`\``
    return replace(text, a, b, ins, nl.length + 10 + s.length)
  }

  if (kind === 'math') {
    if (s || (a > 0 && text[a - 1] !== '\n')) return replace(text, a, b, `$${s}$`, 1, 1 + s.length)
    const ins = `${nl}$$\n${s}\n$$`
    return replace(text, a, b, ins, nl.length + 3 + s.length)
  }

  // list
  const lineStart = text.lastIndexOf('\n', a - 1) + 1
  return replace(text, lineStart, lineStart, '- ', 2 + (a - lineStart))
}
