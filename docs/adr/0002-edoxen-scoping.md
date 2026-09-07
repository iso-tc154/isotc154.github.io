# ADR 0002: @edoxen/browser owns /decisions/ only

Date: 2026-09-05 (recorded at review 13; decided at the Astro migration)

## Status

Accepted.

## Context

`@edoxen/browser` once rendered both meetings and decisions. The edoxen
meeting UI dropped the agenda/venue briefing the committee wanted, and
the site needed native pages for meetings.

## Decision

The host integration (`src/integrations/edoxen-host.ts`) disables the
package's route injection and re-injects exactly two routes:
`/decisions` and `/decisions/[urn]`. Every other route is native Astro.
The decisions pages carry their own palette (`override.css` `--ov-*`
mirror) because they never load `main.css`; the inline theme bridge
keeps both halves' dark-mode state in sync.

## Consequences

- Reviews do not re-suggest "unifying" the two page trees or their CSS.
- Meeting pages stay native; the edoxen event documents remain a
  generated view (`_data/events-edoxen/`), never hand-edited.
