import {
  SITE_CONFIG,
  type SeoMeta,
  type SiteConfig,
  organizationJsonLd,
  websiteJsonLd,
} from './seo'

// Static per-route SEO essence — the parts of a route's metadata that don't
// depend on runtime data lookups. Dynamic routes (detail pages with URL
// params) stay in computeRouteMeta; this table only covers routes whose
// title/description/jsonLd shape is known at compile time.
//
// Adding a new static route = adding one entry here, plus the route record
// in router/index.ts. No edit to computeRouteMeta needed.

export type StaticRouteKind = 'home' | 'collection' | 'webpage' | 'faqPage' | 'contactPage'

export interface StaticRouteMeta {
  label: string
  description: string
  kind: StaticRouteKind
  jsonLdType?: string                   // for 'webpage' kind: overrides default 'WebPage'
  parentBreadcrumb?: { name: string; path: string }
  breadcrumbName?: string               // defaults to label
}

const NAME = SITE_CONFIG.committeeName
const FULL = SITE_CONFIG.committeeFull

export const STATIC_ROUTE_META: Record<string, StaticRouteMeta> = {
  '/': {
    label: NAME,
    description: `${FULL}. Browse ISO/TC 154 standards, plenary meetings, resolutions, and members.`,
    kind: 'home',
  },
  '/resolutions': {
    label: 'Resolutions',
    description: `Search and browse resolutions adopted by ${NAME} since its first plenary.`,
    kind: 'collection',
  },
  '/resolutions/meetings': {
    label: 'Meetings Timeline',
    description: `Browse ${NAME} resolutions grouped by plenary meeting and ballot.`,
    parentBreadcrumb: { name: 'Resolutions', path: '/resolutions/' },
    breadcrumbName: 'Meetings',
    kind: 'collection',
  },
  '/members': {
    label: 'Members',
    description: `Experts from national bodies, liaisons, and the Committee Advisory Group of ${NAME}.`,
    kind: 'collection',
  },
  '/groups': {
    label: 'Groups',
    description: `Working Groups, Advisory Groups, and Maintenance Agencies of ${NAME}.`,
    kind: 'collection',
  },
  '/standards': {
    label: 'Standards',
    description: `International Standards published by ${NAME} — processes, data elements and documents in commerce, industry and administration.`,
    kind: 'collection',
  },
  '/liaisons': {
    label: 'Liaisons',
    description: `External organizations in liaison with ${NAME}.`,
    kind: 'collection',
  },
  '/national-bodies': {
    label: 'National Bodies',
    description: `National standards bodies participating in ${NAME}.`,
    kind: 'collection',
  },
  '/projects': {
    label: 'Projects',
    description: `Standards under development by ${NAME}.`,
    kind: 'collection',
  },
  '/meetings': {
    label: 'Plenary Meetings',
    description: `Every plenary meeting of ${NAME}, hosted annually by national bodies — venues, dates, resolutions, briefings.`,
    kind: 'collection',
  },
  '/posts': {
    label: 'News',
    description: `Publications, announcements, and obituaries from ${NAME}.`,
    kind: 'collection',
  },
  '/about': {
    label: 'About',
    description: `About ${NAME} — ${FULL.toLowerCase()}.`,
    kind: 'webpage',
    jsonLdType: 'AboutPage',
  },
  '/business-plan': {
    label: 'Business Plan',
    description: `Strategy, work programme, and operating context for ${NAME} — processes, data elements and documents in commerce, industry and administration.`,
    kind: 'webpage',
  },
  '/history': {
    label: 'History',
    description: `Five decades of milestones for ${NAME} — chairs and secretariats, plenary meetings, published standards, and structural changes since 1972.`,
    kind: 'webpage',
    jsonLdType: 'CollectionPage',
  },
  '/faq': {
    label: 'FAQ',
    description: `Frequently asked questions about ${NAME} standards and procedures.`,
    kind: 'faqPage',
  },
  '/procedures': {
    label: 'Procedures',
    description: `Operating procedures and submission processes of ${NAME}.`,
    kind: 'webpage',
  },
  '/contact': {
    label: 'Contact',
    description: `How to get in touch with ${NAME}.`,
    kind: 'contactPage',
  },
  '/acknowledgments': {
    label: 'Acknowledgments',
    description: `Errata reports, feedback, and improvements contributed to ${NAME} standards.`,
    kind: 'webpage',
  },
}

function collectionBreadcrumbs(entry: StaticRouteMeta, canonicalPath: string): { name: string; path: string }[] {
  const crumbs = [{ name: 'Home', path: '/' }]
  if (entry.parentBreadcrumb) crumbs.push(entry.parentBreadcrumb)
  crumbs.push({ name: entry.breadcrumbName ?? entry.label, path: canonicalPath })
  return crumbs
}

export function resolveStaticRouteMeta(
  cleanRoute: string,
  entry: StaticRouteMeta,
  cfg: SiteConfig = SITE_CONFIG,
): SeoMeta {
  const canonicalPath = `${cleanRoute}/`

  if (entry.kind === 'home') {
    return {
      title: `${cfg.committeeName} — Processes, data elements and documents in commerce, industry and administration`,
      description: entry.description,
      canonicalPath: '/',
      type: 'website',
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [organizationJsonLd(cfg), websiteJsonLd(cfg)],
      },
      breadcrumbs: [{ name: 'Home', path: '/' }],
    }
  }

  if (entry.kind === 'collection') {
    return {
      title: `${entry.label} | ${cfg.committeeName}`,
      description: entry.description,
      canonicalPath,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${entry.label} | ${cfg.committeeName}`,
        isPartOf: { '@id': `${cfg.siteUrl}/#website` },
      },
      breadcrumbs: collectionBreadcrumbs(entry, canonicalPath),
    }
  }

  if (entry.kind === 'faqPage') {
    return {
      title: `${entry.label} | ${cfg.committeeName}`,
      description: entry.description,
      canonicalPath,
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: entry.breadcrumbName ?? entry.label, path: canonicalPath },
      ],
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        isPartOf: { '@id': `${cfg.siteUrl}/#website` },
      },
    }
  }

  if (entry.kind === 'contactPage') {
    return {
      title: `${entry.label} | ${cfg.committeeName}`,
      description: entry.description,
      canonicalPath,
      breadcrumbs: [
        { name: 'Home', path: '/' },
        { name: entry.breadcrumbName ?? entry.label, path: canonicalPath },
      ],
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        isPartOf: { '@id': `${cfg.siteUrl}/#website` },
      },
    }
  }

  // webpage
  return {
    title: `${entry.label} | ${cfg.committeeName}`,
    description: entry.description,
    canonicalPath,
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: entry.breadcrumbName ?? entry.label, path: canonicalPath },
    ],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': entry.jsonLdType ?? 'WebPage',
      name: `${entry.label} | ${cfg.committeeName}`,
      isPartOf: { '@id': `${cfg.siteUrl}/#website` },
      about: { '@id': `${cfg.siteUrl}/#organization` },
    },
  }
}
