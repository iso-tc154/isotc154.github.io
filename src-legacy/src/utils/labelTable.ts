export function titleCaseKey(key: string): string {
  return key.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function labelTable(
  overrides: Record<string, string>,
  fallback: (key: string) => string = titleCaseKey,
): (key: string) => string {
  return (key) => overrides[key] ?? fallback(key)
}
