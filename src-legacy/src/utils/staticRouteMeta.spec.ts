import { describe, it, expect } from 'vitest'
import { STATIC_ROUTE_META, resolveStaticRouteMeta } from './staticRouteMeta'
import { SITE_CONFIG } from './seo'

describe('STATIC_ROUTE_META', () => {
  it('includes an entry for every well-known static route', () => {
    const expected = [
      '/', '/resolutions', '/resolutions/meetings',
      '/members', '/groups', '/standards', '/liaisons',
      '/national-bodies', '/projects', '/meetings', '/posts',
      '/about', '/business-plan', '/history',
      '/faq', '/procedures', '/contact', '/acknowledgments',
    ]
    for (const path of expected) {
      expect(STATIC_ROUTE_META[path], `missing entry for ${path}`).toBeDefined()
    }
  })

  it('every collection route has a label and non-empty description', () => {
    for (const [path, entry] of Object.entries(STATIC_ROUTE_META)) {
      if (path === '/') continue
      expect(entry.label, `${path} label`).toBeTruthy()
      expect(entry.description, `${path} description`).toBeTruthy()
      expect(entry.description.length, `${path} description length`).toBeGreaterThan(10)
    }
  })
})

describe('resolveStaticRouteMeta', () => {
  it('home route returns website type with org+website graph', () => {
    const meta = resolveStaticRouteMeta('/', STATIC_ROUTE_META['/'])
    expect(meta.canonicalPath).toBe('/')
    expect(meta.type).toBe('website')
    const graph = meta.jsonLd as { '@context': string; '@graph': unknown[] }
    expect(graph['@graph']).toHaveLength(2)
  })

  it('collection route produces CollectionPage jsonLd', () => {
    const meta = resolveStaticRouteMeta('/resolutions', STATIC_ROUTE_META['/resolutions'])
    expect(meta.title).toBe(`Resolutions | ${SITE_CONFIG.committeeName}`)
    expect(meta.canonicalPath).toBe('/resolutions/')
    const ld = meta.jsonLd as { '@type': string }
    expect(ld['@type']).toBe('CollectionPage')
    expect(meta.breadcrumbs).toEqual([
      { name: 'Home', path: '/' },
      { name: 'Resolutions', path: '/resolutions/' },
    ])
  })

  it('collection route with parent breadcrumb includes it', () => {
    const meta = resolveStaticRouteMeta('/resolutions/meetings', STATIC_ROUTE_META['/resolutions/meetings'])
    expect(meta.breadcrumbs).toEqual([
      { name: 'Home', path: '/' },
      { name: 'Resolutions', path: '/resolutions/' },
      { name: 'Meetings', path: '/resolutions/meetings/' },
    ])
    expect(meta.title).toBe(`Meetings Timeline | ${SITE_CONFIG.committeeName}`)
  })

  it('webpage route produces WebPage jsonLd with about: organization', () => {
    const meta = resolveStaticRouteMeta('/about', STATIC_ROUTE_META['/about'])
    const ld = meta.jsonLd as { '@type': string; about: { '@id': string } }
    expect(ld['@type']).toBe('AboutPage')
    expect(ld.about['@id']).toBe(`${SITE_CONFIG.siteUrl}/#organization`)
  })

  it('history route overrides jsonLdType to CollectionPage', () => {
    const meta = resolveStaticRouteMeta('/history', STATIC_ROUTE_META['/history'])
    const ld = meta.jsonLd as { '@type': string }
    expect(ld['@type']).toBe('CollectionPage')
  })

  it('faq route produces FAQPage', () => {
    const meta = resolveStaticRouteMeta('/faq', STATIC_ROUTE_META['/faq'])
    const ld = meta.jsonLd as { '@type': string }
    expect(ld['@type']).toBe('FAQPage')
  })

  it('contact route produces ContactPage', () => {
    const meta = resolveStaticRouteMeta('/contact', STATIC_ROUTE_META['/contact'])
    const ld = meta.jsonLd as { '@type': string }
    expect(ld['@type']).toBe('ContactPage')
  })
})
