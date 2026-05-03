# Relic Hunter – Full App Description (50 points)

A mobile-first PWA (React 19 + TypeScript + Vite + Zustand + Leaflet) set in medieval Catholic Milan.
The player is a relic pilgrim walking the historic city, discovering and collecting 12 authentic sacred relics.

---

## Identity & Theme

1. **Genre**: Collectible walking-pilgrimage RPG. No combat. The loop is: walk → discover → collect → venerate → repeat. Tone is reverent, scholarly, quietly atmospheric — not satirical.

2. **Setting**: Historic Milan (centro storico), rendered on Stamen Watercolor painted map tiles. Every relic is a real historical object with a real church location, real provenance, and a genuine interesting fact.

3. **Currency**: Holy Essence (✦) — earned by collecting relics and completing quests. Displayed in header. All titles, quest names, buff names use ecclesiastical Latin.

4. **22 relics total**: 12 active in Milan (on the map), 10 in Rome (locked, shown as silhouettes in the Codex with cryptic Latin hints — long-term mystery bait).

5. **9 relic categories** with distinct colors used consistently everywhere: NAIL (dark red), WOOD (brown), THORN (green), BLOOD (crimson), BODY (purple), BONE (tan), CLOTH (blue), MAGI (gold), INSTRUMENT (grey).

---

## Map & Visual Design

6. **Leaflet map** with Stamen Watercolor tiles. `maxNativeZoom: 16`, `maxZoom: 17` — tiles upscale instead of going blank, zoom capped to preserve the painted aesthetic. Street label overlay at 50% opacity.

7. **Relic markers**: SVG rings (`L.divIcon`), category-colored, no fill — transparent center. Size scales with zoom: 44px at zoom 17 → 22px at zoom 13, recalculated on `zoomend`.

8. **Co-located relics** (multiple relics at the same church) are spread in a small circle (~28m radius) so rings don't overlap.

9. **Sacred paths** (`src/data/sacredPaths.ts`): 24 hand-drawn polylines covering Milan centro storico streets. Rendered as double-layer lines — white glow underneath, orange `#E8820A` on top — to match the watercolor's warm street tones and avoid the violet building areas.

10. **Sacred path visual problem (unsolved)**: Some path coordinates were hand-estimated and still cross building areas (violet on the watercolor). Need a better coordinate-editing workflow — ideally an in-app path editor that lets the developer click directly on the Stamen map to record street coordinates.

11. **Pilgrim avatar**: Gold ✝ symbol in a dark circle (`L.divIcon`), `zIndexOffset: 1000` so it renders above relic rings. Starts at Duomo (45.4641, 9.1919). Position persists in Zustand + localStorage.

12. **Collected-relic route**: A dashed crimson polyline connects all collected relics in collection order — a visible "pilgrimage trail" that grows as you collect.

---

## Walking & Procession System (core mechanic — needs deepening)

13. **Trigger**: Player taps a relic ring → RelicCard overlay opens → primary button is "⚜ Begin Procession". Tapping it closes the card and starts the walk. A small "collect manually" fallback link exists below.

14. **Routing**: `src/engine/pathRouter.ts` builds a weighted graph from the 24 sacred path segments at module load (~150 nodes). Dijkstra finds the shortest on-graph route from the pilgrim's current position to the destination. Avatar follows this route — no cutting through buildings.

15. **Snap-to-graph**: Both start and end positions are snapped to their nearest graph nodes before routing. The actual pilgrim start/end positions are prepended/appended to the route so the avatar begins and ends at exact positions.

16. **Constant cinematic speed**: `WALK_SPEED_MPS = 70`. Full centro storico crossing takes ~20 seconds. A short hop between adjacent churches takes proportionally less. Formula: `steps = distance / speed * 1000 / 100ms`.

17. **Animation loop**: `setInterval` at 100ms. Each tick calls `positionAtProgress()` which interpolates the avatar's exact lat/lng along the multi-segment path using precomputed cumulative segment distances.

18. **Audio**: Web Audio API synthesizes stone-footstep sounds (no audio files). Each step = decaying noise burst through a low-pass filter with randomized pitch/volume. Footstep plays every ~0.8m walked. Cadence varies naturally.

19. **Devotio points**: +1 earned every ~30m walked. Shown in store, not yet surfaced in UI. Intended as a spendable currency for future "Prayer of Intercession" mechanic.

20. **On arrival**: `completeProcession()` fires — pilgrim position updates to church lat/lng, `collect(relicId)` triggers (earning Holy Essence, updating quests/goals), +10 Devotio bonus.

21. **Procession path line**: During the walk, a dotted gold polyline shows the full route from current position to destination. Removed on arrival.

22. **One at a time**: `processingRelicId` in Zustand is null when idle, set to relic ID during walk. "Begin Procession" button is disabled with status text while another walk is in progress.

---

## Gameplay Loop & Progression (current state + what's missing)

23. **Current loop (too thin)**: Tap ring → procession → collect → ring disappears conceptually → repeat. No meaningful choice about WHICH relic to walk to next. No tension during the walk. No revelation moment on arrival.

24. **What creates pull right now**: Quest board shows 3 active quests with progress bars — they loosely guide the player toward specific relics. Holy Essence counter rewards collection. Goals panel shows 9 achievements with Latin titles as long-term goals.

25. **Spannungsbogen problem**: The dramatic arc is flat. Discovery (see ring) → walk (20 sec, nothing happens) → collect (instant card) → done. There is no uncertainty, no anticipation payoff, no surprise. The walk is currently a loading screen, not gameplay.

26. **Missing: random walk events** (architecture exists in the proposal but not implemented). During procession, 10–20% chance per landmark passed to show a "Veiled Vision" popup — a cryptic lore fragment, a partial silhouette of a Rome relic, a Devotio bonus. Would transform the walk from dead time into discovery space.

27. **Missing: arrival ceremony**. Currently the relic is collected silently. Should have: a 2-3 second "Examination" animation where the relic's theological dignity is "confirmed", a sound sting, the ring on the map transforms visually (fill with category color?), and the RelicCard auto-opens in "collected" state.

28. **Missing: meaningful walking choice**. Player has no reason to choose one relic over another except quest guidance. Needs: a "scent trail" mechanic (nearby relics emit faint glow when within 200m), or a partial-reveal system where relic names are hidden until you're close enough.

29. **Missing: liturgical urgency**. Feast day bonuses (e.g. Good Friday ×2.5) are shown in a banner but don't change player behavior because the bonus only applies to quests, not to the collect action itself. Should apply a visual effect to the relevant relic rings (golden pulse) and show a countdown timer.

30. **Missing: Rome unlock progression**. Currently Rome is just "locked forever". There should be a milestone: collect all 12 Milan relics → the Rome silhouettes in the Codex animate, a dramatic Latin announcement plays, and the Rome map becomes explorable. This is the main long-term Spannungsbogen.

---

## Quest System

31. **Quest generator** (`src/engine/QuestGenerator.ts`): Builds candidates from CATEGORY_SWEEP, SAINT_REASSEMBLY, INSTRUMENTA_PASSIONIS, LOCAL_PATRON types. Scores by proximity to 45% completion. Returns top 3, deduplicated by type.

32. **Quests auto-refresh** every 24 hours or when the board is empty. Completed quests are auto-claimed on relic collection.

33. **Quest rewards**: Holy Essence bonus + Latin title badge (e.g. *Venator Ambrosianus*) + optional timed Miracle Buff (e.g. *Benedictio Ambrosiana* = +25% on Patristic relics for 24h).

34. **Quest-procession link (missing)**: Quests currently have no effect on the walking experience. Should: highlight the quest target's ring on the map, offer "Walk to next quest objective" shortcut, and show quest flavor text during the procession walk.

35. **SAINT_REASSEMBLY quests** are the most narratively interesting — collect body parts of a saint across multiple relics (e.g. reassemble St. Ambrose from body + bones + vestments). Could chain into a multi-stop procession route.

---

## Theological Classification & Content

36. **Three-axis system** on every relic: Forma Materialis (physical substance), Origo Sancta (provenance), Dignitas Theologica (rank: Primaria/Secundaria/Tertiaria/Instrumenta Passionis).

37. **Veneration types**: Latria (God/Christ — gold), Hyperdulia (Marian — rose), Dulia (saints — blue). Used in Chapel wall section organization and glow effects.

38. **10 liturgical feasts** with real MM-DD dates and point multipliers. E.g. Rito della Nivola (Sept 14, ×3.0) — the day the Holy Nail descends from the Duomo vault. Today (Apr 17 2026) is in the Good Friday window (×2.5).

39. **Goals panel**: 9 achievements with Latin titles. Overlay triggered by "Scroll" button on map screen. E.g. *Filius Ambrosii*, *Portitor Crucis*, *Milano Completato*.

40. **Chapel screen**: Visual style changes with collection size — Gothic (0–3), Ambrosian (4–7), Baroque (8+). Relics displayed on three veneration-type walls. Active Miracle Buffs with countdowns shown here.

---

## Sacred Path System — Open Problems

41. **Path data quality**: Coordinates in `sacredPaths.ts` were hand-estimated from memory, not traced on actual map. Several segments likely cross building areas (violet on watercolor). This makes the procession routing visually wrong.

42. **Better path editing approach needed**: The ideal tool would let the developer click directly on the Stamen watercolor map (in the running app) and record coordinates in real time. Clicking on a street = adding a node. "End path" = save to clipboard as a TypeScript array. No external tool required.

43. **Graph connectivity**: If two path segments don't share a node within 5 decimal place precision (~1m), Dijkstra treats them as disconnected. Currently some paths may be islands. The in-app editor should visually show graph nodes as dots to catch disconnections.

44. **Path coverage gaps**: The 24 current paths cover major arteries but miss many small alleys (vicoli) that the watercolor shows as white/orange. These gaps force Dijkstra to route along longer main streets rather than through more atmospheric shortcuts.

45. **Future: free wandering mode**. Currently players can only walk to relic destinations. A `map.on('click')` handler that calls `beginProcession` toward any tapped point (snapped to nearest graph node) would let players explore freely — earning Devotio just by wandering the streets.

---

## Technical Architecture

46. **State**: Zustand v5 + `persist`. Key fields: `collected`, `completedGoals`, `categoriesCollected` (plain arrays, not getters — avoids Zustand infinite-loop trap), `holyEssence`, `pilgrimLat/Lng`, `devotioPoints`, `processingRelicId` (ephemeral, excluded from persist via `partialize`).

47. **useCollection hook**: `useShallow` wrapper prevents infinite re-renders from unstable selector object references.

48. **Path router** (`src/engine/pathRouter.ts`): Graph built once at module load. `buildProcessionRoute(from, to)` → `{waypoints, totalMeters, steps}`. `positionAtProgress()` for smooth multi-segment interpolation. Dijkstra with `Float64Array`/`Int32Array` for dist/prev, `Set` as simple priority queue (fine for ~150 nodes).

49. **Audio**: `useFootsteps.ts` — Web Audio API, no files. `AudioContext` lazy-initialized on first step. Decaying noise burst + low-pass filter + gain randomization per step. Silently fails if AudioContext unavailable.

50. **Persist key**: `relic-hunter-game-v2`. New state fields (pilgrimLat, devotioPoints) survive app reload. `processingRelicId` is excluded — a mid-walk page refresh starts fresh rather than entering a broken animation state.
