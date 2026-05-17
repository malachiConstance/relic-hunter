export type LatLng = [number, number]

// Hand-authored ceremonial routes that override OSM pedestrian routing.
//
// Use this for liturgical processions where the *exact* path matters
// (e.g. Inventio Crucis route around the Duomo apse), not for general walking.
//
// Key format: pairKey(poiAId, poiBId).key — see src/data/pois.ts.
// The router applies the polyline as-is when origin POI < destination POI by id,
// or reversed otherwise.
//
// Example:
//   'relic:duomo-di-milano|relic:san-nazaro-in-brolo': [
//     [45.4641, 9.1919], [45.4640, 9.1900], [45.4632, 9.1880],
//   ],
export const SACRED_PATH_OVERRIDES: Record<string, LatLng[]> = {}

// Legacy freeform path graph. Empty by default — OSM routing replaces it.
// PathEditor still reads/writes this for ad-hoc visual sketches.
export const SACRED_PATHS_LEGACY: LatLng[][] = []

// Backwards-compat alias so PathEditor and any older imports keep compiling.
// New code should use SACRED_PATH_OVERRIDES.
export const SACRED_PATHS = SACRED_PATHS_LEGACY
