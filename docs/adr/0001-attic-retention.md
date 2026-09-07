# ADR 0001: attic/ is retained, never referenced

Date: 2026-09-05 (recorded at review 13; decided at review 3)

## Status

Accepted.

## Context

The site migrated twice — Jekyll, then a Vue/vite-ssg tree, then Astro.
The retired trees were moved to `attic/` with `git mv` (history intact).

## Decision

`attic/` stays in the repository permanently. Nothing in the build may
reference it. It is not deleted, not pruned, and not "cleaned up".

## Consequences

- Future architecture reviews do not re-suggest removing it.
- The global no-delete rule applies: source trees are never destroyed,
  only superseded.
