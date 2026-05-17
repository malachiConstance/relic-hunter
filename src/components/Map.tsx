import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MILAN_RELICS, CATEGORY_COLORS, type Relic } from '../data/relics'
import { SACRED_PATH_OVERRIDES } from '../data/sacredPaths'
import { useCollection } from '../hooks/useCollection'
import { useFootsteps } from '../hooks/useFootsteps'
import { useGameStore } from '../store/useGameStore'
import {
  buildProcessionRoute,
  segmentDistances,
  positionAtProgress,
  ANIM_INTERVAL_MS,
} from '../engine/pathRouter'
import { FogLayer } from './FogLayer'
import { cellsRevealedAt, FOG_REVEAL_RING_WALK, FOG_REVEAL_RING_ARRIVAL } from '../engine/fogOfWar'
import { TUTORIAL_QUESTS } from '../data/tutorialQuests'
import { rollVision } from '../engine/veiledVisions'
import { getActiveFeastsForRelic } from '../data/liturgicalCalendar'
import { REST_PLACES, type RestPlace } from '../data/restPlaces'

interface Props {
  onRelicClick: (relic: Relic) => void
  onPlaceClick: (placeId: string) => void
}

function iconSizeFromZoom(zoom: number): number {
  return Math.round(Math.max(18, Math.min(44, 22 + (zoom - 13) * 5.5)))
}

function haversineM(a: [number, number], b: [number, number]): number {
  const R = 6371000
  const dLat = (b[0] - a[0]) * Math.PI / 180
  const dLng = (b[1] - a[1]) * Math.PI / 180
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

interface IconOpts {
  collected: boolean
  tutorialTarget: boolean
  dimmed: boolean
  prope: boolean       // within 250m, uncollected → outer pulse ring
  feastPulse: boolean  // active feast matches this relic
}

function makeRelicIcon(relic: Relic, size: number, opts: IconOpts): L.DivIcon {
  const { collected, tutorialTarget, dimmed, prope, feastPulse } = opts
  const color = CATEGORY_COLORS[relic.category]
  const r = size / 2
  const opacity = dimmed ? 0.35 : 1

  // Outer pulse ring for nearby uncollected relics
  const extraSize = prope && !collected ? size + 20 : size
  const er = extraSize / 2
  const offset = prope && !collected ? 10 : 0

  const animClass = [
    tutorialTarget ? 'ring-tutorial-pulse' : '',
    feastPulse && !collected ? 'ring-feast-pulse' : '',
    relic.rarity === 'Legendary' && !collected ? 'ring-legendary-glow' : '',
  ].filter(Boolean).join(' ')

  const propeRing = prope && !collected
    ? `<circle cx="${er}" cy="${er}" r="${er - 2}" fill="none" stroke="#C9A84C" stroke-width="1" stroke-opacity="0.55" class="ring-prope-pulse"/>`
    : ''

  // Glow filter id (unique per rarity to avoid cross-contamination)
  const filterId = `glow-${relic.rarity.toLowerCase()}-${relic.id.slice(0, 6)}`

  let rings: string
  let filterDef: string

  if (collected) {
    // Solid gold disc with relic-color center dot — sealed / collected appearance
    filterDef = `<filter id="${filterId}" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur"/>
      <feFlood flood-color="#F5E6C8" flood-opacity="0.7" result="color"/>
      <feComposite in="color" in2="blur" operator="in" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>`
    rings = `
      <circle cx="${r}" cy="${r}" r="${r - 1.5}" fill="#C9A84C" stroke="#F5E6C8" stroke-width="1.5" filter="url(#${filterId})"/>
      <circle cx="${r}" cy="${r}" r="${r * 0.42}" fill="${color}" fill-opacity="0.9" stroke="none"/>
      <circle cx="${r}" cy="${r}" r="${r * 0.42}" fill="none" stroke="#F5E6C8" stroke-width="0.8" stroke-opacity="0.6"/>
    `
  } else {
    const glowStdDev = relic.rarity === 'Legendary' ? 5 : relic.rarity === 'Rare' ? 3.5 : relic.rarity === 'Uncommon' ? 2 : 1
    const glowOpacity = relic.rarity === 'Legendary' ? 0.9 : relic.rarity === 'Rare' ? 0.75 : 0.55
    filterDef = `<filter id="${filterId}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${glowStdDev}" result="blur"/>
      <feFlood flood-color="#C9A84C" flood-opacity="${glowOpacity}" result="color"/>
      <feComposite in="color" in2="blur" operator="in" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>`
    const innerStroke = Math.round(size * 0.22)
    // Gold outer ring + colored inner ring (thick) + optional extra decoration for legendary
    rings = `
      <circle cx="${r}" cy="${r}" r="${r - 1.5}" fill="none" stroke="#C9A84C" stroke-width="1.5" stroke-opacity="0.65" filter="url(#${filterId})"/>
      <circle cx="${r}" cy="${r}" r="${r - innerStroke / 2 - 3}" fill="none" stroke="${color}" stroke-width="${innerStroke}"/>
    `
    if (relic.rarity === 'Legendary') {
      rings += `<circle cx="${r}" cy="${r}" r="${r - 1}" fill="none" stroke="#C9A84C" stroke-width="0.7" stroke-dasharray="3 5" stroke-opacity="0.8"/>`
    } else if (relic.rarity === 'Rare') {
      rings += `<circle cx="${r}" cy="${r}" r="${r - 1}" fill="none" stroke="#C9A84C" stroke-width="0.5" stroke-opacity="0.5"/>`
    }
  }

  return L.divIcon({
    className: '',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="${extraSize}" height="${extraSize}" viewBox="0 0 ${extraSize} ${extraSize}" style="opacity:${opacity}">
      <defs>${filterDef}</defs>
      ${propeRing}
      <g transform="translate(${offset},${offset})" class="${animClass}">
        ${rings}
      </g>
    </svg>`,
    iconSize: [extraSize, extraSize],
    iconAnchor: [er, er],
    popupAnchor: [0, -er - 4],
  })
}

function makeRestPlaceIcon(place: RestPlace, known: boolean): L.DivIcon {
  const isTavern = place.type === 'tavern'
  const isKloster = place.type === 'kloster'

  const bg = isTavern ? '#4A2A0A' : '#1A0E04'
  const border = isTavern ? '#C9A84C' : isKloster ? '#E8C96C' : '#9AB8C8'
  const symbol = isTavern ? '⚱' : isKloster ? '✝' : '⛪'
  const glow = isTavern ? 'rgba(201,168,76,0.4)' : isKloster ? 'rgba(232,201,108,0.5)' : 'rgba(154,184,200,0.4)'
  const size = isTavern ? 26 : isKloster ? 28 : 24

  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${bg};
      border:2px solid ${border};
      border-radius:${isTavern ? '4px' : isKloster ? '2px' : '50%'};
      display:flex;align-items:center;justify-content:center;
      font-size:${size * 0.5}px;
      line-height:1;
      box-shadow:0 0 8px ${glow}, inset 0 0 4px rgba(0,0,0,0.5);
      opacity:${known ? 1 : 0.6};
    ">${symbol}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  })
}

function makePilgrimIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:28px;height:28px;
      background:#1A0E04;
      border:2.5px solid #C9A84C;
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:14px;
      color:#C9A84C;
      box-shadow:0 0 8px rgba(201,168,76,0.6);
    ">✝</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -18],
  })
}

function computeSpreadPositions(): globalThis.Map<string, [number, number]> {
  const groups = new globalThis.Map<string, Relic[]>()
  for (const relic of MILAN_RELICS) {
    const key = `${relic.lat.toFixed(4)},${relic.lng.toFixed(4)}`
    const group = groups.get(key) ?? []
    group.push(relic)
    groups.set(key, group)
  }

  const positions = new globalThis.Map<string, [number, number]>()
  for (const group of groups.values()) {
    if (group.length === 1) {
      positions.set(group[0].id, [group[0].lat, group[0].lng])
    } else {
      const baseLat = group[0].lat
      const baseLng = group[0].lng
      const radius = 0.00028
      group.forEach((relic, i) => {
        const angle = (2 * Math.PI * i) / group.length - Math.PI / 2
        positions.set(relic.id, [
          baseLat + radius * Math.sin(angle),
          baseLng + radius * 1.45 * Math.cos(angle),
        ])
      })
    }
  }
  return positions
}

const SPREAD_POSITIONS = computeSpreadPositions()

export function Map({ onRelicClick, onPlaceClick }: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const [leafletMap, setLeafletMap] = useState<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const relicMarkersRef = useRef<globalThis.Map<string, L.Marker>>(new globalThis.Map())
  const placeMarkersRef = useRef<globalThis.Map<string, L.Marker>>(new globalThis.Map())
  const pilgrimMarkerRef = useRef<L.Marker | null>(null)
  const processionPathRef = useRef<L.Polyline | null>(null)
  const walkedHistoryLayerRef = useRef<L.LayerGroup | null>(null)
  const animIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { collected, isCollected } = useCollection()
  const { playStep } = useFootsteps()

  const pilgrimLat = useGameStore(s => s.pilgrimLat)
  const pilgrimLng = useGameStore(s => s.pilgrimLng)
  const processingRelicId = useGameStore(s => s.processingRelicId)
  const tutorialStep = useGameStore(s => s.tutorialStep)
  const completeProcession = useGameStore(s => s.completeProcession)
  const addDevotio = useGameStore(s => s.addDevotio)
  const showVision = useGameStore(s => s.showVision)
  const walkedPaths = useGameStore(s => s.walkedPaths)
  const recordWalkedPath = useGameStore(s => s.recordWalkedPath)
  const revealCells = useGameStore(s => s.revealCells)
  const knownPlaceIds = useGameStore(s => s.knownPlaceIds)
  const knownRelicIds = useGameStore(s => s.knownRelicIds)
  const walkingToCoord = useGameStore(s => s.walkingToCoord)
  const walkingDestPlaceId = useGameStore(s => s.walkingDestPlaceId)
  const completeWalk = useGameStore(s => s.completeWalk)

  // For step 1 only: dim everything except the specific target relic
  const tutorialTargetIds: string[] = (tutorialStep === 1)
    ? (TUTORIAL_QUESTS[0].targetRelicIds ?? [])
    : []

  // ── Initialize map ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [45.4641, 9.1900],
      zoom: 15,
      maxZoom: 17,
      zoomControl: false,
    })

    const stadiaKey = import.meta.env.VITE_STADIA_API_KEY
    const keyParam = stadiaKey ? `?api_key=${stadiaKey}` : ''
    L.tileLayer(`https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg${keyParam}`, {
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://stamen.com">Stamen Design</a>',
      minZoom: 1,
      maxNativeZoom: 16,
      maxZoom: 20,
    }).addTo(map)

    L.tileLayer(`https://tiles.stadiamaps.com/tiles/stamen_toner_labels/{z}/{x}/{y}.png${keyParam}`, {
      attribution: '',
      opacity: 0.5,
      minZoom: 1,
      maxNativeZoom: 20,
      maxZoom: 20,
    }).addTo(map)

    for (const path of Object.values(SACRED_PATH_OVERRIDES)) {
      L.polyline(path, { color: '#FFFFFF', weight: 3, opacity: 0.18 }).addTo(map)
      L.polyline(path, { color: '#E8820A', weight: 1.5, opacity: 0.42 }).addTo(map)
    }

    // Walked-path history layer — populated/refreshed by a separate effect.
    walkedHistoryLayerRef.current = L.layerGroup().addTo(map)

    // Pilgrim avatar — starts at Duomo
    const pilgrimStart = useGameStore.getState()
    pilgrimMarkerRef.current = L.marker(
      [pilgrimStart.pilgrimLat, pilgrimStart.pilgrimLng],
      { icon: makePilgrimIcon(), zIndexOffset: 1000 },
    ).addTo(map)

    map.on('zoomend', () => {
      const zoom = map.getZoom()
      const size = iconSizeFromZoom(zoom)
      const state = useGameStore.getState()
      const step = state.tutorialStep
      const targets = step === 1 ? (TUTORIAL_QUESTS[0].targetRelicIds ?? []) : []
      const { pilgrimLat: pLat, pilgrimLng: pLng } = state
      relicMarkersRef.current.forEach((marker, id) => {
        const relic = MILAN_RELICS.find(r => r.id === id)
        if (!relic) return
        if (!state.knownRelicIds.includes(id) && !state.collected.includes(id)) return
        const col = state.collected.includes(id)
        const isTgt = targets.includes(id)
        const dim = step === 1 && !col && !isTgt
        const prope = !col && haversineM([pLat, pLng], [relic.lat, relic.lng]) <= 250
        const feastPulse = getActiveFeastsForRelic(relic.provenance_sub, relic.liturgical_feast).length > 0
        marker.setIcon(makeRelicIcon(relic, size, { collected: col, tutorialTarget: isTgt, dimmed: dim, prope, feastPulse }))
      })
    })

    L.control.zoom({ position: 'bottomright' }).addTo(map)
    mapRef.current = map
    setLeafletMap(map)
  }, [])

  // ── Relic markers (only for known relics) ───────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const size = iconSizeFromZoom(map.getZoom())

    // Remove markers for relics no longer known
    relicMarkersRef.current.forEach((marker, id) => {
      if (!knownRelicIds.includes(id) && !collected.includes(id)) {
        marker.remove()
        relicMarkersRef.current.delete(id)
      }
    })

    MILAN_RELICS.filter(r => knownRelicIds.includes(r.id) || collected.includes(r.id)).forEach(relic => {
      const pos = SPREAD_POSITIONS.get(relic.id) ?? [relic.lat, relic.lng] as [number, number]
      const existing = relicMarkersRef.current.get(relic.id)
      const col = collected.includes(relic.id)
      const isTgt = tutorialTargetIds.includes(relic.id)
      const dim = tutorialStep === 1 && !col && !isTgt
      const prope = !col && haversineM([pilgrimLat, pilgrimLng], [relic.lat, relic.lng]) <= 250
      const feastPulse = getActiveFeastsForRelic(relic.provenance_sub, relic.liturgical_feast).length > 0
      const icon = makeRelicIcon(relic, size, { collected: col, tutorialTarget: isTgt, dimmed: dim, prope, feastPulse })

      if (existing) {
        existing.setIcon(icon)
      } else {
        const marker = L.marker(pos, { icon })
          .addTo(map)
          .on('click', () => onRelicClick(relic))
        relicMarkersRef.current.set(relic.id, marker)
      }
    })
  }, [collected, isCollected, onRelicClick, tutorialStep, tutorialTargetIds, pilgrimLat, pilgrimLng, knownRelicIds])

  // ── Rest place markers (only for known places) ───────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Remove markers for places no longer known
    placeMarkersRef.current.forEach((marker, id) => {
      if (!knownPlaceIds.includes(id)) {
        marker.remove()
        placeMarkersRef.current.delete(id)
      }
    })

    REST_PLACES.filter(p => knownPlaceIds.includes(p.id)).forEach(place => {
      const existing = placeMarkersRef.current.get(place.id)
      const icon = makeRestPlaceIcon(place, true)
      if (existing) {
        existing.setIcon(icon)
      } else {
        const marker = L.marker(place.coord, { icon, zIndexOffset: 500 })
          .addTo(map)
          .on('click', () => onPlaceClick(place.id))
        placeMarkersRef.current.set(place.id, marker)
      }
    })
  }, [knownPlaceIds, onPlaceClick])

  // ── Pilgrim base position (when not animating) ──────────────────────────────
  useEffect(() => {
    if (processingRelicId || walkingToCoord) return
    pilgrimMarkerRef.current?.setLatLng([pilgrimLat, pilgrimLng])
  }, [pilgrimLat, pilgrimLng, processingRelicId, walkingToCoord])

  // ── Walking animation (path-following, same engine as procession but no ceremony) ──
  useEffect(() => {
    const marker = pilgrimMarkerRef.current
    const map = mapRef.current
    if (!walkingToCoord || !marker || !map) return

    const { lat, lng } = marker.getLatLng()
    const from: [number, number] = [lat, lng]
    const route = buildProcessionRoute(from, walkingToCoord)
    if (!route) {
      completeWalk()
      return
    }
    const segDists = segmentDistances(route.waypoints)
    const { waypoints, totalMeters, steps } = route

    revealCells(cellsRevealedAt(from[0], from[1]))

    // Walking path: green-tinted rather than gold
    const walkPathLine = L.polyline(waypoints, {
      color: '#7AAA5A',
      weight: 2,
      dashArray: '4 7',
      opacity: 0.7,
    }).addTo(map)

    const revealEvery = Math.max(1, Math.round(steps / (totalMeters / 8)))
    const stepSoundEvery = Math.max(1, Math.round(steps / (totalMeters / 0.8)))
    let step = 0

    const walkInterval = setInterval(() => {
      step++
      const pos = positionAtProgress(waypoints, segDists, totalMeters, step / steps)
      marker.setLatLng(pos)
      if (step % stepSoundEvery === 0) playStep()
      if (step % revealEvery === 0) revealCells(cellsRevealedAt(pos[0], pos[1], FOG_REVEAL_RING_WALK))
      if (step >= steps) {
        clearInterval(walkInterval)
        walkPathLine.remove()
        revealCells(cellsRevealedAt(walkingToCoord[0], walkingToCoord[1], FOG_REVEAL_RING_ARRIVAL))
        recordWalkedPath(waypoints as [number, number][])
        completeWalk()
      }
    }, ANIM_INTERVAL_MS)

    return () => {
      clearInterval(walkInterval)
      walkPathLine.remove()
    }
  }, [walkingToCoord])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Procession animation (path-following, constant walking speed) ───────────
  useEffect(() => {
    const marker = pilgrimMarkerRef.current
    const map = mapRef.current
    if (!processingRelicId || !marker || !map) return

    const relic = MILAN_RELICS.find(r => r.id === processingRelicId)
    if (!relic) return

    const targetPos = SPREAD_POSITIONS.get(relic.id) ?? [relic.lat, relic.lng] as [number, number]
    const { lat, lng } = marker.getLatLng()
    const from: [number, number] = [lat, lng]

    // Route through sacred path graph — no straight-line house-cutting
    const route = buildProcessionRoute(from, targetPos)
    if (!route) {
      // No OSM route cached — skip animation rather than walk through houses
      console.error('[Map] No OSM route available, skipping procession animation')
      completeProcession()
      return
    }
    const segDists = segmentDistances(route.waypoints)
    const { waypoints, totalMeters, steps } = route

    // Reveal spawn point immediately so the pilgrim isn't standing in darkness
    revealCells(cellsRevealedAt(from[0], from[1]))

    // Draw dotted gold path along the actual route
    processionPathRef.current = L.polyline(waypoints, {
      color: '#C9A84C',
      weight: 2,
      dashArray: '5 8',
      opacity: 0.8,
    }).addTo(map)

    let step = 0
    // Footstep cadence: one step sound per ~0.8 m walked
    const stepSoundEvery = Math.max(1, Math.round(steps / (totalMeters / 0.8)))
    // Devotio tick: every ~30 m walked
    const devotioEvery = Math.max(1, Math.round(steps / (totalMeters / 30)))
    // Vision roll: every 40–80 steps (randomised)
    const visionEvery = 40 + Math.floor(Math.random() * 40)
    // Fog reveal: once per ~5 m walked
    const revealEvery = Math.max(1, Math.round(steps / (totalMeters / 5)))

    animIntervalRef.current = setInterval(() => {
      step++
      const pos = positionAtProgress(waypoints, segDists, totalMeters, step / steps)
      marker.setLatLng(pos)

      if (step % stepSoundEvery === 0) playStep()
      if (step % devotioEvery === 0) addDevotio(1)
      if (step % visionEvery === 0) {
        const vision = rollVision(step)
        if (vision) showVision(vision)
      }
      if (step % revealEvery === 0) revealCells(cellsRevealedAt(pos[0], pos[1]))

      if (step >= steps) {
        clearInterval(animIntervalRef.current!)
        animIntervalRef.current = null
        processionPathRef.current?.remove()
        processionPathRef.current = null
        // Reveal destination with a large burst so it's never on the fog edge
        revealCells(cellsRevealedAt(targetPos[0], targetPos[1], FOG_REVEAL_RING_ARRIVAL))
        // Persist the polyline so it shows up as faint history afterwards.
        recordWalkedPath(waypoints as [number, number][])
        completeProcession()
      }
    }, ANIM_INTERVAL_MS)

    return () => {
      if (animIntervalRef.current) {
        clearInterval(animIntervalRef.current)
        animIntervalRef.current = null
      }
      processionPathRef.current?.remove()
      processionPathRef.current = null
    }
  }, [processingRelicId, revealCells])   // eslint-disable-line react-hooks/exhaustive-deps

  // ── Walked-path history (persistent dotted gold trail) ──────────────────────
  useEffect(() => {
    const layer = walkedHistoryLayerRef.current
    if (!layer || !leafletMap) return
    layer.clearLayers()
    for (const path of walkedPaths) {
      L.polyline(path as L.LatLngTuple[], {
        color: '#C9A84C',
        weight: 2,
        dashArray: '5 8',
        opacity: 0.35,
      }).addTo(layer)
    }
  }, [walkedPaths, leafletMap])


  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <FogLayer map={leafletMap} />
    </div>
  )
}
