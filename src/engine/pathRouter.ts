import { SACRED_PATHS, type LatLng } from '../data/sacredPaths'

export const WALK_SPEED_MPS = 70    // cinematic: full centro storico ~20 s
export const ANIM_INTERVAL_MS = 100

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

// ── Graph ─────────────────────────────────────────────────────────────────────

function nodeKey(p: LatLng): string {
  return `${p[0].toFixed(5)},${p[1].toFixed(5)}`
}

interface Edge { to: number; dist: number }

interface Graph {
  nodes: LatLng[]
  adj: Map<number, Edge[]>
  keyToIdx: Map<string, number>
}

function buildGraph(): Graph {
  const nodes: LatLng[] = []
  const adj = new Map<number, Edge[]>()
  const keyToIdx = new Map<string, number>()

  function getOrAdd(p: LatLng): number {
    const k = nodeKey(p)
    if (keyToIdx.has(k)) return keyToIdx.get(k)!
    const idx = nodes.length
    nodes.push([p[0], p[1]])
    keyToIdx.set(k, idx)
    adj.set(idx, [])
    return idx
  }

  for (const path of SACRED_PATHS) {
    for (let i = 0; i < path.length - 1; i++) {
      const a = getOrAdd(path[i])
      const b = getOrAdd(path[i + 1])
      const d = haversineM(path[i], path[i + 1])
      adj.get(a)!.push({ to: b, dist: d })
      adj.get(b)!.push({ to: a, dist: d })
    }
  }

  return { nodes, adj, keyToIdx }
}

const GRAPH = buildGraph()

// ── Nearest node ──────────────────────────────────────────────────────────────

function nearestNode(pos: LatLng): number {
  let best = 0
  let bestDist = Infinity
  for (let i = 0; i < GRAPH.nodes.length; i++) {
    const d = haversineM(pos, GRAPH.nodes[i])
    if (d < bestDist) { bestDist = d; best = i }
  }
  return best
}

// ── Dijkstra (graph is ~150 nodes — simple array scan is fine) ────────────────

function dijkstra(startIdx: number, endIdx: number): LatLng[] {
  if (startIdx === endIdx) return [GRAPH.nodes[startIdx]]

  const dist = new Float64Array(GRAPH.nodes.length).fill(Infinity)
  const prev = new Int32Array(GRAPH.nodes.length).fill(-1)
  const visited = new Uint8Array(GRAPH.nodes.length)
  dist[startIdx] = 0

  const pending = new Set<number>([startIdx])

  while (pending.size > 0) {
    // Pick unvisited node with smallest dist
    let u = -1
    let uDist = Infinity
    for (const idx of pending) {
      if (dist[idx] < uDist) { uDist = dist[idx]; u = idx }
    }
    if (u === -1 || u === endIdx) break
    pending.delete(u)
    visited[u] = 1

    for (const { to, dist: edgeDist } of GRAPH.adj.get(u) ?? []) {
      if (visited[to]) continue
      const alt = dist[u] + edgeDist
      if (alt < dist[to]) {
        dist[to] = alt
        prev[to] = u
        pending.add(to)
      }
    }
  }

  // Reconstruct
  const path: LatLng[] = []
  let cur = endIdx
  while (cur !== -1) {
    path.unshift(GRAPH.nodes[cur])
    cur = prev[cur]
  }

  // No path found — straight line fallback
  return path.length > 1 ? path : [GRAPH.nodes[startIdx], GRAPH.nodes[endIdx]]
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface ProcessionRoute {
  waypoints: LatLng[]
  totalMeters: number
  steps: number
}

export function buildProcessionRoute(from: LatLng, to: LatLng): ProcessionRoute {
  const startNode = nearestNode(from)
  const endNode = nearestNode(to)

  const routeNodes = dijkstra(startNode, endNode)

  // Prepend actual start, append actual destination so avatar begins/ends exactly
  const waypoints: LatLng[] = [from, ...routeNodes, to]

  let totalMeters = 0
  for (let i = 0; i < waypoints.length - 1; i++) {
    totalMeters += haversineM(waypoints[i], waypoints[i + 1])
  }

  const steps = Math.max(20, Math.round((totalMeters / WALK_SPEED_MPS) * (1000 / ANIM_INTERVAL_MS)))

  return { waypoints, totalMeters, steps }
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
