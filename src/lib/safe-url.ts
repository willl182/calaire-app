export function normalizeHttpUrl(value: string | null | undefined) {
  const trimmed = value?.trim()
  if (!trimmed) return null
  try {
    const url = new URL(trimmed)
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.toString()
  } catch {
    return null
  }
  return null
}

export function requireHttpUrl(value: string | null | undefined, fieldLabel: string) {
  const trimmed = value?.trim()
  if (!trimmed) return null
  const normalized = normalizeHttpUrl(trimmed)
  if (!normalized) throw new Error(`${fieldLabel} debe ser una URL http(s).`)
  return normalized
}
