export interface Liaison {
  id: string
  name: string
  short_name?: string
  aliases?: string[]
  category?: string
  url?: string
  logo?: string
  logo_light?: string
  logo_dark?: string
  description?: string
}

export interface NationalBody {
  id: string
  name: string
  short_name?: string
  aliases?: string[]
  iso_country_code?: string
  country?: string
  membership?: 'P' | 'O' | string
  former?: boolean
  former_until?: number | string
  url?: string
  logo?: string
  logo_light?: string
  logo_dark?: string
  description?: string
}

export function membershipLabel(m?: string): { short: string; long: string } {
  if (m === 'P') return { short: 'P', long: 'Participating member' }
  if (m === 'O') return { short: 'O', long: 'Observer member' }
  return { short: m || '', long: m || '' }
}
