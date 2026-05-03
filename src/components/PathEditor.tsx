import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { SACRED_PATHS } from '../data/sacredPaths'

interface Props {
  map: L.Map | null
}

interface ENode { id: string; lat: number; lng: number; marker: L.Marker }
interface EPath { nodeIds: string[]; polyline: L.Polyline }

function dotIcon(selected: boolean): L.DivIcon {
  const sz = selected ? 14 : 10
  const col = selected ? '#FFD700' : '#FF4500'
  return L.divIcon({
    className: '',
    html: `<div style="width:${sz}px;height:${sz}px;background:${col};border-radius:50%;border:2px solid #fff;box-shadow:0 0 4px rgba(0,0,0,.6);margin:${-sz / 2}px 0 0 ${-sz / 2}px"></div>`,
    iconSize: [sz, sz],
    iconAnchor: [sz / 2, sz / 2],
  })
}

function haversineM(a: [number, number], b: [number, number]): number {
  const R = 6371000
  const dLat = (b[0] - a[0]) * Math.PI / 180
  const dLng = (b[1] - a[1]) * Math.PI / 180
  const sin2 = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(sin2), Math.sqrt(1 - sin2))
}

export function PathEditor({ map }: Props) {
  const [active, setActive] = useState(false)
  const [saved, setSaved] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle')
  const [info, setInfo] = useState({ nodes: 0, paths: 0, sel: null as string | null })

  const nodesRef = useRef(new Map<string, ENode>())
  const pathsRef = useRef<EPath[]>([])
  const selRef = useRef<string | null>(null)
  const uidRef = useRef(0)

  function uid() { return `n${++uidRef.current}` }

  function refreshInfo() {
    setInfo({ nodes: nodesRef.current.size, paths: pathsRef.current.length, sel: selRef.current })
  }

  function refreshPolys(nodeId: string) {
    for (const p of pathsRef.current) {
      if (!p.nodeIds.includes(nodeId)) continue
      p.polyline.setLatLngs(
        p.nodeIds.map(id => { const n = nodesRef.current.get(id)!; return [n.lat, n.lng] as L.LatLngTuple })
      )
    }
  }

  function selectNode(id: string | null) {
    const prev = selRef.current
    if (prev) nodesRef.current.get(prev)?.marker.setIcon(dotIcon(false))
    selRef.current = id
    if (id) nodesRef.current.get(id)?.marker.setIcon(dotIcon(true))
    setInfo(s => ({ ...s, sel: id }))
  }

  function mkNode(lat: number, lng: number, m: L.Map): ENode {
    const id = uid()
    const marker = L.marker([lat, lng], { icon: dotIcon(false), draggable: true }).addTo(m)
    const node: ENode = { id, lat, lng, marker }
    nodesRef.current.set(id, node)

    marker.on('drag', () => {
      const p = marker.getLatLng()
      node.lat = +p.lat.toFixed(5)
      node.lng = +p.lng.toFixed(5)
      refreshPolys(id)
    })

    marker.on('dragend', () => {
      // Find any other node within 12m — if found, merge dragged node into it
      let target: ENode | null = null
      let bestDist = Infinity
      nodesRef.current.forEach((other) => {
        if (other.id === id) return
        const d = haversineM([node.lat, node.lng], [other.lat, other.lng])
        if (d < 12 && d < bestDist) { bestDist = d; target = other }
      })
      if (!target) return

      const keepId = (target as ENode).id

      // Redirect all paths using dragged node to use the kept node instead
      for (const p of pathsRef.current) {
        const idx = p.nodeIds.indexOf(id)
        if (idx === -1) continue
        p.nodeIds[idx] = keepId
        // Remove self-loops (same node consecutive)
        for (let i = p.nodeIds.length - 1; i > 0; i--) {
          if (p.nodeIds[i] === p.nodeIds[i - 1]) p.nodeIds.splice(i, 1)
        }
        p.polyline.setLatLngs(
          p.nodeIds.map(nid => { const n = nodesRef.current.get(nid)!; return [n.lat, n.lng] as L.LatLngTuple })
        )
      }

      // Remove paths that collapsed to < 2 nodes
      pathsRef.current = pathsRef.current.filter(p => {
        if (p.nodeIds.length >= 2) return true
        p.polyline.remove()
        return false
      })

      // Remove the dragged node
      marker.remove()
      nodesRef.current.delete(id)
      if (selRef.current === id) selectNode(keepId)
      refreshInfo()
    })

    marker.on('click', (e) => {
      L.DomEvent.stopPropagation(e)
      selectNode(selRef.current === id ? null : id)
    })

    return node
  }

  function mkPath(nodeIds: string[], m: L.Map): EPath {
    const latlngs = nodeIds.map(id => {
      const n = nodesRef.current.get(id)!
      return [n.lat, n.lng] as L.LatLngTuple
    })
    const polyline = L.polyline(latlngs, { color: '#E8820A', weight: 2.5, opacity: 0.9 }).addTo(m)
    const path: EPath = { nodeIds, polyline }

    // Click on segment → insert node between the two closest neighbours
    polyline.on('click', (e: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(e)
      if (!map) return
      const clickPt: [number, number] = [+e.latlng.lat.toFixed(5), +e.latlng.lng.toFixed(5)]

      // Find the segment index with minimum midpoint distance to click
      let bestIdx = 0
      let bestDist = Infinity
      for (let i = 0; i < path.nodeIds.length - 1; i++) {
        const a = nodesRef.current.get(path.nodeIds[i])!
        const b = nodesRef.current.get(path.nodeIds[i + 1])!
        const mid: [number, number] = [(a.lat + b.lat) / 2, (a.lng + b.lng) / 2]
        const d = haversineM(clickPt, mid)
        if (d < bestDist) { bestDist = d; bestIdx = i }
      }

      const newNode = mkNode(clickPt[0], clickPt[1], map)
      path.nodeIds.splice(bestIdx + 1, 0, newNode.id)
      path.polyline.setLatLngs(
        path.nodeIds.map(id => { const n = nodesRef.current.get(id)!; return [n.lat, n.lng] as L.LatLngTuple })
      )
      selectNode(newNode.id)
      refreshInfo()
    })

    pathsRef.current.push(path)
    return path
  }

  function deleteSelected() {
    const id = selRef.current
    if (!id) return
    const node = nodesRef.current.get(id)
    if (!node) return

    node.marker.remove()
    nodesRef.current.delete(id)

    // Remove from all paths; delete path if < 2 nodes remain
    pathsRef.current = pathsRef.current.filter(p => {
      const idx = p.nodeIds.indexOf(id)
      if (idx === -1) return true
      p.nodeIds.splice(idx, 1)
      if (p.nodeIds.length < 2) {
        p.polyline.remove()
        return false
      }
      p.polyline.setLatLngs(
        p.nodeIds.map(nid => { const n = nodesRef.current.get(nid)!; return [n.lat, n.lng] as L.LatLngTuple })
      )
      return true
    })

    selRef.current = null
    refreshInfo()
  }

  // ── load existing SACRED_PATHS when editor opens ────────────────────────────

  useEffect(() => {
    if (!map || !active) return

    const keyToId = new Map<string, string>()
    for (const pts of SACRED_PATHS) {
      const ids: string[] = []
      for (const [lat, lng] of pts) {
        const key = `${(+lat.toFixed(5))},${(+lng.toFixed(5))}`
        if (!keyToId.has(key)) {
          const n = mkNode(+lat.toFixed(5), +lng.toFixed(5), map)
          keyToId.set(key, n.id)
        }
        ids.push(keyToId.get(key)!)
      }
      mkPath(ids, map)
    }
    setInfo({ nodes: nodesRef.current.size, paths: pathsRef.current.length, sel: null })

    return () => {
      nodesRef.current.forEach(n => n.marker.remove())
      pathsRef.current.forEach(p => p.polyline.remove())
      nodesRef.current.clear()
      pathsRef.current = []
      selRef.current = null
    }
  }, [map, active])   // eslint-disable-line react-hooks/exhaustive-deps

  // ── map click: extend from selected node ───────────────────────────────────

  useEffect(() => {
    if (!map || !active) return

    const handler = (e: L.LeafletMouseEvent) => {
      const selId = selRef.current
      if (!selId) return

      const lat = +e.latlng.lat.toFixed(5)
      const lng = +e.latlng.lng.toFixed(5)
      const newNode = mkNode(lat, lng, map)
      mkPath([selId, newNode.id], map)
      selectNode(newNode.id)
      refreshInfo()
    }

    map.on('click', handler)
    return () => { map.off('click', handler) }
  }, [map, active])   // eslint-disable-line react-hooks/exhaustive-deps

  // ── keyboard: Delete/Backspace removes selected node ───────────────────────

  useEffect(() => {
    if (!active) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [active])   // eslint-disable-line react-hooks/exhaustive-deps

  // ── output ─────────────────────────────────────────────────────────────────

  function buildTs(): string {
    const lines = pathsRef.current
      .filter(p => p.nodeIds.length >= 2)
      .map(p => {
        const pts = p.nodeIds.map(id => { const n = nodesRef.current.get(id)!; return `[${n.lat}, ${n.lng}]` })
        return `  [${pts.join(', ')}],`
      })
    return [
      "export type LatLng = [number, number]\n",
      `export const SACRED_PATHS: LatLng[][] = [`,
      ...lines,
      `]\n`,
    ].join('\n')
  }

  async function savePaths() {
    setSaved('saving')
    try {
      const res = await fetch('/api/save-paths', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: buildTs() }),
      })
      setSaved(res.ok ? 'ok' : 'err')
    } catch {
      setSaved('err')
    }
    setTimeout(() => setSaved('idle'), 2500)
  }

  if (!import.meta.env.DEV) return null

  const btn = (label: string, onClick: () => void, col = '#F5E6C8'): React.ReactNode => (
    <button key={label} onClick={onClick} style={{
      background: '#1A0E04', color: col, border: `1px solid ${col}`,
      padding: '5px 8px', cursor: 'pointer', fontFamily: 'monospace',
      fontSize: 11, width: '100%', textAlign: 'left', marginBottom: 3,
    }}>{label}</button>
  )

  return (
    <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2000 }}>
      {!active
        ? btn('✏ Edit Paths (dev)', () => setActive(true), '#E8820A')
        : (
          <div style={{
            background: 'rgba(26,14,4,0.95)', border: '1px solid #E8820A',
            padding: 10, minWidth: 220, fontFamily: 'monospace', fontSize: 11,
          }}>
            <div style={{ color: '#E8820A', fontWeight: 'bold', marginBottom: 6, fontSize: 12 }}>
              PATH EDITOR
            </div>
            <div style={{ color: '#ccc', lineHeight: 1.8, marginBottom: 8 }}>
              {info.nodes} nodes · {info.paths} segments
              <br />
              {info.sel
                ? <span style={{ color: '#FFD700' }}>● selected — click map to extend</span>
                : <span style={{ color: '#aaa' }}>click a node to select it</span>
              }
              <br />
              <span style={{ color: '#888' }}>drag node to move · click segment to split</span>
              <br />
              <span style={{ color: '#888' }}>Del / Backspace to delete selected node</span>
            </div>
            {info.sel && btn('✕ delete selected node', deleteSelected, '#FF6B6B')}
            {btn(
              saved === 'saving' ? '… saving…'
              : saved === 'ok' ? '✓ saved to sacredPaths.ts!'
              : saved === 'err' ? '✗ save failed'
              : '💾 save to sacredPaths.ts',
              savePaths,
              saved === 'ok' ? '#90EE90' : saved === 'err' ? '#FF6B6B' : '#F5E6C8',
            )}
            {btn('✕ close', () => { setActive(false); setInfo(s => ({ ...s, sel: null })) }, '#888')}
          </div>
        )
      }
    </div>
  )
}
