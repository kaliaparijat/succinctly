import { describe, it, expect } from 'vitest'
import { applyFormat } from '@/lib/applyFormat'

describe('applyFormat — bold/italic', () => {
  it('wraps a selection in **…** and selects the inner text', () => {
    const text = 'Hello world'
    const result = applyFormat(text, 6, 11, 'bold') // selects "world"
    expect(result.text).toBe('Hello **world**')
    expect(result.selectionStart).toBe(8) // after "Hello **"
    expect(result.selectionEnd).toBe(13) // end of "world"
  })

  it('wraps a selection in *…* and selects the inner text', () => {
    const text = 'Hello world'
    const result = applyFormat(text, 6, 11, 'italic')
    expect(result.text).toBe('Hello *world*')
    expect(result.selectionStart).toBe(7)
    expect(result.selectionEnd).toBe(12)
  })

  it('wraps an empty (collapsed) selection and places the caret inside', () => {
    const text = ''
    const result = applyFormat(text, 0, 0, 'bold')
    expect(result.text).toBe('****')
    expect(result.selectionStart).toBe(2)
    expect(result.selectionEnd).toBe(2)
  })
})

describe('applyFormat — code', () => {
  it('wraps a single-line selection in inline backticks', () => {
    const text = 'call fib(5)'
    const result = applyFormat(text, 5, 11, 'code') // selects "fib(5)"
    expect(result.text).toBe('call `fib(5)`')
    expect(result.selectionStart).toBe(6)
    expect(result.selectionEnd).toBe(12)
  })

  it('inserts a fenced python block for an empty selection', () => {
    const result = applyFormat('', 0, 0, 'code')
    expect(result.text).toBe('```python\n\n```')
  })

  it('inserts a fenced python block for a multi-line selection, wrapping the selected text', () => {
    const text = 'def f():\n    return 1'
    const result = applyFormat(text, 0, text.length, 'code')
    expect(result.text).toBe('```python\ndef f():\n    return 1\n```')
  })
})

describe('applyFormat — math', () => {
  it('wraps a selection in inline $…$', () => {
    const text = 'area is x'
    const result = applyFormat(text, 8, 9, 'math') // selects "x"
    expect(result.text).toBe('area is $x$')
  })

  it('wraps a non-empty mid-line caret in inline $…$', () => {
    const text = 'area is '
    const result = applyFormat(text, 8, 8, 'math')
    expect(result.text).toBe('area is $$')
  })

  it('inserts a display $$ block at the start of an empty line', () => {
    const result = applyFormat('', 0, 0, 'math')
    expect(result.text).toBe('$$\n\n$$')
  })
})

describe('applyFormat — list', () => {
  it('prefixes the current line with "- " and preserves the caret position relative to typed text', () => {
    const text = 'item one'
    const result = applyFormat(text, 4, 4, 'list') // caret after "item"
    expect(result.text).toBe('- item one')
    expect(result.selectionStart).toBe(6) // 4 + 2 ("- ")
    expect(result.selectionEnd).toBe(6)
  })

  it('prefixes only the current line in multi-line text', () => {
    const text = 'first\nsecond'
    const result = applyFormat(text, 8, 8, 'list') // caret inside "second"
    expect(result.text).toBe('first\n- second')
  })
})
