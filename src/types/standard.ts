export interface StandardIso {
  name: string
  type?: string
  title?: string
  stage?: string
  ics?: string
  scope?: string
  publication_date?: string
  store_id?: number
  current_stage?: { code: string; description: string; edition: number }
}

export interface StandardTc154 {
  group?: string
  status?: string
  scope?: string
  introduction?: string
}

export interface Standard {
  iso: StandardIso
  tc154?: StandardTc154
  id: string
  url: string
}
