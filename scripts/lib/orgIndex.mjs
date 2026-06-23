// Organisation lookup index used to resolve national-body / liaison /
// associate mentions across the site (resolutions, meetings, etc).
//
// The index maps any of an organisation's known names (id, short_name,
// legal name, aliases, "SHORT (Country)" forms) to a canonical record.
// When a name collides across organisation classes, the more canonical
// source wins: national bodies outrank liaisons outrank associates.

import { liaisonPath, nationalBodyPath } from '../../src/utils/urn.ts'

const ORG_RANK = {
  'national-body': 3,
  liaison: 2,
  associate: 1,
}

function normalizeKey(s) {
  return String(s || '').trim().toLowerCase()
}

function buildRecord(org, type) {
  return {
    ref: org.id,
    type,
    kind: type,
    name: org.short_name || org.name,
    short_name: org.short_name,
    url: org.url,
    path:
      type === 'liaison'
        ? liaisonPath(org.id)
        : type === 'associate'
          ? null
          : nationalBodyPath(org.id),
    logo: org.logo,
    logo_light: org.logo_light,
    logo_dark: org.logo_dark,
    country: org.country,
    category: org.category,
  }
}

function collectKeys(org) {
  const keys = new Set()
  keys.add(org.id)
  if (org.short_name) keys.add(org.short_name)
  if (Array.isArray(org.aliases)) org.aliases.forEach((a) => keys.add(a))
  keys.add(org.name)
  if (org.short_name && org.country) keys.add(`${org.short_name} (${org.country})`)
  return keys
}

export function buildOrgIndex(nationalBodies, liaisons, associates) {
  const byKey = new Map()

  const add = (org, type) => {
    if (!org || !org.id) return
    const record = buildRecord(org, type)
    for (const k of collectKeys(org)) {
      const nk = normalizeKey(k)
      if (!nk) continue
      const existing = byKey.get(nk)
      if (!existing || ORG_RANK[type] > ORG_RANK[existing.type]) {
        byKey.set(nk, { record, type })
      }
    }
  }

  // Add associates first so NBs/liaisons override on collision.
  for (const a of associates || []) add(a, 'associate')
  for (const l of liaisons || []) add(l, 'liaison')
  for (const nb of nationalBodies || []) add(nb, 'national-body')

  return {
    lookup(token, hintType) {
      const match = byKey.get(normalizeKey(token))
      if (!match) return null
      if (hintType && match.type !== hintType) return null
      return match.record
    },
    lookupAny(token, hintTypes) {
      const match = byKey.get(normalizeKey(token))
      if (!match) return null
      if (hintTypes && hintTypes.length && !hintTypes.includes(match.type)) return null
      return match.record
    },
  }
}
