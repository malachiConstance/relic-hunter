import { latLngToCell, gridDisk, cellToBoundary } from 'h3-js'

export const FOG_RES = 11
export const FOG_REVEAL_RING = 1          // procession reveal radius
export const FOG_REVEAL_RING_WALK = 8     // wider reveal when exploring on foot (~190m radius)
export const FOG_REVEAL_RING_ARRIVAL = 12 // burst reveal when reaching a destination (~290m radius)
export const FOG_OPACITY = 1.0
export const FOG_FEATHER_PX = 18
export const FOG_REPAINT_DEBOUNCE_MS = 120

export function cellsRevealedAt(lat: number, lng: number, ring = FOG_REVEAL_RING): string[] {
  const center = latLngToCell(lat, lng, FOG_RES)
  return gridDisk(center, ring)
}

const BOUNDARY_CACHE = new Map<string, [number, number][]>()
export function boundaryOf(cellId: string): [number, number][] {
  let b = BOUNDARY_CACHE.get(cellId)
  if (!b) {
    b = cellToBoundary(cellId) as [number, number][]
    BOUNDARY_CACHE.set(cellId, b)
  }
  return b
}

export function cellInBounds(
  cellId: string,
  bounds: { north: number; south: number; east: number; west: number },
): boolean {
  const b = boundaryOf(cellId)
  for (const [lat, lng] of b) {
    if (lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east) {
      return true
    }
  }
  return false
}
