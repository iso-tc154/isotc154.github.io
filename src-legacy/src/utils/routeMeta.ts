import { SITE_CONFIG, type SeoMeta, type SiteConfig } from './seo'
import { STATIC_ROUTE_META, resolveStaticRouteMeta } from './staticRouteMeta'
import {
  DYNAMIC_ROUTE_RESOLVERS,
  type RouteMetaContext,
} from './dynamicRouteResolvers'

export type { RouteMetaContext } from './dynamicRouteResolvers'

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function firstParagraph(html: string): string {
  const m = html.match(/<p[^>]*>([\s\S]*?)<\/p>/)
  return m ? stripHtml(m[1]) : ''
}

// Resolves per-route SEO metadata via a three-stage pipeline:
//   1. Static routes (list pages, about, faq, contact, ...) — looked up from
//      STATIC_ROUTE_META. Adding one is a one-line table edit.
//   2. Dynamic detail routes — looked up from DYNAMIC_ROUTE_RESOLVERS. Adding
//      one is a new entry in that registry.
//   3. Generic page lookup (AsciiDoc pages, agenda, ...) — fallback.
export function computeRouteMeta(
  route: string,
  ctx: RouteMetaContext,
  cfg: SiteConfig = SITE_CONFIG,
): SeoMeta {
  const cleanRoute = route.replace(/\/+$/, '') || '/'
  const parts = cleanRoute.split('/').filter(Boolean)

  const staticEntry = STATIC_ROUTE_META[cleanRoute]
  if (staticEntry) return resolveStaticRouteMeta(cleanRoute, staticEntry, cfg)

  const resolver = DYNAMIC_ROUTE_RESOLVERS.find((r) => r.matches(parts))
  if (resolver) return resolver.resolve(parts, ctx, cfg)

  // Generic page lookup (AsciiDoc pages, agenda, etc.)
  const genericPage =
    ctx.pages.find((p) => p.url === `${cleanRoute}/` || p.frontmatter?.permalink === `${cleanRoute}/`) ||
    ctx.pages.find((p) => p.slug === parts[parts.length - 1])
  const genericHeadline = genericPage?.frontmatter?.title
  const genericDesc = genericPage?.html
    ? firstParagraph(genericPage.html).slice(0, 160)
    : undefined

  return {
    title: genericHeadline ? `${genericHeadline} | ${cfg.committeeName}` : cfg.committeeName,
    description: genericDesc || cfg.committeeFull,
    canonicalPath: `${cleanRoute}/`,
    breadcrumbs: genericHeadline
      ? [{ name: 'Home', path: '/' }, { name: genericHeadline, path: `${cleanRoute}/` }]
      : undefined,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: genericHeadline || cfg.committeeName,
      isPartOf: { '@id': `${cfg.siteUrl}/#website` },
    },
  }
}
