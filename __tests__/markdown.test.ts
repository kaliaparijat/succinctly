import { describe, it, expect } from 'vitest'
import { parseMarkdown } from '@/lib/markdown'

describe('parseMarkdown — paragraphs', () => {
  it('parses a single paragraph', () => {
    expect(parseMarkdown('Hello world')).toEqual([
      { type: 'text', text: 'Hello world' },
    ])
  })

  it('splits two paragraphs separated by a blank line', () => {
    expect(parseMarkdown('First paragraph\n\nSecond paragraph')).toEqual([
      { type: 'text', text: 'First paragraph' },
      { type: 'text', text: 'Second paragraph' },
    ])
  })

  it('joins consecutive non-blank lines into one paragraph with spaces', () => {
    expect(parseMarkdown('Line one\nLine two\nLine three')).toEqual([
      { type: 'text', text: 'Line one Line two Line three' },
    ])
  })

  it('returns an empty array for empty source', () => {
    expect(parseMarkdown('')).toEqual([])
  })
})

describe('parseMarkdown — fenced code blocks', () => {
  it('captures the language tag and body verbatim', () => {
    const src = '```python\ndef f(n):\n    return n\n```'
    expect(parseMarkdown(src)).toEqual([
      { type: 'code', lang: 'python', body: 'def f(n):\n    return n' },
    ])
  })

  it('preserves internal blank lines in the body', () => {
    const src = '```javascript\nconst a = 1\n\nconst b = 2\n```'
    expect(parseMarkdown(src)).toEqual([
      { type: 'code', lang: 'javascript', body: 'const a = 1\n\nconst b = 2' },
    ])
  })

  it('defaults to "plaintext" when no language tag is given', () => {
    const src = '```\nraw text\n```'
    expect(parseMarkdown(src)).toEqual([
      { type: 'code', lang: 'plaintext', body: 'raw text' },
    ])
  })
})

describe('parseMarkdown — math', () => {
  it('parses a single-line $$...$$ as a display-math block', () => {
    expect(parseMarkdown('$$x^2 + y^2 = z^2$$')).toEqual([
      { type: 'math', tex: 'x^2 + y^2 = z^2' },
    ])
  })

  it('parses a multi-line $$ ... $$ block', () => {
    const src = '$$\nT(n) = T(n-1) + O(1)\n$$'
    expect(parseMarkdown(src)).toEqual([
      { type: 'math', tex: '\nT(n) = T(n-1) + O(1)\n' },
    ])
  })
})

describe('parseMarkdown — lists', () => {
  it('parses a "-" bullet list', () => {
    const src = '- first\n- second\n- third'
    expect(parseMarkdown(src)).toEqual([
      { type: 'list', items: ['first', 'second', 'third'] },
    ])
  })

  it('parses a "*" bullet list', () => {
    const src = '* alpha\n* beta'
    expect(parseMarkdown(src)).toEqual([
      { type: 'list', items: ['alpha', 'beta'] },
    ])
  })
})

describe('parseMarkdown — images', () => {
  it('parses an image line as its own block', () => {
    expect(parseMarkdown('![a diagram](https://example.com/d.png)')).toEqual([
      { type: 'image', alt: 'a diagram', src: 'https://example.com/d.png' },
    ])
  })
})

describe('parseMarkdown — mixed content', () => {
  it('produces blocks in source order', () => {
    const src = [
      'Intro paragraph',
      '',
      '```python',
      'x = 1',
      '```',
      '',
      '- item one',
      '- item two',
      '',
      '$$a = b$$',
    ].join('\n')

    expect(parseMarkdown(src)).toEqual([
      { type: 'text', text: 'Intro paragraph' },
      { type: 'code', lang: 'python', body: 'x = 1' },
      { type: 'list', items: ['item one', 'item two'] },
      { type: 'math', tex: 'a = b' },
    ])
  })
})
