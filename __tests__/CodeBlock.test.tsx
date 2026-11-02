import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import CodeBlock from '@/components/cards/markdown/CodeBlock'

describe('CodeBlock', () => {
  it('highlights python keywords and strings', () => {
    const { container } = render(<CodeBlock lang="python" body={'def f():\n    return "x"'} />)
    expect(container.querySelector('.hljs-keyword')).not.toBeNull()
    expect(container.querySelector('.hljs-string')).not.toBeNull()
  })

  it('highlights javascript keywords and strings', () => {
    const { container } = render(<CodeBlock lang="javascript" body={'const a = "hi";'} />)
    expect(container.querySelector('.hljs-keyword')).not.toBeNull()
    expect(container.querySelector('.hljs-string')).not.toBeNull()
  })

  it('highlights typescript keywords', () => {
    const { container } = render(<CodeBlock lang="typescript" body={'interface Foo { x: number }'} />)
    expect(container.querySelector('.hljs-keyword')).not.toBeNull()
  })

  it('falls back to plain escaped text for an unregistered language', () => {
    const { container } = render(<CodeBlock lang="ruby" body={'def f\n  1 < 2\nend'} />)
    expect(container.querySelector('.hljs-keyword')).toBeNull()
    expect(container.textContent).toContain('1 < 2')
  })

  it('does not throw for an unregistered language', () => {
    expect(() => render(<CodeBlock lang="ruby" body="puts 1" />)).not.toThrow()
  })
})
