# Current problem
Fog-of-War Phase 1 implementation.

# Current state
Phase 1 is fully implemented and TypeScript-clean. The city map starts mostly dark; the pilgrim's position reveals ~75 m of hex tiles permanently as they walk.

# Last 2 interactions
1. User asked to implement `_fogOfWarPhase1Plan.md` — done.

# Next steps
1. `npm run dev` → run testing checklist from §9 of the plan (cold start, walk reveals, persistence, pan/zoom, performance).
2. Walk one full procession on real OSM cache — sanity-check the visual fog peel.
3. Commit. Live with it a few days, then decide on Phase 2 (POI hiding, compass HUD).

----- datetime: 2026-05-04 10:00
# Current problem
Fog of war visual bugs + routing doesn't use hand-drawn paths.

# Current state
Fog is now fully opaque (rgba 1.0) and the canvas overscans by 1 full viewport in each direction, so panning can never drag unfogged map into view. Procession routing now tries SACRED_PATHS_LEGACY graph (Dijkstra) before falling back to OSM cache → straight line. SACRED_PATHS_LEGACY paths also rendered permanently on the map.

# Last 2 interactions
1. User asked to implement fog-of-war Phase 1 — done.
2. User reported: fog too transparent, panning exposes unfogged edges, OSM pedestrian paths missing — all fixed.

# Next steps
1. `npm run dev` → test fog: should be pitch black, panning should not reveal clear areas.
2. Draw paths with PathEditor (dev mode) and save — processions will route along them automatically.
3. Commit once satisfied.
----- datetime: 2026-05-04 22:50
# Current problem
Add "Restart Game" button.

# Current state
Button added to HelpPanel (bottom of panel, below tab content). Clicking shows inline confirmation; confirming calls `resetGame()` and closes the panel. CSS styled with crimson border/text to signal destructive action.

# Last 2 interactions
1. User asked to fix fog-of-war visual bugs and routing — done.
2. User asked to add "Restart Game" button — added to HelpPanel with confirmation step.

# Next steps
1. `npm run dev` → open Help (? button) → scroll to bottom → test restart flow.
2. Verify all state is cleared and tutorialStep resets to 1.
3. Commit when satisfied.
----- datetime: 2026-05-17 13:18
# Current problem
None blocking — large feature set just shipped, needs playtesting.

# Current state
Added: Fervor Spiritalis energy system, 4 rest churches/klosters (N/S/W/E), 3 taverns, pilgrim encounter system with discovery reveals (max 2 active leads), false leads with robbery, golden glow on relic rings, RestPanel UI, Fervor bar in header, procession Fervor cost gate. New game starts at Castello Sforzesco with 20 Fervor, only knows Duomo Nail but can't afford procession (costs 75). Must rest at Castello, meet pilgrims, get hints. Existing players auto-migrated to see all relics/places.

# Last 2 interactions
1. User asked to add Restart Game button — done (HelpPanel).
2. User asked for major feature expansion: 4 churches/klosters + 3 taverns, Fervor energy system, discovery/encounter mechanics, relic ring glow — all implemented.

# Next steps
1. `npm run dev` → test new game flow: start at castello, rest, get encounter, check RestPanel UI.
2. Check that relic rings now glow gold (especially Legendary relics).
3. Verify existing-player migration works (all relics/places revealed, fervor 60+).
4. Tweak Fervor costs if processions feel too easy/hard (currently: 20/40/60/75 by rarity tier).
----- datetime: 2026-05-17 14:15
----- datetime: 2026-05-17 16:24
[Old _claudeCurrentNext.md]
# Current problem
None blocking — introductory flow and walking mode just shipped.
Current state: IntroScreen, walking mode, contextual "Rest here" button, Castello accessible.

----- datetime: 2026-05-17 18:42
# Current problem
None blocking — robbery system and fog reveal just shipped.

# Current state
Five changes implemented and building clean:
1. FOG_REVEAL_RING_WALK raised from 2 → 3
2. 10 ROBBERY_EVENTS in restPlaces.ts
3. enterPlace uses ROBBERY_EVENTS
4. False lead markers stay on map after robbery
5. RestPanel investigate/robbery UI

# Last 2 interactions
1. Walking mode, IntroScreen, contextual "Rest here", Castello accessible — done.
2. Fog radius bigger, 10 robbery events, places stay post-robbery, random tavern robberies, fix +0 fervor giveaway — done.

# Next steps (superseded — see new file)

----- datetime: 2026-05-17 19:10
# Current problem
None blocking — fog reveal radius inconsistency fixed.
# Current state
Collapsed fog reveal to single FOG_REVEAL_RING=10 constant; removed duplicate main.tsx seed.
# Next steps
Playtest walk+procession; commit fog fix.

----- datetime: 2026-05-17 19:35
# Current problem
None blocking — fog reveal fix + timed-action buttons just shipped. Not yet browser-tested.

# Current state
New reusable `ProgressButton` component (src/components/ProgressButton.tsx) with two modes: 'cooldown' (press → activate → 5s bar → repeatable) and 'gate' (bar auto-runs on mount → then pressable). Build + typecheck clean.

# Last 2 interactions
1. Fixed uneven fog reveal — single `FOG_REVEAL_RING=10`, removed duplicate main.tsx seed.
2. Added "Pray for Fervor" map button (+1 fervor/click, 5s cooldown bar) and an overnight-wait progress gate on the RestPanel "Continue your pilgrimage" button; removed "You began your journey here" from Castello Sforzesco description.

# Next steps
1. Browser-test: get robbed, confirm "Pray for Fervor" button appears bottom-left of map, gives +1/click with a 5s progress bar.
2. Rest at a place, confirm "Continue your pilgrimage" is gated by a 5s "The night passes…" bar.
3. Commit the fog fix + the timed-action buttons.

----- datetime: 2026-05-17 20:20
# Current problem
None blocking — added a C64-style pixel-art castle illustration to the intro screen. Not yet browser-tested in the running app.

# Current state
New `CastleArt` component (src/components/CastleArt.tsx) renders a hand-crafted pixel-art SVG of the Castello Sforzesco in the style of C64 Defender of the Crown: red-brick towers, crenellations, clock, pennants, autumn trees framing, mountains. Wired into the top of IntroScreen, replacing the `✦` glyph. Typecheck clean; SVG verified by rendering to PNG.

# Last 2 interactions
1. Shipped ProgressButton + fog reveal fix (prior session).
2. Built CastleArt pixel-art SVG, wired into IntroScreen, added `.intro-castle-art`/`.castle-art` CSS (full-bleed top of card, pixelated rendering, faint scanlines).

# Next steps
1. Browser-test: open the intro screen, confirm the castle art displays at the top of the intro card and looks good at the card's width.
2. Commit the CastleArt component + IntroScreen + CSS changes (alongside the still-uncommitted fog fix + ProgressButton work).
3. Optional polish: tune dither bands or clock detail if it looks crude in-app.

----- datetime: 2026-05-17 20:50
# Current problem
Castle intro graphic: user rejected the hand-coded SVG approach as too complicated. Switched to using a real image file — waiting for the user to supply the image.

# Current state
IntroScreen now renders an `<img>` from `/castello-sforzesco.png` (served from `public/`). If the file is missing the image block hides itself gracefully (imgFailed state). The hand-coded `CastleArt.tsx` SVG component was deleted. Build passes.

# Last 2 interactions
1. Rebuilt CastleArt as a sepia-toned Amiga-style courtyard SVG (round tower, wings) — user found the whole SVG approach too complicated.
2. Switched approach: removed CastleArt.tsx, wired IntroScreen to load a real image from `public/castello-sforzesco.png`, created `public/` dir.

# Next steps
1. User drops their Amiga-style castle image at `public/castello-sforzesco.png` (PNG).
2. Verify it displays correctly at the top of the intro card; `image-rendering: pixelated` keeps pixel art crisp when upscaled.
3. Commit + deploy to Vercel production once the image is in place.

----- datetime: 2026-05-21 00:00
# Previous status (from _claudeCurrentNext.md)
## Current problem
None blocking. Exam-info-hiding shipped; castle graphic removed (user will add a real image later).

## Current state
Commit e5a260d deployed to Vercel production. During the theological exam the relic history + fun fact are hidden. The intro screen castle graphic was fully removed.

## Last 2 interactions
1. Hid relic history/fun fact during the quiz phase of ArrivalCeremony.
2. Removed castle graphic entirely, committed e5a260d.

## Next steps
1. Push e5a260d to origin when user asks.
2. User will supply castle image later.
3. Clean up stray file `src/components/RestPanel 2.tsx`.
