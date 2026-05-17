// POI registry — single source of truth for routable destinations.
//
// Adding a new POI (e.g. Castello Sforzesco, a meditation point):
//   1. Append a row to EXTRA_POIS below.
//   2. Run `npm run build:routes` to extend the route cache.
//
// IDs are stable strings used as cache keys in routes.generated.json,
// so renaming an id invalidates that POI's cached pairs.

import { RELICS, type City } from './relics'

export type LatLng = [number, number]

export type POIType = 'church' | 'castle' | 'meditation' | 'square' | 'museum' | 'kloster' | 'tavern' | 'other'

export interface POI {
  id: string
  name: string
  coord: LatLng
  city: City
  type: POIType
}

// Hand-curated POIs that aren't relic locations.
// Coordinates are OSM-friendly (entry doors / public spaces, not building centroids).
const EXTRA_POIS: POI[] = [
  {
    id: 'castello-sforzesco',
    name: 'Castello Sforzesco',
    coord: [45.47028, 9.17944],
    city: 'milano',
    type: 'castle',
  },
  // ── Rest places: churches & klosters ──
  {
    id: 'san-maurizio',
    name: 'Monastero di San Maurizio',
    coord: [45.4654, 9.1769],
    city: 'milano',
    type: 'kloster',
  },
  {
    id: 'san-marco',
    name: 'Basilica di San Marco',
    coord: [45.4725, 9.1886],
    city: 'milano',
    type: 'church',
  },
  {
    id: 'san-pietro-gessate',
    name: 'San Pietro in Gessate',
    coord: [45.4622, 9.2025],
    city: 'milano',
    type: 'church',
  },
  {
    id: 'san-calimero',
    name: 'Basilica di San Calimero',
    coord: [45.4563, 9.1883],
    city: 'milano',
    type: 'church',
  },
  // ── Rest places: taverns ──
  {
    id: 'locanda-falcone',
    name: 'Locanda al Falcone',
    coord: [45.4698, 9.1792],
    city: 'milano',
    type: 'tavern',
  },
  {
    id: 'osteria-pellegrini',
    name: 'Osteria dei Pellegrini',
    coord: [45.4619, 9.1821],
    city: 'milano',
    type: 'tavern',
  },
  {
    id: 'bettolino-vetra',
    name: 'Bettolino della Vetra',
    coord: [45.4565, 9.1838],
    city: 'milano',
    type: 'tavern',
  },
  {
    id: 'santa-maria-delle-grazie',
    name: 'Santa Maria delle Grazie',
    coord: [45.46593, 9.17076],
    city: 'milano',
    type: 'church',
  },
  {
    id: 'colonne-di-san-lorenzo',
    name: 'Colonne di San Lorenzo',
    coord: [45.45762, 9.18582],
    city: 'milano',
    type: 'other',
  },
  {
    id: 'piazza-mercanti',
    name: 'Piazza dei Mercanti',
    coord: [45.46510, 9.18852],
    city: 'milano',
    type: 'square',
  },
  {
    id: 'san-babila',
    name: 'Piazza San Babila',
    coord: [45.46762, 9.19846],
    city: 'milano',
    type: 'square',
  },
]

// Relic locations are POIs too. Multiple relics housed in the same building
// (e.g. main church + crypt + side chapel) collapse to ONE routable POI:
//   - Strip parenthetical sub-locations from the church name before slugifying
//     ("Duomo di Milano (Crypt)" → "Duomo di Milano").
//   - Then merge anything within COALESCE_RADIUS_M of an already-kept POI,
//     even if names differ (catches "Cappella Portinari, Basilica di Sant'Eustorgio").
const COALESCE_RADIUS_M = 50

function relicPOIs(): POI[] {
  const out: POI[] = []
  const seenIds = new Set<string>()
  for (const r of RELICS) {
    const cleanName = r.church.replace(/\s*\(.*?\)\s*/g, '').trim()
    const id = `relic:${slugify(cleanName)}`
    if (seenIds.has(id)) continue
    if (out.some(p => p.city === r.city && metersBetween([r.lat, r.lng], p.coord) < COALESCE_RADIUS_M)) continue
    seenIds.add(id)
    out.push({
      id,
      name: cleanName,
      coord: [r.lat, r.lng],
      city: r.city,
      type: 'church',
    })
  }
  return out
}

function metersBetween(a: LatLng, b: LatLng): number {
  const R = 6371000
  const dLat = (b[0] - a[0]) * Math.PI / 180
  const dLng = (b[1] - a[1]) * Math.PI / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export const POIS: POI[] = [...relicPOIs(), ...EXTRA_POIS]

export function getPOI(id: string): POI | undefined {
  return POIS.find(p => p.id === id)
}

// Stable cache key for a POI pair, direction-independent.
// A→B and B→A share one cache entry; consumers reverse the polyline as needed.
export function pairKey(aId: string, bId: string): { key: string; reversed: boolean } {
  return aId <= bId
    ? { key: `${aId}|${bId}`, reversed: false }
    : { key: `${bId}|${aId}`, reversed: true }
}

// Find the nearest registered POI to an arbitrary lat/lng (for snapping the
// pilgrim's current position to a routable origin).
export function nearestPOI(coord: LatLng, city?: City): POI {
  const candidates = city ? POIS.filter(p => p.city === city) : POIS
  let best = candidates[0]
  let bestD = Infinity
  for (const p of candidates) {
    const d = haversineSqApprox(coord, p.coord)
    if (d < bestD) { bestD = d; best = p }
  }
  return best
}

function haversineSqApprox(a: LatLng, b: LatLng): number {
  const dLat = a[0] - b[0]
  const dLng = (a[1] - b[1]) * Math.cos((a[0] * Math.PI) / 180)
  return dLat * dLat + dLng * dLng
}
