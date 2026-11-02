import { describe, it, expect } from 'vitest'
import { isInsideOpenFence, continueList } from '@/lib/markdownKeyboard'

describe('isInsideOpenFence', () => {
  it('is false with no fences at all', () => {
    expect(isInsideOpenFence('plain text', 5)).toBe(false)
  })

  it('is true with the caret inside an opened, unclosed fence', () => {
    const text = '```python\ndef f():\n'
    expect(isInsideOpenFence(text, text.length)).toBe(true)
  })

  it('is false with the caret after a closed fence', () => {
    const text = '```python\ndef f():\n```\n'
    expect(isInsideOpenFence(text, text.length)).toBe(false)
  })

  it('is false with the caret before any fence has opened yet', () => {
    const text = 'plain\n```python\ncode'
    expect(isInsideOpenFence(text, 5)).toBe(false) // caret right after "plain", before the fence line
  })
})

describe('continueList', () => {
  it('returns null when the current line is not a list item', () => {
    const text = 'just text'
    expect(continueList(text, text.length)).toBeNull()
  })

  it('continues a non-empty "- item" line with a new "- " prefixed line', () => {
    const text = '- first item'
    const result = continueList(text, text.length)
    expect(result).not.toBeNull()
    expect(result!.text).toBe('- first item\n- ')
    expect(result!.selectionStart).toBe(text.length + 3)
    expect(result!.selectionEnd).toBe(text.length + 3)
  })

  it('ends the list when Enter is pressed on an empty "- " line', () => {
    const text = 'first\n- '
    const result = continueList(text, text.length)
    expect(result).not.toBeNull()
    expect(result!.text).toBe('first\n')
    expect(result!.selectionStart).toBe(6)
    expect(result!.selectionEnd).toBe(6)
  })

  it('preserves leading indentation on the continued line', () => {
    const text = '  - indented'
    const result = continueList(text, text.length)
    expect(result!.text).toBe('  - indented\n  - ')
  })

  it('supports "*" markers', () => {
    const text = '* star item'
    const result = continueList(text, text.length)
    expect(result!.text).toBe('* star item\n* ')
  })
})
