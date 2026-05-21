import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { RELICS, MILAN_RELICS, type RelicCategory } from '../data/relics'
import { GOALS } from '../data/goals'
import { generateQuests, updateQuestProgress, type Quest, type MiracleBuff } from '../engine/QuestGenerator'
import { TUTORIAL_QUESTS, checkTutorialProgress } from '../data/tutorialQuests'
import { getActiveFeastToday } from '../data/liturgicalCalendar'
import type { VeiledVision } from '../engine/veiledVisions'
import { getRestPlace, getEncounter, ROBBERY_EVENTS, type Encounter, type RobberyEvent } from '../data/restPlaces'

interface ActiveBuff {
  buff: MiracleBuff
  expiresAt: number
}

// Fervor cost for a procession based on relic points
export function procesionFervorCost(relicPoints: number): number {
  if (relicPoints > 800) return 75
  if (relicPoints > 400) return 60
  if (relicPoints > 150) return 40
  return 20
}

export const MAX_FERVOR = 100
export const ACTIVE_LEADS_MAX = 8
export const MIN_FERVOR_AFTER_ROBBERY = 8

interface GameState {
  // Collection
  collected: string[]
  completedGoals: string[]
  categoriesCollected: RelicCategory[]

  // Economy
  holyEssence: number
  earnedTitles: string[]
  earnedTitleLatins: string[]

  // Quests
  activeQuests: Quest[]
  completedQuestIds: string[]
  lastQuestRefresh: number

  // Buffs
  activeBuffs: ActiveBuff[]

  // Pilgrim
  pilgrimLat: number
  pilgrimLng: number
  devotioPoints: number
  processingRelicId: string | null   // ephemeral — NOT persisted
  teaserRelicId: string | null       // ephemeral — NOT persisted
  ceremonyRelicId: string | null     // ephemeral — NOT persisted
  activeVision: VeiledVision | null  // ephemeral — NOT persisted
  // Walking mode: pilgrim walks to a coordinate without procession ceremony
  walkingToCoord: [number, number] | null   // ephemeral — NOT persisted
  walkingDestPlaceId: string | null         // ephemeral — if walking to a rest place

  // Tutorial & unlock (persisted)
  tutorialStep: number               // 0=uninit, 1–5=active, 6=done
  romeUnlocked: boolean

  // Quiz cooldowns (persisted): relicId → timestamp when cooldown expires
  quizCooldowns: Record<string, number>

  // Last variant index used per POI pair (LRU rotation for route variety, persisted)
  lastVariantByPair: Record<string, number>

  // History of polylines the pilgrim has walked, oldest first. Capped — see WALKED_PATHS_MAX.
  walkedPaths: [number, number][][]

  // H3 cell IDs (resolution FOG_RES) the pilgrim has revealed. Sorted, deduped.
  exploredCells: string[]

  // ── Fervor Spiritalis — spiritual energy ──────────────────────────────────
  // Spent by processions (based on relic prominence) and city walking.
  // Recovered by resting at churches, klosters, and taverns.
  fervor: number

  // ── Discovery system ──────────────────────────────────────────────────────
  // Rest places the player has learned about (shown on map)
  knownPlaceIds: string[]
  // Rest places the player has actually entered at least once
  visitedPlaceIds: string[]
  // Relics the player has heard about via encounters (shown on map)
  knownRelicIds: string[]
  // False-lead place IDs that have been visited (robbery/empty resolved)
  resolvedFalseLeads: string[]
  // Last encounter fired per place (so we don't repeat the same one immediately)
  lastEncounterByPlace: Record<string, string>
  // Pending encounter result (ephemeral — set during rest, cleared when dismissed)
  pendingEncounter: Encounter | null
  pendingEncounterRevealApplied: boolean
  // Pending robbery event (set alongside pendingEncounter for robbery outcomes)
  pendingRobbery: RobberyEvent | null

  // Actions
  collect: (id: string) => void
  uncollect: (id: string) => void
  isCollected: (id: string) => boolean
  refreshQuests: () => void
  claimCompletedQuest: (questId: string) => void
  spendEssence: (amount: number) => boolean
  clearExpiredBuffs: () => void
  beginProcession: (relicId: string) => void
  completeProcession: () => void
  addDevotio: (n: number) => void
  setTeaserRelic: (id: string | null) => void
  showVision: (vision: VeiledVision) => void
  advanceTutorial: () => void
  beginCeremony: (relicId: string) => void
  completeCeremony: () => void
  cancelCeremony: () => void
  failQuiz: (relicId: string) => void
  getQuizCooldownMs: (relicId: string) => number
  pickAndAdvanceVariant: (pairKey: string, count: number) => number
  recordWalkedPath: (waypoints: [number, number][]) => void
  revealCells: (cellIds: string[]) => void
  resetFog: () => void
  resetGame: () => void
  // Fervor
  gainFervor: (amount: number) => void
  drainFervor: (amount: number) => void
  canAffordProcession: (relicId: string) => boolean
  // Discovery
  revealPlace: (placeId: string) => void
  revealRelic: (relicId: string) => void
  enterPlace: (placeId: string) => void  // rest/drink action — fires encounter
  dismissEncounter: () => void
  activeLeadCount: () => number
  // Walking (movement without procession ceremony)
  beginWalk: (coord: [number, number], destPlaceId?: string) => void
  completeWalk: () => void
  walkingFervorCost: (fromCoord: [number, number], toCoord: [number, number]) => number
}

const WALKED_PATHS_MAX = 200

const QUEST_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000

function deriveCategoriesCollected(collectedIds: string[]): RelicCategory[] {
  return collectedIds
    .map(id => RELICS.find(r => r.id === id)?.category)
    .filter(Boolean) as RelicCategory[]
}

function deriveCompletedGoals(collectedIds: string[]): string[] {
  const cats = deriveCategoriesCollected(collectedIds)
  const milanIds = MILAN_RELICS.map(r => r.id)
  return GOALS.filter(g => g.check(collectedIds, milanIds, cats)).map(g => g.id)
}

const INITIAL_KNOWN_PLACE_IDS = ['castello-sforzesco']
const INITIAL_KNOWN_RELIC_IDS = ['santo-chiodo']

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      collected: [],
      completedGoals: [],
      categoriesCollected: [],
      holyEssence: 0,
      earnedTitles: [],
      earnedTitleLatins: [],
      activeQuests: [],
      completedQuestIds: [],
      lastQuestRefresh: 0,
      activeBuffs: [],
      pilgrimLat: 45.47028,
      pilgrimLng: 9.17944,
      devotioPoints: 0,
      processingRelicId: null,
      teaserRelicId: null,
      ceremonyRelicId: null,
      activeVision: null,
      tutorialStep: 0,
      romeUnlocked: false,
      quizCooldowns: {},
      lastVariantByPair: {},
      walkedPaths: [],
      exploredCells: [],
      fervor: 20,
      knownPlaceIds: INITIAL_KNOWN_PLACE_IDS,
      visitedPlaceIds: [],
      knownRelicIds: INITIAL_KNOWN_RELIC_IDS,
      resolvedFalseLeads: [],
      lastEncounterByPlace: {},
      pendingEncounter: null,
      pendingEncounterRevealApplied: false,
      pendingRobbery: null,
      walkingToCoord: null,
      walkingDestPlaceId: null,

      collect(id: string) {
        const { collected, activeQuests, lastQuestRefresh } = get()
        if (collected.includes(id)) return
        const relic = RELICS.find(r => r.id === id)
        if (!relic) return

        const next = [...collected, id]
        const cats = deriveCategoriesCollected(next)
        const completedGoals = deriveCompletedGoals(next)

        const needsRefresh =
          activeQuests.length === 0 ||
          Date.now() - lastQuestRefresh > QUEST_REFRESH_INTERVAL_MS

        const updatedQuests = needsRefresh
          ? generateQuests(next, 3)
          : activeQuests.map(q => updateQuestProgress(q, next))

        set(state => ({
          collected: next,
          categoriesCollected: cats,
          completedGoals,
          holyEssence: state.holyEssence + relic.points,
          activeQuests: updatedQuests,
          lastQuestRefresh: needsRefresh ? Date.now() : state.lastQuestRefresh,
        }))

        // Quests are claimed manually by the player via the Quest Board

        // Tutorial progress (steps 1–4; step 5 is Chapel-only)
        const { tutorialStep } = get()
        if (tutorialStep >= 1 && tutorialStep <= 4) {
          const tq = TUTORIAL_QUESTS[tutorialStep - 1]
          if (tq && checkTutorialProgress(tq, get().collected, getActiveFeastToday())) {
            get().advanceTutorial()
          }
        }

        // Rome unlock
        if (!get().romeUnlocked && get().collected.length >= MILAN_RELICS.length) {
          set({ romeUnlocked: true })
        }
      },

      uncollect(id: string) {
        const { collected, activeQuests } = get()
        const relic = RELICS.find(r => r.id === id)
        const next = collected.filter(i => i !== id)
        const cats = deriveCategoriesCollected(next)
        const completedGoals = deriveCompletedGoals(next)
        const updatedQuests = activeQuests.map(q => updateQuestProgress(q, next))

        set(state => ({
          collected: next,
          categoriesCollected: cats,
          completedGoals,
          holyEssence: Math.max(0, state.holyEssence - (relic?.points ?? 0)),
          activeQuests: updatedQuests,
        }))
      },

      isCollected(id: string) {
        return get().collected.includes(id)
      },

      refreshQuests() {
        const { collected } = get()
        const quests = generateQuests(collected, 3)
        set({ activeQuests: quests, lastQuestRefresh: Date.now() })
      },

      claimCompletedQuest(questId: string) {
        const { activeQuests, completedQuestIds, earnedTitleLatins, activeBuffs } = get()
        const quest = activeQuests.find(q => q.id === questId)
        if (!quest || !quest.isCompleted || completedQuestIds.includes(questId)) return

        const newBuff: ActiveBuff | null = quest.rewards.buff
          ? { buff: quest.rewards.buff, expiresAt: Date.now() + quest.rewards.buff.durationHours * 3600 * 1000 }
          : null

        const newTitles = quest.rewards.titleLatin && !earnedTitleLatins.includes(quest.rewards.titleLatin)
          ? [...earnedTitleLatins, quest.rewards.titleLatin]
          : earnedTitleLatins

        set(state => ({
          holyEssence: state.holyEssence + quest.rewards.holyEssence,
          completedQuestIds: [...completedQuestIds, questId],
          earnedTitles: quest.rewards.title && !state.earnedTitles.includes(quest.rewards.title)
            ? [...state.earnedTitles, quest.rewards.title]
            : state.earnedTitles,
          earnedTitleLatins: newTitles,
          activeBuffs: newBuff
            ? [...activeBuffs.filter(b => Date.now() < b.expiresAt), newBuff]
            : activeBuffs,
        }))
      },

      spendEssence(amount: number) {
        const { holyEssence } = get()
        if (holyEssence < amount) return false
        set(state => ({ holyEssence: state.holyEssence - amount }))
        return true
      },

      clearExpiredBuffs() {
        const now = Date.now()
        set(state => ({ activeBuffs: state.activeBuffs.filter(b => b.expiresAt > now) }))
      },

      beginProcession(relicId: string) {
        const { processingRelicId, collected } = get()
        if (processingRelicId !== null) return
        if (collected.includes(relicId)) return
        const relic = RELICS.find(r => r.id === relicId)
        if (relic) {
          const cost = procesionFervorCost(relic.points)
          if (get().fervor < cost) return  // not enough Fervor
          get().drainFervor(cost)
        }
        set({ processingRelicId: relicId })
      },

      completeProcession() {
        const { processingRelicId } = get()
        if (!processingRelicId) return
        const relic = RELICS.find(r => r.id === processingRelicId)
        set(state => ({
          pilgrimLat: relic?.lat ?? state.pilgrimLat,
          pilgrimLng: relic?.lng ?? state.pilgrimLng,
          processingRelicId: null,
          devotioPoints: state.devotioPoints + 10,
        }))
        get().beginCeremony(processingRelicId)
      },

      addDevotio(n: number) {
        set(state => ({ devotioPoints: state.devotioPoints + n }))
      },

      setTeaserRelic(id: string | null) {
        set({ teaserRelicId: id })
      },

      showVision(vision: VeiledVision) {
        set({ activeVision: vision })
        if (vision.devotioBonus > 0) get().addDevotio(vision.devotioBonus)
        setTimeout(() => set({ activeVision: null }), 3500)
      },

      advanceTutorial() {
        const { tutorialStep } = get()
        if (tutorialStep >= 6) return

        let nextStep = tutorialStep + 1

        // Auto-skip step 4 if no feast is active
        if (nextStep === 4 && !getActiveFeastToday()) {
          nextStep = 5
        }

        const tq = TUTORIAL_QUESTS.find(q => q.step === tutorialStep)
        if (tq) {
          const reward = tq.reward
          set(state => ({
            tutorialStep: nextStep,
            holyEssence: state.holyEssence + reward.holyEssence,
            earnedTitles: reward.title && !state.earnedTitles.includes(reward.title)
              ? [...state.earnedTitles, reward.title]
              : state.earnedTitles,
          }))
        } else {
          set({ tutorialStep: nextStep })
        }
      },

      beginCeremony(relicId: string) {
        set({ ceremonyRelicId: relicId })
      },

      completeCeremony() {
        const { ceremonyRelicId } = get()
        if (!ceremonyRelicId) return
        set({ ceremonyRelicId: null })
        get().collect(ceremonyRelicId)
      },

      cancelCeremony() {
        set({ ceremonyRelicId: null })
      },

      failQuiz(relicId: string) {
        const expiresAt = Date.now() + 10 * 1000
        set(state => ({
          ceremonyRelicId: null,
          quizCooldowns: { ...state.quizCooldowns, [relicId]: expiresAt },
        }))
      },

      getQuizCooldownMs(relicId: string) {
        const expiresAt = get().quizCooldowns[relicId] ?? 0
        return Math.max(0, expiresAt - Date.now())
      },

      recordWalkedPath(waypoints: [number, number][]) {
        if (waypoints.length < 2) return
        set(state => {
          const next = [...state.walkedPaths, waypoints]
          if (next.length > WALKED_PATHS_MAX) next.splice(0, next.length - WALKED_PATHS_MAX)
          return { walkedPaths: next }
        })
      },

      revealCells(cellIds: string[]) {
        if (cellIds.length === 0) return
        set(state => {
          const seen = new Set(state.exploredCells)
          let added = false
          for (const id of cellIds) {
            if (!seen.has(id)) { seen.add(id); added = true }
          }
          if (!added) return {}
          return { exploredCells: [...seen].sort() }
        })
      },

      resetFog() { set({ exploredCells: [] }) },

      gainFervor(amount: number) {
        set(state => ({ fervor: Math.min(MAX_FERVOR, state.fervor + amount) }))
      },

      drainFervor(amount: number) {
        set(state => ({ fervor: Math.max(0, state.fervor - amount) }))
      },

      canAffordProcession(relicId: string) {
        const relic = RELICS.find(r => r.id === relicId)
        if (!relic) return false
        const cost = procesionFervorCost(relic.points)
        return get().fervor >= cost
      },

      revealPlace(placeId: string) {
        const { knownPlaceIds } = get()
        if (knownPlaceIds.includes(placeId)) return
        set(state => ({ knownPlaceIds: [...state.knownPlaceIds, placeId] }))
      },

      revealRelic(relicId: string) {
        const { knownRelicIds } = get()
        if (knownRelicIds.includes(relicId)) return
        set(state => ({ knownRelicIds: [...state.knownRelicIds, relicId] }))
      },

      enterPlace(placeId: string) {
        const place = getRestPlace(placeId)
        if (!place) return

        const robbery = ROBBERY_EVENTS[Math.floor(Math.random() * ROBBERY_EVENTS.length)]

        // False lead: 60% peaceful (fervor restored, neutral encounter), 40% robbery
        if (place.isFalseLead) {
          const resolvedFalseLeads = get().resolvedFalseLeads.includes(placeId)
            ? get().resolvedFalseLeads
            : [...get().resolvedFalseLeads, placeId]

          if (Math.random() < 0.6) {
            // Peaceful outcome — humble rest among ruins
            get().gainFervor(place.fervorRestore)
            const pool = place.encounterPool
            const encId = pool[Math.floor(Math.random() * pool.length)]
            const encounter = getEncounter(encId) ?? null
            set({
              resolvedFalseLeads,
              pendingEncounter: encounter,
              pendingEncounterRevealApplied: false,
              pendingRobbery: null,
            })
          } else {
            // Robbery outcome
            const essenceLoss = robbery.lossType !== 'fervor' ? (robbery.essenceLoss ?? 30) : 0
            set(state => ({
              fervor: MIN_FERVOR_AFTER_ROBBERY,
              holyEssence: robbery.lossType !== 'fervor' ? Math.max(0, state.holyEssence - essenceLoss) : state.holyEssence,
              resolvedFalseLeads,
              pendingRobbery: robbery,
              pendingEncounter: null,
            }))
          }
          return
        }

        // Mark as visited
        const { visitedPlaceIds, knownPlaceIds } = get()
        if (!visitedPlaceIds.includes(placeId)) {
          set(state => ({ visitedPlaceIds: [...state.visitedPlaceIds, placeId] }))
        }
        if (!knownPlaceIds.includes(placeId)) {
          set(state => ({ knownPlaceIds: [...state.knownPlaceIds, placeId] }))
        }

        // Random robbery at real places (taverns primarily)
        if (place.robberyChance && Math.random() < place.robberyChance) {
          const essenceLoss = robbery.lossType !== 'fervor' ? (robbery.essenceLoss ?? 30) : 0
          set(state => ({
            fervor: MIN_FERVOR_AFTER_ROBBERY,
            holyEssence: robbery.lossType !== 'fervor' ? Math.max(0, state.holyEssence - essenceLoss) : state.holyEssence,
            pendingRobbery: robbery,
            pendingEncounter: null,
          }))
          return
        }

        // Restore Fervor
        get().gainFervor(place.fervorRestore)

        // Roll an encounter if active leads < max
        const leadCount = get().activeLeadCount()
        if (place.encounterPool.length === 0) return

        // Pick an encounter different from the last one used here
        const { lastEncounterByPlace } = get()
        const lastId = lastEncounterByPlace[placeId]
        const candidates = place.encounterPool.filter(id => id !== lastId)
        const pool = candidates.length > 0 ? candidates : place.encounterPool
        const encounterId = pool[Math.floor(Math.random() * pool.length)]
        const encounter = getEncounter(encounterId)
        if (!encounter) return

        const revealApplied = !!(encounter.reveal && leadCount < ACTIVE_LEADS_MAX)

        set(state => ({
          lastEncounterByPlace: { ...state.lastEncounterByPlace, [placeId]: encounterId },
          pendingEncounter: encounter,
          pendingEncounterRevealApplied: revealApplied,
        }))

        if (revealApplied) {
          if (encounter.reveal!.relicId) {
            get().revealRelic(encounter.reveal!.relicId)
          }
          if (encounter.reveal!.placeId) {
            get().revealPlace(encounter.reveal!.placeId)
          }
        }
      },

      dismissEncounter() {
        set({ pendingEncounter: null, pendingEncounterRevealApplied: false, pendingRobbery: null })
      },

      activeLeadCount() {
        const { knownPlaceIds, visitedPlaceIds, knownRelicIds, collected, resolvedFalseLeads } = get()
        const unvisitedPlaces = knownPlaceIds.filter(
          id => id !== 'castello-sforzesco' && !visitedPlaceIds.includes(id) && !resolvedFalseLeads.includes(id)
        ).length
        const unknownRelics = knownRelicIds.filter(id => !collected.includes(id)).length
        return unvisitedPlaces + unknownRelics
      },

      walkingFervorCost(fromCoord: [number, number], toCoord: [number, number]) {
        const R = 6371000
        const dLat = (toCoord[0] - fromCoord[0]) * Math.PI / 180
        const dLng = (toCoord[1] - fromCoord[1]) * Math.PI / 180
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(fromCoord[0] * Math.PI / 180) * Math.cos(toCoord[0] * Math.PI / 180) * Math.sin(dLng / 2) ** 2
        const distM = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        // 1 Fervor per 150m, minimum 3, maximum 15
        return Math.min(15, Math.max(3, Math.round(distM / 150)))
      },

      beginWalk(coord: [number, number], destPlaceId?: string) {
        const { processingRelicId, walkingToCoord } = get()
        if (processingRelicId !== null || walkingToCoord !== null) return
        const cost = get().walkingFervorCost([get().pilgrimLat, get().pilgrimLng], coord)
        if (get().fervor < cost) return
        get().drainFervor(cost)
        set({ walkingToCoord: coord, walkingDestPlaceId: destPlaceId ?? null })
      },

      completeWalk() {
        const { walkingToCoord, walkingDestPlaceId } = get()
        if (!walkingToCoord) return
        set(state => ({
          pilgrimLat: walkingToCoord[0],
          pilgrimLng: walkingToCoord[1],
          walkingToCoord: null,
          walkingDestPlaceId: null,
          devotioPoints: state.devotioPoints + 3,
        }))
      },

      // LRU rotation: returns next variant index for this pair (0..count-1)
      // and persists it. Each visit to the same A→B picks a different polyline.
      pickAndAdvanceVariant(pairKey: string, count: number) {
        if (count <= 0) return 0
        const last = get().lastVariantByPair[pairKey]
        const next = last === undefined ? 0 : (last + 1) % count
        set(state => ({
          lastVariantByPair: { ...state.lastVariantByPair, [pairKey]: next },
        }))
        return next
      },

      resetGame() {
        set({
          collected: [],
          completedGoals: [],
          categoriesCollected: [],
          holyEssence: 0,
          earnedTitles: [],
          earnedTitleLatins: [],
          activeQuests: [],
          completedQuestIds: [],
          lastQuestRefresh: 0,
          activeBuffs: [],
          pilgrimLat: 45.47028,
          pilgrimLng: 9.17944,
          devotioPoints: 0,
          tutorialStep: 1,
          romeUnlocked: false,
          quizCooldowns: {},
          lastVariantByPair: {},
          walkedPaths: [],
          exploredCells: [],
          processingRelicId: null,
          teaserRelicId: null,
          ceremonyRelicId: null,
          activeVision: null,
          fervor: 20,
          knownPlaceIds: INITIAL_KNOWN_PLACE_IDS,
          visitedPlaceIds: [],
          knownRelicIds: INITIAL_KNOWN_RELIC_IDS,
          resolvedFalseLeads: [],
          lastEncounterByPlace: {},
          pendingEncounter: null,
          pendingEncounterRevealApplied: false,
          pendingRobbery: null,
          walkingToCoord: null,
          walkingDestPlaceId: null,
        })
      },
    }),
    {
      name: 'relic-hunter-game-v3',
      // processingRelicId, teaserRelicId, ceremonyRelicId are ephemeral — never persist
      partialize: (state: GameState) => ({
        collected: state.collected,
        completedGoals: state.completedGoals,
        categoriesCollected: state.categoriesCollected,
        holyEssence: state.holyEssence,
        earnedTitles: state.earnedTitles,
        earnedTitleLatins: state.earnedTitleLatins,
        activeQuests: state.activeQuests,
        completedQuestIds: state.completedQuestIds,
        lastQuestRefresh: state.lastQuestRefresh,
        activeBuffs: state.activeBuffs,
        pilgrimLat: state.pilgrimLat,
        pilgrimLng: state.pilgrimLng,
        devotioPoints: state.devotioPoints,
        tutorialStep: state.tutorialStep,
        romeUnlocked: state.romeUnlocked,
        quizCooldowns: state.quizCooldowns,
        lastVariantByPair: state.lastVariantByPair,
        walkedPaths: state.walkedPaths,
        exploredCells: state.exploredCells,
        fervor: state.fervor,
        knownPlaceIds: state.knownPlaceIds,
        visitedPlaceIds: state.visitedPlaceIds,
        knownRelicIds: state.knownRelicIds,
        resolvedFalseLeads: state.resolvedFalseLeads,
        lastEncounterByPlace: state.lastEncounterByPlace,
      }),
    },
  ),
)
