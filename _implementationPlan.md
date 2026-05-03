# Relic Hunter — Implementation Plan: Pilgrim's Journey Redesign

Source documents: user redesign spec + `5quests.txt`
Existing stack: React 19 + TypeScript + Zustand v5 + Leaflet + Web Audio API
All phases are independent unless noted. Ship Phase 1 before any other phase.

---

## Phase 1 — Foundation (must ship first, everything else depends on it)

### 1.1 Zustand store additions
File: `src/store/useGameStore.ts`

New state fields:
```typescript
tutorialStep: number          // 0 = not started, 1–5 = in tutorial, 6 = tutorial done
lastTeaserRelicId: string | null  // which ring was tapped (shows teaser, not full card)
ceremonyRelicId: string | null    // which relic is currently in arrival ceremony
```

Actions:
- `advanceTutorial()` — increments tutorialStep, auto-claims tutorial reward, checks if step 6 (done)
- `setTeaserRelic(id)` / `clearTeaser()` — controls teaser overlay visibility
- `beginCeremony(id)` / `completeCeremony()` — controls arrival ceremony state

`tutorialStep` must be persisted. `lastTeaserRelicId` and `ceremonyRelicId` are ephemeral (excluded from `partialize` like `processingRelicId`).

---

### 1.2 Tutorial quest data
New file: `src/data/tutorialQuests.ts`

Direct copy from `5quests.txt` with these fixes:
- `targetRelicIds: ["santo_chiodo"]` → `["santo-chiodo"]` (match actual relic ID with hyphens)
- Add TypeScript interface `TutorialQuest` with fields: `id`, `step`, `type`, `name`, `description`, `objective`, `reward`, `isCompleted`, plus optional `targetRelicIds`, `targetCategory`, `targetCategories`, `targetProvenance`, `requiredDignityTypes`, `requiredCollectionCount`, `requiresActiveFeast`, `hint`
- Tutorial quest 4 (`In Festum Crucis`) — `requiresActiveFeast: true` should fall back gracefully if no feast is active (just require any INSTRUMENT or WOOD relic)

Progress check function `checkTutorialProgress(quest, collected, activeFeast)` — already detailed in 5quests.txt, add feast null-guard.

---

### 1.3 Tutorial progress in collect()
File: `src/store/useGameStore.ts` — inside `collect(id)`

After the existing quest/goal logic, add:
```typescript
const { tutorialStep } = get()
if (tutorialStep < 5) {
  const tq = TUTORIAL_QUESTS[tutorialStep]  // step 0 → quest index 0
  if (tq && checkTutorialProgress(tq, get().collected, getActiveFeastToday())) {
    get().advanceTutorial()
  }
}
```

Tutorial 5 (Chapel) is the only quest that cannot be completed via collect() — it requires opening the Chapel screen. Handle separately in `ReliquaryChapel.tsx`.

---

### 1.4 New RelicTeaserOverlay component
New file: `src/components/RelicTeaserOverlay.tsx`

Shown instead of full RelicCard when tapping an **uncollected** relic ring.
Contains:
- Large category-colored ring preview (SVG, same style as map marker)
- Category label + 1-line Latin teaser (e.g. "NAIL — *Clavus Sanctus*")
- Distance in meters from pilgrim current position
- "⚜ Begin Procession" button → calls `beginProcession(id)` + `clearTeaser()`
- Small "See full record in Codex →" link (opens Codex to this relic) — does NOT reveal lore on the map
- During tutorial step 1: teaser text is the hint from `TUTORIAL_QUESTS[0].hint`

**Key principle**: zero theological data shown here. No points, no dignity, no lore. That is the arrival ceremony's reward.

---

### 1.5 Wire teaser into App.tsx + Map.tsx
File: `src/App.tsx`

Change `onRelicClick` handler:
- If relic is **uncollected** → `setTeaserRelic(id)` (show teaser overlay, not RelicCard)
- If relic is **already collected** → `setSelectedRelic(relic)` (show full RelicCard as now)

The existing `RelicCard` stays intact for collected relics (re-reading, inspecting, uncollecting).

---

## Phase 2 — Arrival Ceremony (the TA-DAAAA moment)

### 2.1 Ceremony trigger
File: `src/store/useGameStore.ts` — inside `completeProcession()`

Instead of calling `collect()` directly, set `ceremonyRelicId = processingRelicId` and `processingRelicId = null`.
The ceremony component handles the actual collection after its animation.

### 2.2 ArrivalCeremony component
New file: `src/components/ArrivalCeremony.tsx`

Triggered when `ceremonyRelicId` is non-null. Full-screen overlay. Sequence:
1. **t=0**: Screen dims to 60% opacity. Pilgrim avatar pulses.
2. **t=0.5s**: Ring on map transforms — border fills with category color (achieved by updating marker icon).
3. **t=1s**: Particle burst using Web Audio API chime (new `useChime()` mini-hook) + CSS `@keyframes` radial burst of 8–12 small dots in veneration color.
4. **t=2s**: RelicCard slides up in "Newly Venerated" mode — full three-axis table, lore, interesting fact revealed. Badge animations for Dignitas Theologica label.
5. **t=3s**: Holy Essence counter in header animates up with flying ✦ numbers.
6. **Optional quiz** (see Phase 4).
7. **"Place in Chapel →"** button → calls `collect(ceremonyRelicId)` + `completeCeremony()` + navigates to Chapel.
8. **"Continue"** button → just calls `collect()` + `completeCeremony()`, stays on map.

### 2.3 Collected ring visual
File: `src/components/Map.tsx` — `makeRelicIcon()`

Add a `collected` boolean parameter. When collected:
- Ring stroke stays same color but add a thin inner fill (category color at 25% opacity)
- Slightly thicker stroke (×1.3)

Recalculate on collection by re-triggering the `collected` useEffect.

---

## Phase 3 — Walking Tension (Veiled Visions)

### 3.1 Veiled Vision event system
New file: `src/engine/veiledVisions.ts`

Pool of ~15 events, each: `{ id, text, devotioBonus, type: 'devotio' | 'hint' | 'rome_whisper' }`

Examples:
- `"Soft candlelight flickers at the next crossing… +6 Devotio"` (type: devotio)
- `"A pilgrim ahead drops a scrap of parchment: *'…et in Roma…'*"` (type: rome_whisper)
- `"The stones here are ancient. You feel a weight of centuries."` (type: hint)

Function `rollVision(): VeiledVision | null` — 15% chance, seeded by current timestamp mod to avoid repetition.

### 3.2 Integration in Map.tsx procession loop
In the `setInterval` inside the procession animation effect:

Every 40–80 steps (randomized), call `rollVision()`. If non-null, dispatch a small toast overlay.

New state: `activeVision: VeiledVision | null` in store (ephemeral). Auto-clears after 3 seconds.

### 3.3 Vision toast component
New file: `src/components/VisionToast.tsx`

Small floating card, bottom of map, fades in/out. Gold for devotio events, purple for rome_whisper, parchment for hints. Auto-dismiss after 3s.

---

## Phase 4 — Map Guidance Improvements

### 4.1 Tutorial ring dimming
File: `src/components/Map.tsx`

During `tutorialStep < 5`:
- The tutorial target ring renders at full opacity + adds a slow gold pulse CSS animation class
- All other uncollected rings render at 40% opacity
- Use `tutorialStep` from store in the marker-building loop

### 4.2 Scent trail (proximity glow)
File: `src/components/Map.tsx`

In the `zoomend` and `collected` useEffects, also check pilgrim position. Any uncollected relic within 250m of `pilgrimLat/Lng`:
- Add a faint outer pulsing ring (second SVG circle at r+8, animated via CSS `@keyframes`)
- Show a tiny "*Prope est…*" label (L.Tooltip with permanent: true, className: 'prope-label')

Update on `zoomend` and whenever `pilgrimLat/Lng` changes in store.

### 4.3 Feast urgency ring pulse
File: `src/components/Map.tsx`

If `getActiveFeastToday()` is non-null, relics matching `feast.relatedProvenanceSubs` get a gold pulse animation on their ring. Add CSS class `ring-feast-pulse` to their DivIcon HTML.

### 4.4 Quest Board "Walk to next objective" button
File: `src/components/QuestBoard.tsx`

Each quest card: add button `"→ Walk to closest objective"`.
Logic: find `quest.targetRelicIds` that are not yet collected, compute distance from `pilgrimLat/Lng` to each, pick nearest, call `beginProcession(nearestId)` + navigate to Map screen.

Pass `onNavigateToMap` callback from App.tsx.

---

## Phase 5 — Theological Quiz (arrival bonus)

### 5.1 Quiz data
New file: `src/data/relicQuizzes.ts`

One quiz per relic with: `relicId`, `question`, `answers: string[]`, `correctIndex: number`, `bonusEssence: number`.

Focus on dignity, veneration type, and historical facts. ~12 quizzes for Milan relics (others get no quiz).

### 5.2 Quiz component
New file: `src/components/TheologicalQuiz.tsx`

Shown as step 6 of the ArrivalCeremony sequence (between full RevealCard and "Place in Chapel" button).
- 10-second countdown timer
- 3 answer buttons
- Correct → `+50% bonusEssence` + "*Bene respondisti!*" flash
- Wrong/skip → normal reward, no penalty, short encouraging Latin phrase

---

## Phase 6 — Rome Unlock Sequence

### 6.1 Trigger
File: `src/store/useGameStore.ts` — inside `collect()`

After collection, check `if (next.length === MILAN_RELICS.length)` → set `romeUnlocked: boolean = true` in store (persisted).

### 6.2 Roma Vocat cinematic
New file: `src/components/RomaVocat.tsx`

Full-screen overlay triggered once when `romeUnlocked` transitions from false to true.
- Black background fades in
- Latin text animates: "*Omnia completa sunt. Roma Vocat.*"
- Web Audio API: choir-like tone sequence
- After 5 seconds → dismiss, Rome silhouettes in Codex become interactive

### 6.3 Rome map (future)
Not in scope for this sprint. Rome relics already exist in data. When unlocked, Codex silhouettes become clickable (full CodexEntry view). Map city switch (`'milano'` | `'rome'`) to be designed separately.

---

## File Inventory

| File | Action | Phase |
|---|---|---|
| `src/store/useGameStore.ts` | Add tutorialStep, teaserRelicId, ceremonyRelicId, romeUnlocked, activeVision | 1 |
| `src/data/tutorialQuests.ts` | New — from 5quests.txt + TypeScript types | 1 |
| `src/components/RelicTeaserOverlay.tsx` | New — teaser on uncollected ring tap | 1 |
| `src/App.tsx` | Split onRelicClick into teaser vs full card | 1 |
| `src/components/ArrivalCeremony.tsx` | New — 3-sec cinematic sequence | 2 |
| `src/components/Map.tsx` | Collected ring fill, tutorial dimming, scent trail, feast pulse | 2, 4 |
| `src/engine/veiledVisions.ts` | New — vision pool + roll function | 3 |
| `src/components/VisionToast.tsx` | New — floating procession event popup | 3 |
| `src/components/QuestBoard.tsx` | Add "Walk to objective" button | 4 |
| `src/data/relicQuizzes.ts` | New — quiz data for Milan relics | 5 |
| `src/components/TheologicalQuiz.tsx` | New — in-ceremony quiz | 5 |
| `src/components/RomaVocat.tsx` | New — Rome unlock cinematic | 6 |
| `src/App.css` | Ceremony animations, vision toast, feast pulse, scent glow | all |

---

## Implementation Order & Dependencies

```
Phase 1 (1.1 → 1.2 → 1.3 → 1.4 → 1.5)   ← must be fully done first
    ↓
Phase 2 (ceremony) ← depends on Phase 1 store changes
Phase 3 (visions)  ← independent, can ship in parallel with Phase 2
Phase 4 (map UX)   ← independent, can ship in parallel with Phase 2
    ↓
Phase 5 (quiz)     ← depends on Phase 2 ArrivalCeremony being complete
Phase 6 (Rome)     ← depends on Phase 1 store + can be done any time after
```

---

## Decisions (resolved)

1. **Tutorial quest 4 (In Festum Crucis)**: if no feast is active, auto-skip to step 5. No fallback quest.
2. **Arrival ceremony depth**: full three-axis reveal only for `rarity === 'Primaria'` or `rarity === 'Legendary'`. Common/Uncommon/Rare relics get a shorter ceremony (particle burst + card, no three-axis animation).
3. **Quiz**: skippable with a "*In nomine…* skip" link. No penalty for skipping.
4. **RelicCard on collected relic tap**: show teaser-first even for already-collected relics. Teaser has a "You have venerated this relic ✦" state + "View full record" link that opens the full card.
5. **Scent trail**: always use avatar `pilgrimLat/Lng` from store. GPS ignored (real GPS usage is <0.01%).
