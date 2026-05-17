// Build pedestrian-route cache from OpenRouteService.
//
//   npm run build:routes          # only fetches missing POI pairs
//   npm run build:routes -- --force   # refetches everything
//   npm run build:routes -- --pair=duomo-di-milano|castello-sforzesco
//
// Requires ORS_API_KEY in .env (free signup at openrouteservice.org).
// Output: src/data/routes.generated.json
//
// For each POI pair we ask ORS for 3 alternatives. If ORS returns fewer than 3
// distinct routes (geometry overlap > 70 %), we retry with weaker similarity
// constraints. If still insufficient, we accept what we get and warn — the
// runtime falls back to whichever variants exist.

import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { POIS, pairKey, type LatLng, type POI } from '../src/data/pois.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '..')
const OUT_PATH = resolve(REPO_ROOT, 'src/data/routes.generated.json')

const ORS_URL = 'https://api.openrouteservice.org/v2/directions/foot-walking/geojson'
const TARGET_VARIANTS = 3
const MAX_OVERLAP = 0.7              // reject variant pairs more similar than this
const REQ_DELAY_MS = 2500            // ORS alt-routes endpoint is heavier than base
const RATE_LIMIT_BACKOFF_MS = 65_000 // wait out the 1-minute window

interface Variant {
  waypoints: LatLng[]
  meters: number
}
type Cache = Record<string, Variant[]>

const args = process.argv.slice(2)
const FORCE = args.includes('--force')
const PAIR_FILTER = args.find(a => a.startsWith('--pair='))?.slice(7) ?? null

const apiKey = process.env.ORS_API_KEY
if (!apiKey) {
  console.error('ORS_API_KEY missing. Set it in .env or your shell.')
  process.exit(1)
}

async function main() {
  const cache: Cache = existsSync(OUT_PATH)
    ? JSON.parse(await readFile(OUT_PATH, 'utf8'))
    : {}

  const pairs = enumeratePairs(POIS).filter(p => !PAIR_FILTER || p.key === PAIR_FILTER)
  let fetched = 0
  let skipped = 0

  for (const pair of pairs) {
    const existing = cache[pair.key]
    if (!FORCE && existing && existing.length >= TARGET_VARIANTS) {
      skipped++
      continue
    }

    process.stdout.write(`→ ${pair.key} … `)
    try {
      const variants = await fetchVariantsWithRetry(pair.from.coord, pair.to.coord)
      cache[pair.key] = variants
      console.log(`${variants.length} variants (${variants.map(v => Math.round(v.meters) + 'm').join(', ')})`)
      fetched++
      await sleep(REQ_DELAY_MS)
    } catch (err) {
      console.log(`FAILED — ${(err as Error).message}`)
    }
  }

  await writeFile(OUT_PATH, JSON.stringify(cache, null, 2))
  console.log(`\nDone. ${fetched} fetched, ${skipped} cached, ${Object.keys(cache).length} total in ${OUT_PATH}`)
}

function enumeratePairs(pois: POI[]): { key: string; from: POI; to: POI }[] {
  const out: { key: string; from: POI; to: POI }[] = []
  for (let i = 0; i < pois.length; i++) {
    for (let j = i + 1; j < pois.length; j++) {
      if (pois[i].city !== pois[j].city) continue
      const { key, reversed } = pairKey(pois[i].id, pois[j].id)
      // Always fetch in canonical key order (key[0]→key[1], alphabetical) so
      // the stored waypoints match the direction the runtime expects.
      const [from, to] = reversed ? [pois[j], pois[i]] : [pois[i], pois[j]]
      out.push({ key, from, to })
    }
  }
  return out
}

async function fetchVariantsWithRetry(from: LatLng, to: LatLng): Promise<Variant[]> {
  // Try progressively weaker similarity constraints until we get TARGET_VARIANTS.
  // Cap at 2 attempts to conserve quota — the runtime tolerates fewer variants.
  const attempts = [
    { share_factor: 0.5, weight_factor: 1.4 },
    { share_factor: 0.8, weight_factor: 1.8 },
  ]
  let last: Variant[] = []
  for (let i = 0; i < attempts.length; i++) {
    const variants = await fetchORS(from, to, attempts[i])
    const distinct = filterDistinct(variants)
    if (distinct.length >= TARGET_VARIANTS) return distinct.slice(0, TARGET_VARIANTS)
    last = distinct
    if (i < attempts.length - 1) await sleep(REQ_DELAY_MS)
  }
  return last
}

async function fetchORS(
  from: LatLng,
  to: LatLng,
  alt: { share_factor: number; weight_factor: number },
): Promise<Variant[]> {
  const body = {
    coordinates: [[from[1], from[0]], [to[1], to[0]]],   // ORS uses lng,lat
    alternative_routes: {
      target_count: TARGET_VARIANTS,
      share_factor: alt.share_factor,
      weight_factor: alt.weight_factor,
    },
    instructions: false,
  }

  const res = await fetch(ORS_URL, {
    method: 'POST',
    headers: {
      'Authorization': apiKey!,
      'Content-Type': 'application/json',
      'Accept': 'application/geo+json',
    },
    body: JSON.stringify(body),
  })

  if (res.status === 429) {
    console.log(`  rate-limited, sleeping ${RATE_LIMIT_BACKOFF_MS / 1000}s …`)
    await sleep(RATE_LIMIT_BACKOFF_MS)
    return fetchORS(from, to, alt)
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`)
  }

  const json = await res.json() as {
    features: { geometry: { coordinates: [number, number][] }; properties: { summary: { distance: number } } }[]
  }

  return json.features.map(f => ({
    waypoints: f.geometry.coordinates.map(([lng, lat]) => [lat, lng] as LatLng),
    meters: f.properties.summary.distance,
  }))
}

// Reject variants whose waypoint set overlaps too much with one already kept.
function filterDistinct(variants: Variant[]): Variant[] {
  const kept: Variant[] = []
  for (const v of variants) {
    if (kept.every(k => overlap(v, k) <= MAX_OVERLAP)) kept.push(v)
  }
  return kept
}

// Cheap overlap heuristic: fraction of v1's coarse cells (5-decimal) also visited by v2.
function overlap(a: Variant, b: Variant): number {
  const cells = (v: Variant) => new Set(v.waypoints.map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`))
  const ca = cells(a)
  const cb = cells(b)
  let shared = 0
  for (const c of ca) if (cb.has(c)) shared++
  return shared / Math.max(ca.size, 1)
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
