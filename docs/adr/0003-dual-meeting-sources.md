# ADR 0003: two meeting sources by design

Date: 2026-09-05 (recorded at review 13; decided at review 4)

## Status

Accepted.

## Context

`data/meetings.yml` (xlsx-derived, canonical, every plenary) and
`_data/events/plenary-NN.yml` (rich content for recent plenaries)
overlapped in a hand-maintained edoxen tree — a triple-store.

## Decision

Keep exactly two sources: the canonical list (authority for ordinals,
dates, status) and the rich per-meeting files (authority for hosts,
venues, agendas, deadlines). The third tree (`_data/events-edoxen/`) is
generated on every build by `scripts/generate-edoxen-events.mjs` from
the two, plus the venue seed.

## Consequences

- Reviews do not re-suggest merging `data/` into `_data/`.
- The seed-drift spec and meetings invariants guard the generation.
