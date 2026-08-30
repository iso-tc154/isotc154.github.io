import { describe, it, expect } from 'vitest'
import {
  standardStatusLabel,
  projectStatusLabel,
  roleLabel,
  ordinalSuffix,
  ordinalText,
  initials,
  orgInitials,
  formatDate,
  formatDateCompact,
  formatDateLong,
  formatDatePrecision,
  postExcerpt,
  postTitle,
  postCategories,
  flagEmoji,
  groupCategoryLabel,
  membershipLabel,
  liaisonCategoryLabel,
  historyCategoryLabel,
  historyCategoryColor,
  historyCategoryKeys,
} from './presentation'

describe('standardStatusLabel', () => {
  it('maps known statuses', () => {
    expect(standardStatusLabel('published')).toBe('Published')
    expect(standardStatusLabel('withdrawn')).toBe('Withdrawn')
    expect(standardStatusLabel('under_development')).toBe('Under development')
    expect(standardStatusLabel('under-development')).toBe('Under development')
    expect(standardStatusLabel('under_review')).toBe('Under review')
  })
  it('title-cases unknown statuses and passes through empty', () => {
    expect(standardStatusLabel('mystage')).toBe('Mystage')
    expect(standardStatusLabel()).toBe('')
  })
})

describe('projectStatusLabel', () => {
  it('maps known statuses', () => {
    expect(projectStatusLabel('current')).toBe('Current')
    expect(projectStatusLabel('new')).toBe('New')
    expect(projectStatusLabel('withdrawn')).toBe('Withdrawn')
    expect(projectStatusLabel('under-development')).toBe('Under development')
  })
})

describe('roleLabel', () => {
  it('maps committee roles including hyphen and underscore variants', () => {
    expect(roleLabel('chair')).toBe('Chair')
    expect(roleLabel('convenor')).toBe('Convenor')
    expect(roleLabel('project_leader')).toBe('Project Leader')
    expect(roleLabel('project-leader')).toBe('Project Leader')
    expect(roleLabel('editorial_programme_manager')).toBe('Editorial Programme Manager')
  })
  it('falls back to the raw id', () => {
    expect(roleLabel('wizard')).toBe('wizard')
    expect(roleLabel()).toBe('')
  })
})

describe('ordinals', () => {
  it('suffices 1–3, 11–13, and the rest', () => {
    expect(ordinalText(1)).toBe('1st')
    expect(ordinalText(2)).toBe('2nd')
    expect(ordinalText(3)).toBe('3rd')
    expect(ordinalText(4)).toBe('4th')
    expect(ordinalText(11)).toBe('11th')
    expect(ordinalText(12)).toBe('12th')
    expect(ordinalText(13)).toBe('13th')
    expect(ordinalText(21)).toBe('21st')
    expect(ordinalText(111)).toBe('111th')
    expect(ordinalSuffix(0)).toBe('th')
  })
})

describe('initials vs orgInitials', () => {
  it('person initials take first and last letter', () => {
    expect(initials('Jane Smith')).toBe('JS')
    expect(initials('Ada')).toBe('A')
  })
  it('org monograms take the first two letters of a single word', () => {
    expect(orgInitials('DIN')).toBe('DI')
    expect(orgInitials('ISO')).toBe('IS')
    expect(orgInitials('International Org')).toBe('IO')
    expect(orgInitials('')).toBe('?')
  })
})

describe('date formatting', () => {
  it('formatDate renders long form deterministically (UTC)', () => {
    expect(formatDate('2026-08-30')).toBe('August 30, 2026')
    expect(formatDate('')).toBe('')
    expect(formatDate(undefined)).toBe('')
  })
  it('formatDateCompact renders day-month-year', () => {
    expect(formatDateCompact('2026-08-30')).toBe('30 Aug 2026')
    expect(formatDateCompact('not-a-date')).toBe('not-a-date')
  })
  it('formatDateLong includes the weekday', () => {
    expect(formatDateLong('2026-08-31')).toBe('Mon, Aug 31, 2026')
  })
  it('formatDatePrecision respects year/month precision', () => {
    expect(formatDatePrecision('1972-01-01', 'year')).toBe('1972')
    expect(formatDatePrecision('1972-03-01', 'month')).toBe('Mar 1972')
    expect(formatDatePrecision('1972-03-14')).toBe('Mar 14, 1972')
    expect(formatDatePrecision('')).toBe('')
  })
})

describe('post helpers', () => {
  it('excerpt strips markup and truncates with ellipsis', () => {
    expect(postExcerpt('<p>hello <b>world</b></p>')).toBe('hello world')
    const long = 'x'.repeat(300)
    expect(postExcerpt(long, 200)).toHaveLength(201)
    expect(postExcerpt(long, 200).endsWith('…')).toBe(true)
  })
  it('title falls back to a slugified name', () => {
    expect(postTitle('a-slug', 'A Title')).toBe('A Title')
    expect(postTitle('willkommen-in-berlin')).toBe('Willkommen In Berlin')
  })
  it('categories accept strings and arrays', () => {
    expect(postCategories('plenary, ballot')).toEqual(['plenary', 'ballot'])
    expect(postCategories(['a', 'b'])).toEqual(['a', 'b'])
    expect(postCategories(undefined)).toEqual([])
  })
})

describe('flagEmoji', () => {
  it('converts ISO country codes to flag code points', () => {
    expect(flagEmoji('DE')).toBe('🇩🇪')
    expect(flagEmoji('cn')).toBe('🇨🇳')
  })
  it('rejects invalid input', () => {
    expect(flagEmoji('')).toBe('')
    expect(flagEmoji('D')).toBe('')
    expect(flagEmoji('DEU')).toBe('')
    expect(flagEmoji(null)).toBe('')
  })
})

describe('groupCategoryLabel', () => {
  it('maps known categories', () => {
    expect(groupCategoryLabel('working')).toBe('Working Group')
    expect(groupCategoryLabel('cag')).toBe("Chairman's Advisory Group")
    expect(groupCategoryLabel('ahwg')).toBe('Ad Hoc Working Group')
    expect(groupCategoryLabel('rtc')).toBe('Resolution Drafting Group')
  })
  it('title-cases unknown categories and handles empty', () => {
    expect(groupCategoryLabel('squad')).toBe('Squad')
    expect(groupCategoryLabel()).toBe('')
  })
})

describe('membershipLabel', () => {
  it('expands P and O membership', () => {
    expect(membershipLabel('P')).toEqual({ short: 'P', long: 'Participating member' })
    expect(membershipLabel('O')).toEqual({ short: 'O', long: 'Observer member' })
    expect(membershipLabel()).toEqual({ short: '', long: '' })
  })
})

describe('liaisonCategoryLabel', () => {
  it('short form is the bare category', () => {
    expect(liaisonCategoryLabel('A')).toBe('Category A')
    expect(liaisonCategoryLabel('D')).toBe('Category D')
  })
  it('long form spells out cooperation levels', () => {
    expect(liaisonCategoryLabel('A', 'long')).toBe('Category A — Active cooperation')
    expect(liaisonCategoryLabel('B', 'long')).toBe('Category B — Kept informed')
    expect(liaisonCategoryLabel('C', 'long')).toBe('Category C')
  })
})

describe('history categories', () => {
  it('labels and colors known categories', () => {
    expect(historyCategoryLabel('founding')).toBe('Founding')
    expect(historyCategoryLabel('meeting')).toBe('Plenary meetings')
    expect(historyCategoryColor('founding')).toBe('#b91c1c')
    expect(historyCategoryLabel('mystery')).toBe('mystery')
  })
  it('exposes a fixed taxonomy order for filter chips', () => {
    expect(historyCategoryKeys()[0]).toBe('founding')
    expect(historyCategoryKeys()).toContain('withdrawn')
  })
})
