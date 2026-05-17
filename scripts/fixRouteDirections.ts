// One-time fixup: reverse route variants that were stored in the wrong direction.
//
// Bug: buildRoutes always fetched pois[i]→pois[j] (POIS array order) but the
// cache key convention expects routes stored as key[0]→key[1] (alphabetical).
// When those two orders disagree the router re-reverses at runtime, producing
// a three-leg path: straight→OSM backwards→straight.
//
// This script detects affected pairs and flips their waypoints in-place.
// Run once, then delete this file.

import { readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { POIS, pairKey } from '../src/data/pois.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_PATH = resolve(__dirname, '../src/data/routes.generated.json')

interface Variant { waypoints: [number, number][]; meters: number }
type Cache = Record<string, Variant[]>

const cache: Cache = JSON.parse(await readFile(OUT_PATH, 'utf8'))

let fixed = 0

for (let i = 0; i < POIS.length; i++) {
  for (let j = i + 1; j < POIS.length; j++) {
    if (POIS[i].city !== POIS[j].city) continue
    const { key, reversed } = pairKey(POIS[i].id, POIS[j].id)
    if (!reversed) continue          // stored in correct direction already
    if (!cache[key]?.length) continue

    // Route was fetched pois[i]→pois[j] but key expects pois[j]→pois[i].
    // Reverse every variant's waypoints.
    for (const v of cache[key]) {
      v.waypoints = v.waypoints.slice().reverse() as [number, number][]
    }
    console.log(`fixed: ${key}`)
    fixed++
  }
}

await writeFile(OUT_PATH, JSON.stringify(cache, null, 2))
console.log(`\nDone. ${fixed} pairs corrected.`)
