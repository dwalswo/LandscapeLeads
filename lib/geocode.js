import zipcodes from 'zipcodes'

export function geocodeZip(zipOrAddress) {
  const zipMatch = zipOrAddress?.match(/\b\d{5}\b/)
  if (!zipMatch) return { lat: null, lng: null }

  const result = zipcodes.lookup(zipMatch[0])
  if (!result) return { lat: null, lng: null }

  return { lat: result.latitude, lng: result.longitude }
}
