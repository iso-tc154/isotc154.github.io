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

export function venueToCountryCode(venue: string | undefined | null): string {
  if (!venue) return ''
  const lower = venue.toLowerCase().trim()
  if (lower === 'virtual' || lower.includes('virtual')) return ''
  const parts = venue.split(',')
  const countryName = parts[parts.length - 1].trim().toLowerCase()
  return COUNTRY_CODE_MAP[countryName] || ''
}

export function venueToCountryFlag(venue: string | undefined | null): string {
  if (!venue) return ''
  const lower = venue.toLowerCase().trim()
  if (lower === 'virtual' || lower.includes('virtual')) return '🌐'
  const code = venueToCountryCode(venue)
  return code ? countryCodeToEmoji(code) : ''
}

export const venueToFlag = venueToCountryFlag
