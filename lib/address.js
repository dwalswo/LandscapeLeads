export function cityOnly(address) {
  if (!address) return ''

  const zipMatch = address.match(/\b\d{5}(?:-\d{4})?\b/)

  // Strip the zip and a trailing state abbreviation, then take the last
  // remaining comma-separated segment as the city.
  const withoutZip = zipMatch ? address.slice(0, zipMatch.index) : address
  const withoutState = withoutZip.replace(/\b[A-Z]{2}\s*$/, '')
  const segments = withoutState
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  return segments[segments.length - 1] ?? ''
}
