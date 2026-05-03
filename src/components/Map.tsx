import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MILAN_RELICS, CATEGORY_COLORS, type Relic } from '../data/relics'
import { SACRED_PATHS } from '../data/sacredPaths'
import { useCollection } from '../hooks/useCollection'
import { useFootsteps } from '../hooks/useFootsteps'
import { useGameStore } from '../store/useGameStore'
import {
  buildProcessionRoute,
  segmentDistances,
  positionAtProgress,
  ANIM_INTERVAL_MS,
} from '../engine/pathRouter'
import { PathEditor } from './PathEditor'
import { TUTORIAL_QUESTS } from '../data/tutorialQuests'
import { rollVision } from '../engine/veiledVisions'
import { getActiveFeastsForRelic } from '../data/liturgicalCalendar'

interface Props {
  onRelicClick: (relic: Relic) => void
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
  const stroke = collected ? Math.round(size * 0.28) : Math.round(size * 0.22)
  const opacity = dimmed ? 0.35 : 1
  const extraSize = prope ? size + 16 : size
  const er = extraSize / 2
  const classes = [
    tutorialTarget ? 'ring-tutorial-pulse' : '',
    feastPulse && !collected ? 'ring-feast-pulse' : '',
  ].filter(Boolean).join(' ')

  const propeRing = prope && !collected
    ? `<circle cx="${er}" cy="${er}" r="${er - 3}" fill="none" stroke="${color}" stroke-width="1.5" stroke-opacity="0.5" class="ring-prope-pulse"/>`
    : ''
  const offset = prope ? 8 : 0

  return L.divIcon({
    className: '',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="${extraSize}" height="${extraSize}" viewBox="0 0 ${extraSize} ${extraSize}" style="opacity:${opacity}">
      ${propeRing}
      <g transform="translate(${offset},${offset})" class="${classes}">
        ${collected ? `<circle cx="${r}" cy="${r}" r="${r - stroke / 2}" fill="${color}" fill-opacity="0.22" stroke="none"/>` : ''}
        <circle cx="${r}" cy="${r}" r="${r - stroke / 2}" fill="none" stroke="${color}" stroke-width="${stroke}"/>
      </g>
    </svg>`,
    iconSize: [extraSize, extraSize],
    iconAnchor: [er, er],
    popupAnchor: [0, -er - 4],
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

export function Map({ onRelicClick }: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const [leafletMap, setLeafletMap] = useState<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const relicMarkersRef = useRef<globalThis.Map<string, L.Marker>>(new globalThis.Map())
  const pilgrimMarkerRef = useRef<L.Marker | null>(null)
  const routeRef = useRef<L.Polyline | null>(null)
  const processionPathRef = useRef<L.Polyline | null>(null)
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

    L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg', {
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://stamen.com">Stamen Design</a>',
      minZoom: 1,
      maxNativeZoom: 16,
      maxZoom: 20,
    }).addTo(map)

    L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner_labels/{z}/{x}/{y}.png', {
      attribution: '',
      opacity: 0.5,
      minZoom: 1,
      maxNativeZoom: 20,
      maxZoom: 20,
    }).addTo(map)

    // Sacred path network — warm orange/white to follow the map's street tones
    for (const path of SACRED_PATHS) {
      L.polyline(path, { color: '#FFFFFF', weight: 3, opacity: 0.18 }).addTo(map)
      L.polyline(path, { color: '#E8820A', weight: 1.5, opacity: 0.42 }).addTo(map)
    }

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

  // ── Relic markers ───────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const size = iconSizeFromZoom(map.getZoom())

    MILAN_RELICS.forEach(relic => {
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
  }, [collected, isCollected, onRelicClick, tutorialStep, tutorialTargetIds, pilgrimLat, pilgrimLng])

  // ── Pilgrim base position (when not animating) ──────────────────────────────
  useEffect(() => {
    if (processingRelicId) return  // animation owns position during procession
    pilgrimMarkerRef.current?.setLatLng([pilgrimLat, pilgrimLng])
  }, [pilgrimLat, pilgrimLng, processingRelicId])

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
    const segDists = segmentDistances(route.waypoints)
    const { waypoints, totalMeters, steps } = route

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

      if (step >= steps) {
        clearInterval(animIntervalRef.current!)
        animIntervalRef.current = null
        processionPathRef.current?.remove()
        processionPathRef.current = null
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
  }, [processingRelicId])   // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pilgrim route polyline (collected path) ─────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    routeRef.current?.remove()
    routeRef.current = null

    if (collected.length < 2) return

    const points = collected.map(id => {
      const spread = SPREAD_POSITIONS.get(id)
      if (spread) return spread
      const relic = MILAN_RELICS.find(r => r.id === id)
      return relic ? [relic.lat, relic.lng] as [number, number] : null
    }).filter(Boolean) as [number, number][]

    if (points.length < 2) return

    routeRef.current = L.polyline(points, {
      color: '#8B1A1A',
      weight: 2.5,
      opacity: 0.7,
      dashArray: '6, 8',
    }).addTo(map)
  }, [collected])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <PathEditor map={leafletMap} />
    </div>
  )
}
