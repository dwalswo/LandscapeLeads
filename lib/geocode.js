const CENSUS_GEOCODER_URL =
  'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress'

// Free, no API key, US-only -- fits a Texas-only pre-validation budget.
// Falls back to { lat: null, lng: null } on any failure (bad address,
// network error, timeout) so signups never hard-fail on a geocoding hiccup.
export async function geocodeAddress(address) {
  if (!address) return { lat: null, lng: null }

  const url = new URL(CENSUS_GEOCODER_URL)
  url.searchParams.set('address', address)
  url.searchParams.set('benchmark', 'Public_AR_Current')
  url.searchParams.set('format', 'json')

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) })

    if (!response.ok) return { lat: null, lng: null }

    const data = await response.json()
    const match = data?.result?.addressMatches?.[0]

    if (!match?.coordinates) return { lat: null, lng: null }

    return { lat: match.coordinates.y, lng: match.coordinates.x }
  } catch (err) {
    console.error('Census geocoding failed:', err)
    return { lat: null, lng: null }
  }
}
