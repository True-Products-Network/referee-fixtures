// Travel time calculation using Google Maps Distance Matrix API
// Lightweight implementation - no heavy SDK needed

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY

interface TravelResult {
  distanceMiles: number
  durationMinutes: number
  durationInTrafficMinutes: number | null
  origin: string
  destination: string
}

export async function calculateTravel(
  origin: string,
  destination: string
): Promise<TravelResult | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('GOOGLE_MAPS_API_KEY not set, using default travel time')
    return null
  }

  if (!origin || !destination) {
    return null
  }

  try {
    const params = new URLSearchParams({
      origins: origin,
      destinations: destination,
      mode: 'driving',
      departure_time: 'now',
      key: GOOGLE_MAPS_API_KEY,
    })

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`
    )

    if (!res.ok) {
      throw new Error(`Distance Matrix API error: ${res.status}`)
    }

    const data = await res.json()

    if (data.status !== 'OK' || !data.rows?.[0]?.elements?.[0]) {
      console.warn('Distance Matrix API returned:', data.status)
      return null
    }

    const element = data.rows[0].elements[0]

    if (element.status !== 'OK') {
      return null
    }

    // Convert meters to miles
    const distanceMiles = element.distance.value / 1609.344
    // Convert seconds to minutes
    const durationMinutes = Math.ceil(element.duration.value / 60)
    const durationInTrafficMinutes = element.duration_in_traffic
      ? Math.ceil(element.duration_in_traffic.value / 60)
      : null

    return {
      distanceMiles,
      durationMinutes,
      durationInTrafficMinutes,
      origin,
      destination,
    }
  } catch (err) {
    console.error('Travel calculation failed:', err)
    return null
  }
}

// Cache travel estimates in memory (simple LRU would be better for production)
const travelCache = new Map<string, TravelResult>()
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

function getCacheKey(origin: string, destination: string): string {
  return `${origin.trim().toLowerCase()}|${destination.trim().toLowerCase()}`
}

export async function calculateTravelWithCache(
  origin: string,
  destination: string
): Promise<TravelResult | null> {
  const key = getCacheKey(origin, destination)
  const cached = travelCache.get(key)

  if (cached) {
    return cached
  }

  const result = await calculateTravel(origin, destination)

  if (result) {
    travelCache.set(key, result)
  }

  return result
}

// Default travel time fallback when API is unavailable
export function getDefaultTravelTime(): number {
  return 30 // 30 minutes
}
