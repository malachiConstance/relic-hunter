// Procession routing.
//
// Resolution order for a given from/to:
//   1. Manual override in SACRED_PATH_OVERRIDES (hand-authored ceremonial route)
//   2. Cached OSM pedestrian variants in routes.generated.json (LRU-rotated)
//   3. Straight line + console warn (means: run `npm run build:routes`)
//
// The from/to may be arbitrary lat/lng — we snap each end to the nearest POI
// and prepend/append the actual coordinates so the avatar starts and ends
// exactly where the caller expects.

import { SACRED_PATH_OVERRIDES, type LatLng } from '../data/sacredPaths'
import { POIS, nearestPOI, pairKey, type POI } from '../data/pois'
import generatedRoutes from '../data/routes.generated.json'
import { useGameStore } from '../store/useGameStore'

export type { LatLng }

export const WALK_SPEED_MPS = 70    // cinematic: full centro storico ~20 s
export const ANIM_INTERVAL_MS = 100


interface CachedVariant {
  waypoints: LatLng[]
  meters: number
}
const ROUTE_CACHE = generatedRoutes as unknown as Record<string, CachedVariant[]>

// ── Distance ──────────────────────────────────────────────────────────────────

export function haversineM(a: LatLng, b: LatLng): number {
  const R = 6371000
  const dLat = (b[0] - a[0]) * Math.PI / 180
  const dLng = (b[1] - a[1]) * Math.PI / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface ProcessionRoute {
  waypoints: LatLng[]
  totalMeters: number
  steps: number
  source: 'override' | 'osm' | 'fallback'
  variantIndex: number
}

export function buildProcessionRoute(from: LatLng, to: LatLng): ProcessionRoute | null {
  const fromPOI = nearestPOI(from)
  const toPOI = nearestPOI(to)
  const pair = pairKey(fromPOI.id, toPOI.id)

  let core: LatLng[]
  let source: ProcessionRoute['source']
  let variantIndex = 0

  const override = SACRED_PATH_OVERRIDES[pair.key]
  const cached = ROUTE_CACHE[pair.key]

  if (override && override.length >= 2) {
    core = pair.reversed ? [...override].reverse() : override
    source = 'override'
  } else if (cached && cached.length > 0) {
    variantIndex = useGameStore.getState().pickAndAdvanceVariant(pair.key, cached.length)
    const picked = cached[variantIndex].waypoints
    core = pair.reversed ? [...picked].reverse() : picked
    source = 'osm'
  } else {
    if (fromPOI.id !== toPOI.id) {
      console.error(`[pathRouter] No OSM route for ${pair.key} — run 'npm run build:routes'`)
    }
    return null
  }

  // Stitch: caller's exact start/end onto the routed core.
  const waypoints: LatLng[] = dedupeAdjacent([from, ...core, to])

  let totalMeters = 0
  for (let i = 0; i < waypoints.length - 1; i++) {
    totalMeters += haversineM(waypoints[i], waypoints[i + 1])
  }

  const steps = Math.max(20, Math.round((totalMeters / WALK_SPEED_MPS) * (1000 / ANIM_INTERVAL_MS)))

  return { waypoints, totalMeters, steps, source, variantIndex }
}

function dedupeAdjacent(pts: LatLng[]): LatLng[] {
  const out: LatLng[] = []
  for (const p of pts) {
    const prev = out[out.length - 1]
    if (!prev || haversineM(prev, p) > 0.5) out.push(p)
  }
  return out.length >= 2 ? out : pts
}

// Precomputed cumulative segment distances for smooth interpolation
export function segmentDistances(waypoints: LatLng[]): number[] {
  return waypoints.slice(0, -1).map((p, i) => haversineM(p, waypoints[i + 1]))
}

// Position along path at fractional progress [0..1]
export function positionAtProgress(
  waypoints: LatLng[],
  segDists: number[],
  totalMeters: number,
  progress: number,
): LatLng {
  const target = progress * totalMeters
  let acc = 0
  for (let i = 0; i < segDists.length; i++) {
    if (acc + segDists[i] >= target || i === segDists.length - 1) {
      const t = segDists[i] > 0 ? Math.min(1, (target - acc) / segDists[i]) : 1
      return [
        waypoints[i][0] + (waypoints[i + 1][0] - waypoints[i][0]) * t,
        waypoints[i][1] + (waypoints[i + 1][1] - waypoints[i][1]) * t,
      ]
    }
    acc += segDists[i]
  }
  return waypoints[waypoints.length - 1]
}

// Re-export so existing imports keep working.
export { POIS, nearestPOI }
export type { POI }
