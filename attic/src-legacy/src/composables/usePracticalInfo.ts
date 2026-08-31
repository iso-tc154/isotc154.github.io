import { labelTable } from '../utils/labelTable'
import type { PracticalSection, PracticalValue } from '../types/event'

const LABEL_OVERRIDES: Record<string, string> = {
  eu_schengen: 'EU Schengen',
  info_url: 'Information URL',
  invitation_contact: 'Invitation Contact',
  invitation_email: 'Invitation email',
  required_info: 'Required information',
  badge_required: 'Badge required',
  badge_info: 'Badge',
  wifi: 'Wi-Fi',
  smoking: 'Smoking',
  electrical: 'Electrical',
  url: 'URL',
  museums_url: 'Museums URL',
  ifa_note: 'IFA note',
  ifa_url: 'IFA URL',
}

export const practicalLabel = labelTable(LABEL_OVERRIDES)

export function isSection(v: PracticalValue): v is PracticalSection {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function isStringList(v: PracticalValue): v is string[] {
  return Array.isArray(v)
}

export function isUrl(v: unknown): v is string {
  return typeof v === 'string' && /^https?:\/\//.test(v)
}

export function isEmail(v: unknown): v is string {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

export function practicalEntries(info: PracticalSection | undefined) {
  if (!info) return []
  return Object.entries(info).filter(([, v]) => {
    if (v == null || v === '') return false
    if (Array.isArray(v) && v.length === 0) return false
    return true
  }) as [string, PracticalValue][]
}

export function sectionEntries(section: PracticalSection) {
  return Object.entries(section).filter(([, v]) => {
    if (v == null || v === '') return false
    if (Array.isArray(v) && v.length === 0) return false
    if (typeof v === 'boolean' && v === false) return false
    return true
  }) as [string, PracticalValue][]
}

export function touristInfoAsSection(value: PracticalSection | unknown[]): PracticalSection {
  if (Array.isArray(value)) {
    const section: PracticalSection = {}
    value.forEach((item: any, i: number) => {
      section[item.name ?? `Item ${i + 1}`] = {
        link: item.link,
        notes: item.notes,
      } as PracticalSection
    })
    return section
  }
  return value as PracticalSection
}

export function usePracticalInfo() {
  return {
    practicalLabel,
    isSection,
    isStringList,
    isUrl,
    isEmail,
    practicalEntries,
    sectionEntries,
    touristInfoAsSection,
  }
}
