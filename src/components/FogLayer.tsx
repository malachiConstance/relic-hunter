import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { useGameStore } from '../store/useGameStore'
import {
  boundaryOf,
  cellInBounds,
  FOG_FEATHER_PX,
  FOG_REPAINT_DEBOUNCE_MS,
} from '../engine/fogOfWar'

interface Props {
  map: L.Map | null
}

export function FogLayer({ map }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const exploredCells = useGameStore(s => s.exploredCells)
  const repaintTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!map) return
    const canvas = L.DomUtil.create('canvas', 'fog-layer-canvas') as HTMLCanvasElement
    canvas.style.position = 'absolute'
    canvas.style.pointerEvents = 'none'
    canvas.style.zIndex = '400'
    map.getPanes().overlayPane.appendChild(canvas)
    canvasRef.current = canvas
    return () => { canvas.remove() }
  }, [map])

  useEffect(() => {
    if (!map || !canvasRef.current) return
    const schedule = () => {
      if (repaintTimer.current) clearTimeout(repaintTimer.current)
      repaintTimer.current = setTimeout(
        () => repaint(map, canvasRef.current!, exploredCells),
        FOG_REPAINT_DEBOUNCE_MS,
      )
    }
    schedule()
    map.on('moveend zoomend resize', schedule)
    return () => { map.off('moveend zoomend resize', schedule) }
  }, [map, exploredCells])

  return null
}

// Canvas extends OVERSCAN full viewports beyond each edge so panning never
// reveals unfogged map before the next moveend repaint fires.
const OVERSCAN = 1

// Deterministic per-cell hash [0..1) — stable across repaints so cell shapes don't flicker.
function cellHash(cellId: string): number {
  let h = 2166136261
  for (let i = 0; i < cellId.length; i++) {
    h ^= cellId.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 0x100000000
}

// Draw an organic irregular circle instead of the exact hex polygon.
// Multiple overlapping wobbly circles blend into a natural-looking explored region.
function drawOrganicCell(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  baseR: number,
  hash: number,
) {
  const N = 14  // polygon vertices — enough for smooth wobble
  ctx.beginPath()
  for (let i = 0; i < N; i++) {
    const angle = (i / N) * Math.PI * 2
    // Two sine waves of different frequencies, seeded by hash → unique per cell
    const wobble =
      0.18 * Math.sin(hash * 11.3 + i * 2.0) +
      0.12 * Math.cos(hash *  7.1 + i * 3.7)
    const r = baseR * (1 + wobble)
    const px = cx + Math.cos(angle) * r
    const py = cy + Math.sin(angle) * r
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
}

function repaint(map: L.Map, canvas: HTMLCanvasElement, exploredCells: string[]) {
  const size = map.getSize()
  const ox = size.x * OVERSCAN
  const oy = size.y * OVERSCAN
  const W = size.x * (1 + 2 * OVERSCAN)
  const H = size.y * (1 + 2 * OVERSCAN)

  canvas.width = W
  canvas.height = H

  // Anchor canvas so it extends OVERSCAN viewports beyond each container edge
  const tl = map.containerPointToLayerPoint(L.point(-ox, -oy))
  L.DomUtil.setPosition(canvas, tl)

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = 'rgba(8, 6, 4, 1)'
  ctx.fillRect(0, 0, W, H)

  // Bounds covering the full overscan canvas area
  const nw = map.containerPointToLatLng(L.point(-ox, -oy))
  const se = map.containerPointToLatLng(L.point(size.x + ox, size.y + oy))
  const b = {
    north: nw.lat,
    south: se.lat,
    east: se.lng,
    west: nw.lng,
  }

  ctx.globalCompositeOperation = 'destination-out'
  ctx.shadowColor = 'rgba(0,0,0,1)'
  ctx.shadowBlur = FOG_FEATHER_PX
  ctx.fillStyle = 'rgba(0,0,0,1)'

  for (const cellId of exploredCells) {
    if (!cellInBounds(cellId, b)) continue
    const ring = boundaryOf(cellId)

    // Compute pixel center and average circumradius of the hex cell
    let cx = 0, cy = 0
    const pts = ring.map(coord => {
      const pt = map.latLngToContainerPoint(coord)
      cx += pt.x; cy += pt.y
      return pt
    })
    cx = cx / ring.length + ox
    cy = cy / ring.length + oy

    let baseR = 0
    for (const pt of pts) {
      const dx = (pt.x + ox) - cx
      const dy = (pt.y + oy) - cy
      baseR += Math.sqrt(dx * dx + dy * dy)
    }
    baseR /= ring.length

    drawOrganicCell(ctx, cx, cy, baseR, cellHash(cellId))
  }

  ctx.globalCompositeOperation = 'source-over'
  ctx.shadowBlur = 0
}
