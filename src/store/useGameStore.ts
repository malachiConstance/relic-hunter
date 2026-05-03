import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { RELICS, MILAN_RELICS, type RelicCategory } from '../data/relics'
import { GOALS } from '../data/goals'
import { generateQuests, updateQuestProgress, type Quest, type MiracleBuff } from '../engine/QuestGenerator'
import { TUTORIAL_QUESTS, checkTutorialProgress } from '../data/tutorialQuests'
import { getActiveFeastToday } from '../data/liturgicalCalendar'
import type { VeiledVision } from '../engine/veiledVisions'

interface ActiveBuff {
  buff: MiracleBuff
  expiresAt: number
}

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

  // Tutorial & unlock (persisted)
  tutorialStep: number               // 0=uninit, 1–5=active, 6=done
  romeUnlocked: boolean

  // Quiz cooldowns (persisted): relicId → timestamp when cooldown expires
  quizCooldowns: Record<string, number>

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
  failQuiz: (relicId: string) => void
  getQuizCooldownMs: (relicId: string) => number
  resetGame: () => void
}

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
      pilgrimLat: 45.4641,
      pilgrimLng: 9.1919,
      devotioPoints: 0,
      processingRelicId: null,
      teaserRelicId: null,
      ceremonyRelicId: null,
      activeVision: null,
      tutorialStep: 0,
      romeUnlocked: false,
      quizCooldowns: {},

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
          pilgrimLat: 45.4641,
          pilgrimLng: 9.1919,
          devotioPoints: 0,
          tutorialStep: 1,
          romeUnlocked: false,
          quizCooldowns: {},
          processingRelicId: null,
          teaserRelicId: null,
          ceremonyRelicId: null,
          activeVision: null,
        })
      },
    }),
    {
      name: 'relic-hunter-game-v2',
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
      }),
    },
  ),
)
