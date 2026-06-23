import { SITE_CONFIG, type SeoMeta, type SiteConfig } from './seo'
import { STATIC_ROUTES } from '../data/routeMetaTable'
import {
  DETAIL_MATCHERS,
  genericPageHydrate,
  type RouteMetaContext,
  type RouteMetaEntity,
} from '../domain/routeMetaHydrate'

export type { RouteMetaContext, RouteMetaEntity } from '../domain/routeMetaHydrate'

export function computeRouteMeta(
  route: string,
  ctx: RouteMetaContext,
  cfg: SiteConfig = SITE_CONFIG,
): SeoMeta {
  const cleanRoute = route.replace(/\/+$/, '') || '/'

  const staticBuilder = STATIC_ROUTES[cleanRoute]
  if (staticBuilder) return staticBuilder(cfg)

  const parts = cleanRoute.split('/').filter(Boolean)
  for (const matcher of DETAIL_MATCHERS) {
    if (matcher.predicate(parts)) {
      return matcher.hydrate(parts, cleanRoute, ctx, cfg)
    }
  }

  return genericPageHydrate(parts, cleanRoute, ctx, cfg)
}

export function entitiesNeededForRoute(route: string): RouteMetaEntity[] {
  const cleanRoute = route.replace(/\/+$/, '') || '/'
  if (STATIC_ROUTES[cleanRoute]) return []

  const parts = cleanRoute.split('/').filter(Boolean)
  for (const matcher of DETAIL_MATCHERS) {
    if (matcher.predicate(parts)) {
      return matcher.entityKind ? [matcher.entityKind] : []
    }
  }
  return ['pages']
}
