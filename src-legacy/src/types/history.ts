export type HistoryCategory =
  | 'founding'
  | 'leadership'
  | 'structure'
  | 'standard'
  | 'liaison'
  | 'meeting'
  | 'cooperation'
  | 'withdrawn'
  | string

export type DatePrecision = 'day' | 'month' | 'year'

export interface HistoryMilestone {
  date: string
  date_precision?: DatePrecision
  category: HistoryCategory
  title: string
  description?: string
  link?: string
  resolution?: string
  end_date?: string
  tags?: string[]
}
