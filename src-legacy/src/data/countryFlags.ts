const COUNTRY_CODE_MAP: Record<string, string> = {
  'germany': 'DE',
  'united states': 'US',
  'usa': 'US',
  'united kingdom': 'GB',
  'uk': 'GB',
  'china': 'CN',
  'france': 'FR',
  'korea': 'KR',
  'south korea': 'KR',
  'japan': 'JP',
  'italy': 'IT',
  'switzerland': 'CH',
  'australia': 'AU',
  'sweden': 'SE',
  'norway': 'NO',
  'canada': 'CA',
  'portugal': 'PT',
  'south africa': 'ZA',
  'spain': 'ES',
  'netherlands': 'NL',
  'the netherlands': 'NL',
  'hong kong': 'HK',
  'hong kong sar': 'HK',
  'hong kong, china': 'HK',
  'macao': 'MO',
  'macau': 'MO',
  'taiwan': 'TW',
  'austria': 'AT',
  'czech republic': 'CZ',
  'czechia': 'CZ',
  'denmark': 'DK',
  'finland': 'FI',
  'india': 'IN',
  'singapore': 'SG',
  'malaysia': 'MY',
  'indonesia': 'ID',
}

function countryCodeToEmoji(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
}

export function countryCodeToFlag(code: string | undefined | null): string {
  if (!code) return ''
  const trimmed = code.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(trimmed)) return ''
  return countryCodeToEmoji(trimmed)
}

export function venueToCountryCode(venue: string | undefined | null): string {
  if (!venue) return ''
  const lower = venue.toLowerCase().trim()
  if (lower === 'virtual' || lower.includes('virtual')) return ''
  // Try the full string first (handles "Hong Kong, China" → HK).
  if (COUNTRY_CODE_MAP[lower]) return COUNTRY_CODE_MAP[lower]
  // Then try each comma-separated segment first-to-last, returning the first
  // match. This lets "Hong Kong, China" resolve to HK (SAR) before CN.
  const parts = venue.split(',').map(p => p.trim().toLowerCase()).filter(Boolean)
  for (const p of parts) {
    if (COUNTRY_CODE_MAP[p]) return COUNTRY_CODE_MAP[p]
  }
  return ''
}

export function venueToCountryFlag(venue: string | undefined | null): string {
  if (!venue) return ''
  const lower = venue.toLowerCase().trim()
  if (lower === 'virtual' || lower.includes('virtual')) return '🌐'
  return countryCodeToFlag(venueToCountryCode(venue))
}

export const venueToFlag = venueToCountryFlag
