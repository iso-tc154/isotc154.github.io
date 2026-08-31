export interface SeoMeta {
  title: string
  description: string
  canonicalPath: string
  type?: 'website' | 'article'
  image?: string
  publishedTime?: string
  modifiedTime?: string
  jsonLd?: object | object[]
  breadcrumbs?: { name: string; path: string }[]
}

export interface SiteConfig {
  siteUrl: string
  committeeName: string
  committeeFull: string
  committeeScope: string
  twitterHandle: string
  defaultOgImage: string
  ogImageWidth: number
  ogImageHeight: number
  locale: string
}

export const SITE_CONFIG: SiteConfig = {
  siteUrl: 'https://www.isotc154.org',
  committeeName: 'ISO/TC 154',
  committeeFull:
    'ISO/TC 154 — Processes, data elements and documents in commerce, industry and administration',
  committeeScope:
    'Standardization of processes, data elements and documents used in commerce, industry and administration.',
  twitterHandle: '@isostandards',
  defaultOgImage: '/assets/og/iso-tc-154-card.png',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  locale: 'en_US',
}

const MONTHS: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
}

export function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

export function escapeText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function truncateAtWord(s: string, n: number): string {
  if (s.length <= n) return s
  const cut = s.slice(0, n)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > n * 0.6 ? cut.slice(0, lastSpace) : cut).trim() + '…'
}

export function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function toIsoDate(s?: string | null): string | undefined {
  if (!s) return undefined
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/)
  if (iso) {
    const [, y, mo, d, hh, mm] = iso
    return hh && mm ? `${y}-${mo}-${d}T${hh}:${mm}` : `${y}-${mo}-${d}`
  }
  const m = s.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/)
  if (!m) return undefined
  const [, d, mon, y, hh, mm] = m
  const month = MONTHS[mon]
  if (!month) return undefined
  const pad = (n: number, w = 2) => String(n).padStart(w, '0')
  if (hh && mm) return `${y}-${pad(month)}-${pad(+d)}T${pad(+hh)}:${pad(+mm)}`
  return `${y}-${pad(month)}-${pad(+d)}`
}

export function absoluteUrl(path: string, cfg: SiteConfig = SITE_CONFIG): string {
  if (/^https?:\/\//.test(path)) return path
  return `${cfg.siteUrl}${path.startsWith('/') ? path : `/${path}`}`
}

export function organizationJsonLd(cfg: SiteConfig = SITE_CONFIG) {
  return {
    '@type': 'Organization',
    '@id': `${cfg.siteUrl}/#organization`,
    name: cfg.committeeName,
    alternateName: cfg.committeeFull,
    url: cfg.siteUrl,
    logo: absoluteUrl(cfg.defaultOgImage, cfg),
    sameAs: [
      'https://www.iso.org/committee/45876.html',
      'https://www.linkedin.com/company/iso-tc154/',
      'https://github.com/ISO-TC154',
    ],
  }
}

export function websiteJsonLd(cfg: SiteConfig = SITE_CONFIG) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${cfg.siteUrl}/#website`,
    url: cfg.siteUrl,
    name: cfg.committeeName,
    description: cfg.committeeFull,
    publisher: { '@id': `${cfg.siteUrl}/#organization` },
  }
}

export function breadcrumbsJsonLd(
  items: { name: string; path: string }[],
  cfg: SiteConfig = SITE_CONFIG,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path, cfg),
    })),
  }
}

export interface HeadObject {
  title: string
  meta: Array<{ name?: string; property?: string; content: string }>
  link: Array<{ rel: string; href: string; [k: string]: string }>
  script: Array<{ type: string; innerHTML: string }>
}

export function buildHeadObject(meta: SeoMeta, cfg: SiteConfig = SITE_CONFIG): HeadObject {
  const title = meta.title
  const desc = truncateAtWord(meta.description, 160)
  const canonical = absoluteUrl(meta.canonicalPath, cfg)
  const image = absoluteUrl(meta.image || cfg.defaultOgImage, cfg)
  const type = meta.type || 'website'

  const metaTags: HeadObject['meta'] = [
    { name: 'description', content: desc },
    { property: 'og:site_name', content: cfg.committeeName },
    { property: 'og:type', content: type },
    { property: 'og:title', content: title },
    { property: 'og:description', content: desc },
    { property: 'og:url', content: canonical },
    { property: 'og:image', content: image },
    { property: 'og:image:width', content: String(cfg.ogImageWidth) },
    { property: 'og:image:height', content: String(cfg.ogImageHeight) },
    { property: 'og:locale', content: cfg.locale },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: cfg.twitterHandle },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: desc },
    { name: 'twitter:image', content: image },
  ]

  if (meta.publishedTime) {
    metaTags.push({ property: 'article:published_time', content: meta.publishedTime })
  }
  if (meta.modifiedTime) {
    metaTags.push({ property: 'article:modified_time', content: meta.modifiedTime })
  }

  const linkTags: HeadObject['link'] = [
    { rel: 'canonical', href: canonical },
  ]

  const scripts: HeadObject['script'] = []
  const jsonLdArray = meta.jsonLd
    ? Array.isArray(meta.jsonLd) ? meta.jsonLd : [meta.jsonLd]
    : []
  if (meta.breadcrumbs) {
    jsonLdArray.push(breadcrumbsJsonLd(meta.breadcrumbs, cfg))
  }
  for (const block of jsonLdArray) {
    scripts.push({
      type: 'application/ld+json',
      innerHTML: JSON.stringify(block),
    })
  }

  return { title, meta: metaTags, link: linkTags, script: scripts }
}

export function renderHeadToString(meta: SeoMeta, cfg: SiteConfig = SITE_CONFIG): string {
  const head = buildHeadObject(meta, cfg)
  const tags: string[] = [
    `<title>${escapeText(head.title)}</title>`,
    ...head.meta.map((m) => {
      const attr = m.name !== undefined ? `name="${escapeAttr(m.name)}"` : `property="${escapeAttr(m.property!)}"`
      return `<meta ${attr} content="${escapeAttr(m.content)}">`
    }),
    ...head.link.map((l) => {
      const attrs = Object.entries(l)
        .map(([k, v]) => `${k}="${escapeAttr(v)}"`)
        .join(' ')
      return `<link ${attrs}>`
    }),
    ...head.script.map((s) => {
      const inner = s.innerHTML.replace(/</g, '\\u003c')
      return `<script type="${escapeAttr(s.type)}">${inner}</script>`
    }),
  ]
  return tags.join('\n  ')
}
