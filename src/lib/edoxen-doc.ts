// The edoxen DecisionCollection document shape — one definition shared by
// the meeting page (renders the plenary's resolutions) and the legacy
// redirect generator (maps old /resolutions/ URLs to /decisions/ URNs).
// The YAML files themselves live in the resolutions-data submodule and are
// staged into _data/resolutions-edoxen at build time.

export interface EdoxenDecisionDoc {
  decisions?: {
    urn?: string
    kind?: string
    status?: string
    identifier?: { number?: string | number }[]
    title?: { value?: string }[]
    subject?: { value?: string }[]
    actions?: { message?: { value?: string }[] }[]
  }[]
}

export interface ResolutionCard {
  id: string
  urn: string
  title: string
  subject: string
  kind: string
  isAcclamation: boolean
}

export function resolutionCards(doc: EdoxenDecisionDoc): ResolutionCard[] {
  return (doc.decisions ?? []).map((d) => ({
    id: (d.urn?.split(':').pop() ?? d.urn ?? ''),
      urn: d.urn ?? '',
    title: d.title?.[0]?.value ?? '',
    subject: d.subject?.[0]?.value ?? '',
    kind: d.kind ?? 'resolution',
    isAcclamation: d.kind === 'acclamation' || d.status === 'acclaimed',
  }))
}

/** Legacy redirect entries: /resolutions/{sub}/{file}/{number} → /decisions/{urn}/ */
export function decisionRedirects(doc: EdoxenDecisionDoc, sub: string, sourceFile: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const d of doc.decisions ?? []) {
    const id = d.identifier?.[0]?.number
    if (!d.urn || id == null) continue
    out[`/resolutions/${sub}/${sourceFile}/${id}`] = `/decisions/${d.urn}/`
  }
  return out
}
