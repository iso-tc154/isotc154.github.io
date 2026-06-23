import {
  organizationJsonLd,
  websiteJsonLd,
  type SeoMeta,
  type SiteConfig,
} from '../utils/seo'

type MetaBuilder = (cfg: SiteConfig) => SeoMeta

function homeMeta(cfg: SiteConfig): SeoMeta {
  return {
    title: `${cfg.committeeName} — Processes, data elements and documents in commerce, industry and administration`,
    description: `${cfg.committeeFull}. Browse ISO/TC 154 standards, plenary meetings, resolutions, and members.`,
    canonicalPath: '/',
    type: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [organizationJsonLd(cfg), websiteJsonLd(cfg)],
    },
    breadcrumbs: [{ name: 'Home', path: '/' }],
  }
}

function collectionMeta(
  cfg: SiteConfig,
  path: string,
  title: string,
  description: string,
  breadcrumbs: { name: string; path: string }[],
): SeoMeta {
  return {
    title: `${title} | ${cfg.committeeName}`,
    description,
    canonicalPath: `${path}/`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${title} | ${cfg.committeeName}`,
      isPartOf: { '@id': `${cfg.siteUrl}/#website` },
    },
    breadcrumbs,
  }
}

function staticPageMeta(
  cfg: SiteConfig,
  path: string,
  label: string,
  description: string,
  type = 'WebPage' as string,
): SeoMeta {
  return {
    title: `${label} | ${cfg.committeeName}`,
    description,
    canonicalPath: `${path}/`,
    breadcrumbs: [{ name: 'Home', path: '/' }, { name: label, path: `${path}/` }],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': type,
      name: `${label} | ${cfg.committeeName}`,
      isPartOf: { '@id': `${cfg.siteUrl}/#website` },
      about: { '@id': `${cfg.siteUrl}/#organization` },
    },
  }
}

const N = (cfg: SiteConfig) => cfg.committeeName
const H = (path = '/', label = 'Home') => ({ name: label, path })

export const STATIC_ROUTES: Record<string, MetaBuilder> = {
  '/': homeMeta,

  '/resolutions': (cfg) =>
    collectionMeta(cfg, '/resolutions', 'Resolutions',
      `Search and browse resolutions adopted by ${N(cfg)} since its first plenary.`,
      [H(), { name: 'Resolutions', path: '/resolutions/' }]),

  '/resolutions/meetings': (cfg) =>
    collectionMeta(cfg, '/resolutions/meetings', 'Meetings Timeline',
      `Browse ${N(cfg)} resolutions grouped by plenary meeting and ballot.`,
      [H(), { name: 'Resolutions', path: '/resolutions/' }, { name: 'Meetings', path: '/resolutions/meetings/' }]),

  '/members': (cfg) =>
    collectionMeta(cfg, '/members', 'Members',
      `Experts from national bodies, liaisons, and the Committee Advisory Group of ${N(cfg)}.`,
      [H(), { name: 'Members', path: '/members/' }]),

  '/groups': (cfg) =>
    collectionMeta(cfg, '/groups', 'Groups',
      `Working Groups, Advisory Groups, and Maintenance Agencies of ${N(cfg)}.`,
      [H(), { name: 'Groups', path: '/groups/' }]),

  '/standards': (cfg) =>
    collectionMeta(cfg, '/standards', 'Standards',
      `International Standards published by ${N(cfg)} — processes, data elements and documents in commerce, industry and administration.`,
      [H(), { name: 'Standards', path: '/standards/' }]),

  '/liaisons': (cfg) =>
    collectionMeta(cfg, '/liaisons', 'Liaisons',
      `External organizations in liaison with ${N(cfg)}.`,
      [H(), { name: 'Liaisons', path: '/liaisons/' }]),

  '/national-bodies': (cfg) =>
    collectionMeta(cfg, '/national-bodies', 'National Bodies',
      `National standards bodies participating in ${N(cfg)}.`,
      [H(), { name: 'National Bodies', path: '/national-bodies/' }]),

  '/projects': (cfg) =>
    collectionMeta(cfg, '/projects', 'Projects',
      `Standards under development by ${N(cfg)}.`,
      [H(), { name: 'Projects', path: '/projects/' }]),

  '/meetings': (cfg) =>
    collectionMeta(cfg, '/meetings', 'Plenary Meetings',
      `Every plenary meeting of ${N(cfg)}, hosted annually by national bodies — venues, dates, resolutions, briefings.`,
      [H(), { name: 'Meetings', path: '/meetings/' }]),

  '/posts': (cfg) =>
    collectionMeta(cfg, '/posts', 'News',
      `Publications, announcements, and obituaries from ${N(cfg)}.`,
      [H(), { name: 'News', path: '/posts/' }]),

  '/about': (cfg) =>
    staticPageMeta(cfg, '/about', 'About',
      `About ${N(cfg)} — ${cfg.committeeFull.toLowerCase()}.`, 'AboutPage'),

  '/business-plan': (cfg) =>
    staticPageMeta(cfg, '/business-plan', 'Business Plan',
      `Strategy, work programme, and operating context for ${N(cfg)} — processes, data elements and documents in commerce, industry and administration.`),

  '/history': (cfg) =>
    staticPageMeta(cfg, '/history', 'History',
      `Five decades of milestones for ${N(cfg)} — chairs and secretariats, plenary meetings, published standards, and structural changes since 1972.`,
      'CollectionPage'),

  '/faq': (cfg) => ({
    title: `FAQ | ${N(cfg)}`,
    description: `Frequently asked questions about ${N(cfg)} standards and procedures.`,
    canonicalPath: '/faq/',
    breadcrumbs: [H(), { name: 'FAQ', path: '/faq/' }],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      isPartOf: { '@id': `${cfg.siteUrl}/#website` },
    },
  }),

  '/procedures': (cfg) =>
    staticPageMeta(cfg, '/procedures', 'Procedures',
      `Operating procedures and submission processes of ${N(cfg)}.`),

  '/contact': (cfg) => ({
    title: `Contact | ${N(cfg)}`,
    description: `How to get in touch with ${N(cfg)}.`,
    canonicalPath: '/contact/',
    breadcrumbs: [H(), { name: 'Contact', path: '/contact/' }],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      isPartOf: { '@id': `${cfg.siteUrl}/#website` },
    },
  }),

  '/acknowledgments': (cfg) =>
    staticPageMeta(cfg, '/acknowledgments', 'Acknowledgments',
      `Errata reports, feedback, and improvements contributed to ${N(cfg)} standards.`),
}
