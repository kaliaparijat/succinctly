import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import MarkdownRenderer from '@/components/cards/markdown/MarkdownRenderer'

describe('MarkdownRenderer', () => {
  it('renders a paragraph with bold applied', () => {
    const { container } = render(<MarkdownRenderer src="Hello **world**" placeholder="" />)
    expect(container.querySelector('strong')?.textContent).toBe('world')
  })

  it('renders a fenced code block via CodeBlock', () => {
    const { container } = render(<MarkdownRenderer src={'```python\ndef f():\n    pass\n```'} placeholder="" />)
    expect(container.querySelector('.hljs-keyword')).not.toBeNull()
  })

  it('renders a math block via KaTeX', () => {
    const { container } = render(<MarkdownRenderer src="$$x^2$$" placeholder="" />)
    expect(container.querySelector('.katex')).not.toBeNull()
  })

  it('renders a list as <ul><li>', () => {
    const { container } = render(<MarkdownRenderer src={'- one\n- two'} placeholder="" />)
    const items = container.querySelectorAll('li')
    expect(items).toHaveLength(2)
    expect(items[0].textContent).toBe('one')
    expect(items[1].textContent).toBe('two')
  })

  it('shows the placeholder for empty source', () => {
    const { getByText } = render(<MarkdownRenderer src="" placeholder="What's the question?" />)
    expect(getByText("What's the question?")).toBeInTheDocument()
  })

  it('shows the placeholder for whitespace-only source', () => {
    const { getByText } = render(<MarkdownRenderer src={'   \n  '} placeholder="Write the answer…" />)
    expect(getByText('Write the answer…')).toBeInTheDocument()
  })

  it('centers a single-paragraph block', () => {
    const { container } = render(<MarkdownRenderer src="Just one paragraph" placeholder="" />)
    expect(container.firstChild).toHaveStyle({ textAlign: 'center' })
  })

  it('left-aligns multi-block content', () => {
    const { container } = render(<MarkdownRenderer src={'Para one\n\n- a\n- b'} placeholder="" />)
    expect(container.firstChild).toHaveStyle({ textAlign: 'left' })
  })
})
