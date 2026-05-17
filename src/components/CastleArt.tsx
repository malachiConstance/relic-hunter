import { Fragment } from 'react'

/**
 * Pixel-art illustration of the Castello Sforzesco rendered in the spirit of
 * C64 multicolor artwork (Defender of the Crown): tiny palette, blocky shapes,
 * crisp edges. Pure SVG — scales cleanly, no binary asset.
 */

const C = {
  skyTop: '#5a4fb8',
  skyMid: '#7d72d4',
  skyLow: '#a59ce4',
  snow: '#f1f0f8',
  snowSh: '#b9b6d2',
  mtn: '#6f64ac',
  mtnSh: '#4a3f8c',
  mist: '#473c86',
  hillHi: '#86bb4e',
  hill: '#56863a',
  hillLo: '#3a5d24',
  hillSh: '#2a4419',
  brickHi: '#c46d57',
  brick: '#9c4639',
  brickLo: '#6b2c22',
  stone: '#e7e3d2',
  stoneSh: '#b0ab93',
  gate: '#170c07',
  win: '#241409',
  path: '#a26c3a',
  pathHi: '#c2924f',
  pathLo: '#6f4522',
  trunk: '#311f0d',
  trunkHi: '#4d3318',
  leaf: '#1c1408',
  leafSh: '#0d0a04',
  autumn: '#a8503b',
  gold: '#c89234',
  rock: '#808080',
  rockHi: '#aaaaaa',
  rockLo: '#4c4c4c',
  flag: '#bb3340',
}

type Rect = { x: number; y: number; w: number; h: number; f: string }

function rects(list: Rect[], key: string) {
  return list.map((r, i) => (
    <rect key={`${key}${i}`} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.f} />
  ))
}

// Crenellations: a row of merlons starting at x, total span w.
function merlons(x: number, y: number, w: number, h: number, f: string, mw: number, key: string) {
  const out: Rect[] = []
  for (let cx = x; cx + mw <= x + w + 0.01; cx += mw * 2) {
    out.push({ x: cx, y, w: mw, h, f })
  }
  return rects(out, key)
}

// Stepped pyramid mountain, snow-capped.
function mountain(cx: number, topY: number, rows: number, growth: number, key: string) {
  const out: Rect[] = []
  for (let i = 0; i < rows; i++) {
    const w = (i + 1) * growth
    const y = topY + i * 2
    const snowy = i < rows * 0.42
    out.push({ x: cx - w / 2, y, w, h: 2, f: snowy ? C.snow : C.mtn })
    out.push({ x: cx, y, w: w / 2, h: 2, f: snowy ? C.snowSh : C.mtnSh })
  }
  return rects(out, key)
}

// Stepped green hill; the castle crest sits highest in the centre.
function hill() {
  const out: Rect[] = []
  const cols = 32
  const cw = 8
  for (let c = 0; c < cols; c++) {
    const x = c * cw
    const t = (x + cw / 2 - 128) / 128
    const ridge = Math.round(104 + t * t * 32)
    out.push({ x, y: ridge, w: cw, h: 156 - ridge, f: C.hill })
    out.push({ x, y: ridge, w: cw, h: 3, f: C.hillHi })
    out.push({ x, y: ridge + 3, w: cw, h: 2, f: C.hill })
  }
  // grass shading patches
  const patch: Rect[] = [
    { x: 24, y: 124, w: 22, h: 8, f: C.hillLo },
    { x: 70, y: 134, w: 30, h: 10, f: C.hillLo },
    { x: 168, y: 130, w: 26, h: 9, f: C.hillLo },
    { x: 210, y: 122, w: 24, h: 8, f: C.hillLo },
    { x: 100, y: 146, w: 40, h: 10, f: C.hillSh },
    { x: 52, y: 116, w: 16, h: 5, f: C.hillHi },
    { x: 188, y: 118, w: 18, h: 5, f: C.hillHi },
  ]
  return [...rects(out, 'h'), ...rects(patch, 'hp')]
}

// Winding path from the foreground up to the gate.
function path() {
  const out: Rect[] = [
    { x: 96, y: 150, w: 64, h: 6, f: C.path },
    { x: 102, y: 142, w: 50, h: 9, f: C.path },
    { x: 108, y: 132, w: 40, h: 11, f: C.path },
    { x: 113, y: 122, w: 30, h: 11, f: C.path },
    { x: 118, y: 112, w: 22, h: 11, f: C.path },
    // sunlit left edge
    { x: 96, y: 150, w: 5, h: 6, f: C.pathHi },
    { x: 102, y: 142, w: 5, h: 9, f: C.pathHi },
    { x: 108, y: 132, w: 5, h: 11, f: C.pathHi },
    { x: 113, y: 122, w: 4, h: 11, f: C.pathHi },
    // shaded right edge
    { x: 153, y: 150, w: 7, h: 6, f: C.pathLo },
    { x: 145, y: 142, w: 7, h: 9, f: C.pathLo },
    { x: 141, y: 132, w: 7, h: 11, f: C.pathLo },
    { x: 136, y: 122, w: 7, h: 11, f: C.pathLo },
  ]
  return rects(out, 'p')
}

function castle() {
  const body: Rect[] = [
    // central Filarete tower
    { x: 116, y: 66, w: 24, h: 46, f: C.brick },
    { x: 116, y: 66, w: 3, h: 46, f: C.brickHi },
    { x: 134, y: 66, w: 6, h: 46, f: C.brickLo },
    // central tower stone crown band
    { x: 113, y: 58, w: 30, h: 10, f: C.stone },
    { x: 113, y: 66, w: 30, h: 2, f: C.stoneSh },
    // left round tower
    { x: 78, y: 84, w: 7, h: 28, f: C.brickHi },
    { x: 85, y: 84, w: 9, h: 28, f: C.brick },
    { x: 94, y: 84, w: 7, h: 28, f: C.brick },
    { x: 101, y: 84, w: 5, h: 28, f: C.brickLo },
    // right round tower
    { x: 150, y: 84, w: 7, h: 28, f: C.brickHi },
    { x: 157, y: 84, w: 9, h: 28, f: C.brick },
    { x: 166, y: 84, w: 7, h: 28, f: C.brick },
    { x: 173, y: 84, w: 5, h: 28, f: C.brickLo },
    // curtain walls
    { x: 106, y: 90, w: 10, h: 22, f: C.brick },
    { x: 106, y: 90, w: 2, h: 22, f: C.brickHi },
    { x: 140, y: 90, w: 10, h: 22, f: C.brick },
    { x: 147, y: 90, w: 3, h: 22, f: C.brickLo },
    // gate
    { x: 122, y: 92, w: 12, h: 20, f: C.gate },
    { x: 124, y: 90, w: 8, h: 2, f: C.gate },
    { x: 126, y: 88, w: 4, h: 2, f: C.gate },
    { x: 122, y: 90, w: 12, h: 2, f: C.stoneSh },
    // window slits
    { x: 119, y: 74, w: 3, h: 8, f: C.win },
    { x: 134, y: 74, w: 3, h: 8, f: C.win },
    { x: 89, y: 90, w: 3, h: 10, f: C.win },
    { x: 161, y: 90, w: 3, h: 10, f: C.win },
    // clock on the Filarete tower
    { x: 121, y: 80, w: 14, h: 14, f: C.stone },
    { x: 123, y: 82, w: 10, h: 10, f: C.brickLo },
    { x: 127, y: 84, w: 2, h: 5, f: C.gold },
    { x: 128, y: 87, w: 4, h: 2, f: C.gold },
  ]
  const flags: Rect[] = [
    { x: 127, y: 36, w: 2, h: 16, f: C.trunk },
    { x: 91, y: 62, w: 2, h: 14, f: C.trunk },
    { x: 163, y: 62, w: 2, h: 14, f: C.trunk },
  ]
  return (
    <Fragment>
      {rects(body, 'cb')}
      {merlons(113, 50, 30, 8, C.stone, 4, 'cm')}
      {merlons(78, 76, 28, 8, C.brick, 4, 'lm')}
      {merlons(150, 76, 28, 8, C.brick, 4, 'rm')}
      {merlons(106, 84, 10, 6, C.brick, 3, 'lcm')}
      {merlons(140, 84, 10, 6, C.brick, 3, 'rcm')}
      {rects(flags, 'cf')}
      <polygon points="129,37 143,41 129,45" fill={C.flag} />
      <polygon points="93,63 103,66 93,69" fill={C.gold} />
      <polygon points="163,63 153,66 163,69" fill={C.gold} />
    </Fragment>
  )
}

type Puff = { x: number; y: number; s: number }

const LEAF_PUFFS: Puff[] = [
  { x: -8, y: -8, s: 30 }, { x: 18, y: -10, s: 26 }, { x: 40, y: -6, s: 22 },
  { x: -6, y: 16, s: 26 }, { x: 20, y: 14, s: 22 }, { x: -8, y: 38, s: 26 },
  { x: 14, y: 34, s: 20 }, { x: -6, y: 58, s: 24 }, { x: 16, y: 56, s: 18 },
  { x: -8, y: 78, s: 26 }, { x: 12, y: 80, s: 18 }, { x: -6, y: 100, s: 26 },
  { x: 14, y: 104, s: 18 }, { x: -8, y: 122, s: 30 }, { x: 34, y: 20, s: 16 },
  { x: 50, y: 8, s: 16 }, { x: 36, y: 44, s: 14 },
]
const SHADOW_PUFFS: Puff[] = [
  { x: -8, y: 50, s: 18 }, { x: -8, y: 92, s: 18 },
  { x: 24, y: 0, s: 14 }, { x: -8, y: 132, s: 20 },
]
const AUTUMN_PUFFS: Puff[] = [
  { x: 30, y: -4, s: 14 }, { x: 8, y: 8, s: 12 }, { x: 44, y: 14, s: 12 },
  { x: -2, y: 30, s: 11 }, { x: 22, y: 30, s: 11 }, { x: 6, y: 54, s: 12 },
  { x: 0, y: 74, s: 11 }, { x: 18, y: 96, s: 12 }, { x: 4, y: 116, s: 12 },
  { x: 40, y: 2, s: 10 },
]
const GOLD_PUFFS: Puff[] = [
  { x: 36, y: 8, s: 8 }, { x: 12, y: 48, s: 8 }, { x: 24, y: 72, s: 8 },
]

// Framing tree; side 'r' mirrors every x across the 256-wide canvas.
function tree(side: 'l' | 'r') {
  const mir = (x: number, s: number) => (side === 'r' ? 256 - x - s : x)
  const toRects = (puffs: Puff[], f: string) =>
    puffs.map((p) => ({ x: mir(p.x, p.s), y: p.y, w: p.s, h: p.s, f }))
  const trunkX = side === 'r' ? 256 - 16 - 12 : 16
  const trunk: Rect[] = [
    { x: trunkX, y: 70, w: 12, h: 86, f: C.trunk },
    { x: side === 'r' ? trunkX + 9 : trunkX, y: 70, w: 3, h: 86, f: C.trunkHi },
  ]
  return (
    <Fragment>
      {rects(trunk, `tr${side}`)}
      {rects(toRects(SHADOW_PUFFS, C.leafSh), `ls${side}`)}
      {rects(toRects(LEAF_PUFFS, C.leaf), `ld${side}`)}
      {rects(toRects(AUTUMN_PUFFS, C.autumn), `la${side}`)}
      {rects(toRects(GOLD_PUFFS, C.gold), `lg${side}`)}
    </Fragment>
  )
}

function rocks() {
  const out: Rect[] = [
    { x: 2, y: 140, w: 30, h: 16, f: C.rock },
    { x: 2, y: 140, w: 30, h: 3, f: C.rockHi },
    { x: 10, y: 148, w: 14, h: 8, f: C.rockLo },
    { x: 224, y: 138, w: 30, h: 18, f: C.rock },
    { x: 224, y: 138, w: 30, h: 3, f: C.rockHi },
    { x: 232, y: 147, w: 14, h: 9, f: C.rockLo },
    { x: 116, y: 147, w: 18, h: 9, f: C.rock },
    { x: 116, y: 147, w: 18, h: 2, f: C.rockHi },
  ]
  return rects(out, 'rk')
}

export function CastleArt() {
  return (
    <svg
      className="castle-art"
      viewBox="0 0 256 156"
      shapeRendering="crispEdges"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Pixel-art illustration of the Castello Sforzesco"
    >
      <defs>
        <pattern id="dithA" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="2" height="2" fill={C.skyTop} />
          <rect x="2" y="2" width="2" height="2" fill={C.skyTop} />
        </pattern>
        <pattern id="dithB" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="2" height="2" fill={C.skyMid} />
          <rect x="2" y="2" width="2" height="2" fill={C.skyMid} />
        </pattern>
      </defs>

      {/* background — fills the band between mist and hill, behind the castle */}
      <rect x="0" y="0" width="256" height="156" fill={C.skyLow} />

      {/* sky bands with dithered transitions */}
      <rect x="0" y="0" width="256" height="26" fill={C.skyTop} />
      <rect x="0" y="26" width="256" height="24" fill={C.skyMid} />
      <rect x="0" y="50" width="256" height="34" fill={C.skyLow} />
      <rect x="0" y="24" width="256" height="6" fill="url(#dithA)" />
      <rect x="0" y="48" width="256" height="6" fill="url(#dithB)" />

      {/* distant snow-capped mountains */}
      {mountain(74, 40, 22, 4, 'm1')}
      {mountain(150, 32, 26, 4, 'm2')}
      {mountain(212, 46, 18, 4, 'm3')}

      {/* mist band */}
      <rect x="0" y="72" width="256" height="13" fill={C.mist} />
      <rect x="0" y="72" width="256" height="2" fill={C.skyLow} />

      {hill()}
      {path()}
      {castle()}
      {tree('l')}
      {tree('r')}
      {rocks()}
    </svg>
  )
}
