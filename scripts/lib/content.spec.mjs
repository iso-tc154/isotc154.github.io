import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { buildSiteContext, loadPosts, loadPages } from './content.mjs'

let root
beforeAll(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'tc154-content-'))
  fs.writeFileSync(path.join(root, '2026-08-30-berlin.adoc'),
    `---
title: Berlin wrap-up
excerpt: The 45th plenary closed.
---
Berlin notes.`)
  fs.writeFileSync(path.join(root, '2025-03-01-older.adoc'), '---\ntitle: Older\n---\nOld.')
  fs.writeFileSync(path.join(root, 'not-a-post.adoc'), 'no date prefix')
  fs.writeFileSync(path.join(root, 'readme.txt'), 'ignored')
  fs.mkdirSync(path.join(root, 'faq'), { recursive: true })
  fs.writeFileSync(path.join(root, 'faq', 'faq.adoc'), '---\ntitle: FAQ\n---\nQ&A.')
  fs.writeFileSync(path.join(root, 'faq', 'custom-route.adoc'),
    '---\ntitle: Routed\npermalink: /help/route/\n---\nRouted.')
})
afterAll(() => fs.rmSync(root, { recursive: true, force: true }))

describe('buildSiteContext', () => {
  it('exposes members under data and defaults group urls', () => {
    const members = { all: {} }
    const ctx = buildSiteContext(members, [{ id: 'wg1' }, { id: 'wg2', url: '/custom/' }])
    expect(ctx.data.members).toBe(members)
    expect(ctx.groups[0].url).toBe('/groups/wg1/')
    expect(ctx.groups[1].url).toBe('/custom/')
  })
  it('tolerates a missing groups array', () => {
    expect(buildSiteContext({}, null).groups).toEqual([])
  })
})

describe('loadPosts', () => {
  it('keeps the date prefix in slug and url, sorted newest-first', () => {
    const posts = loadPosts(root)
    expect(posts.map((p) => p.slug)).toEqual(['2026-08-30-berlin', '2025-03-01-older'])
    expect(posts[0].url).toBe('/posts/2026-08-30-berlin/')
    expect(posts[0].date).toBe('2026-08-30')
  })
  it('parses frontmatter and renders the body', () => {
    const [newest] = loadPosts(root)
    expect(newest.frontmatter.title).toBe('Berlin wrap-up')
    expect(newest.html).toContain('Berlin notes')
  })
  it('skips undated files and non-content extensions', () => {
    const slugs = loadPosts(root).map((p) => p.slug)
    expect(slugs).not.toContain('not-a-post')
    expect(slugs).not.toContain('readme')
  })
  it('returns [] for an absent directory', () => {
    expect(loadPosts(path.join(root, 'nope'))).toEqual([])
  })
})

describe('loadPages', () => {
  it('top-level pages sit at /, subdirs (faq/procedures/agenda) get a prefix', () => {
    const pages = loadPages(root)
    const bySlug = Object.fromEntries(pages.map((p) => [p.slug, p]))
    expect(bySlug['not-a-post'].url).toBe('/not-a-post/')
    expect(bySlug['/faq/faq'].url).toBe('/faq/faq/')
  })
  it('frontmatter permalink beats the derived url', () => {
    const routed = loadPages(root).find((p) => p.slug === '/faq/custom-route')
    expect(routed.frontmatter.permalink).toBe('/help/route/')
    expect(routed.url).toBe('/help/route/')
  })
  it('ignores non-adoc files', () => {
    expect(loadPages(root).some((p) => p.slug === 'readme')).toBe(false)
  })
  it('returns [] for an absent directory', () => {
    expect(loadPages(path.join(root, 'nope'))).toEqual([])
  })
})
