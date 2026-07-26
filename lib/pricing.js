const BASE_PRICE = 4.99
const MAX_BONUS = 5
const MAX_DISTANCE_MILES = 10

export function computeLeadPrice(distanceMiles) {
  if (distanceMiles == null) return BASE_PRICE

  const clamped = Math.min(Math.max(distanceMiles, 0), MAX_DISTANCE_MILES)
  const price = BASE_PRICE + (1 - clamped / MAX_DISTANCE_MILES) * MAX_BONUS

  return Math.round(price * 100) / 100
}
