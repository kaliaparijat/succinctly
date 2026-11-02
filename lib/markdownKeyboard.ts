import { spliceSelection, type FormatResult } from '@/lib/applyFormat'

const FENCE_LINE = /^```/gm
const LIST_LINE = /^(\s*)([-*]) (.*)$/

/** True when the caret sits after an odd number of fence lines — i.e. inside an unclosed ``` block. */
export function isInsideOpenFence(text: string, caretPos: number): boolean {
  const before = text.slice(0, caretPos)
  const fenceLines = before.match(FENCE_LINE) || []
  return fenceLines.length % 2 === 1
}

/**
 * Enter-key list continuation: given the caret sits at the end of a
 * "- item" (or "* item") line, continues the list on a new line, or — on an
 * empty "- " line — removes the marker and ends the list. Returns null when
 * the current line isn't a list item.
 */
export function continueList(text: string, caretPos: number): FormatResult | null {
  const lineStart = text.lastIndexOf('\n', caretPos - 1) + 1
  const line = text.slice(lineStart, caretPos)
  const m = line.match(LIST_LINE)
  if (!m) return null

  const [, indent, marker, rest] = m
  if (!rest) return spliceSelection(text, lineStart, caretPos, '', 0)
  return spliceSelection(text, caretPos, caretPos, `\n${indent}${marker} `, indent.length + 3)
}
