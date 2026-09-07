# ADR 0004: image masters live outside public/

Date: 2026-09-07 (reviews 12–13)

## Status

Accepted.

## Context

`public/` conflated source and output: a 5906×5906 logo master shipped
as a 649 KB payload, and optimizing in place would have destroyed
irreplaceable originals.

## Decision

Oversized image masters are committed under `_data/image-masters/`
(preserved source, never deleted). Display-sized derivatives are
generated at the original `public/assets/...` paths (sharp palette
PNGs / resized mozjpeg JPEGs). References stay stable; the asset-budget
contract gates the shipped bytes.

## Consequences

- The next oversized upload follows the same split: master into
  `_data/image-masters/`, derivative into `public/`.
- `welcome_illo.jpg` (referenced only by `attic/`) lost its shipped
  copy; its master is retained.
