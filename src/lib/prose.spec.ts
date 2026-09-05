import { describe, it, expect } from 'vitest'
import { renderProse, renderProseInline } from './prose'

describe('renderProse', () => {
  it('renders AsciiDoc paragraphs without a document shell', () => {
    const html = renderProse('Some *bold* text.')
    expect(html).toContain('<p>')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).not.toContain('<h1')
    expect(html).not.toContain('<!DOCTYPE')
  })
  it('nullish input renders empty', () => {
    expect(renderProse(null)).toBe('')
    expect(renderProse(undefined)).toBe('')
    expect(renderProse('')).toBe('')
  })
  it('pins the image-alt-comma gotcha: unquoted commas become positional attrs', () => {
    // Known trap (CLAUDE.md): alt text with an unquoted comma leaks the
    // following token into width/height. This spec documents current
    // behavior at the seam so a future Asciidoctor/attr change is seen.
    const html = renderProse('image::pic.png[Caption, 600]')
    expect(html).toMatch(/width="600"/)
  })
})

describe('renderProseInline (ordered markdown mini-parser)', () => {
  it('escapes HTML before anything else', () => {
    expect(renderProseInline('<script>&')).toBe('&lt;script&gt;&amp;')
  })
  it('links, bold, emphasis and code — in that precedence', () => {
    expect(renderProseInline('[text](https://x.y)')).toBe('<a href="https://x.y">text</a>')
    expect(renderProseInline('**b** *i* `c`')).toBe('<strong>b</strong> <em>i</em> <code>c</code>')
  })
  it('escaped URLs inside link hrefs stay attribute-safe', () => {
    const out = renderProseInline('[a](https://x.y/?p=1&q=2)')
    expect(out).toBe('<a href="https://x.y/?p=1&amp;q=2">a</a>')
  })
  it('bold wins over emphasis for the same span', () => {
    expect(renderProseInline('**both**')).toBe('<strong>both</strong>')
  })
  it('markup-looking plain text is escaped, never interpreted twice', () => {
    expect(renderProseInline('[not a](link')).toBe('[not a](link')
  })
})
