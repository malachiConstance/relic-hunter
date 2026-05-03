import { RELICS } from './relics'
import type { RelicCategory, TheologicalDignity } from './relics'
import type { LiturgicalFeast } from './liturgicalCalendar'

export interface TutorialReward {
  holyEssence: number
  title: string
  miracleBuff?: { name: string; latinName: string; duration: number; effect: string } | null
}

export interface TutorialQuest {
  id: string
  step: number
  name: string
  description: string
  objective: string
  reward: TutorialReward
  hint?: string
  // progress criteria (one of these is set)
  targetRelicIds?: string[]
  targetCategory?: RelicCategory
  targetCategories?: RelicCategory[]
  targetProvenance?: string
  requiredDignityTypes?: TheologicalDignity[]
  requiredCollectionCount?: number
  requiresActiveFeast?: boolean
}

export function checkTutorialProgress(
  quest: TutorialQuest,
  collected: string[],
  activeFeast: LiturgicalFeast | null,
): boolean {
  const collectedRelics = collected.map(id => RELICS.find(r => r.id === id)).filter(Boolean) as typeof RELICS

  if (quest.targetRelicIds) {
    if (!quest.targetRelicIds.some(id => collected.includes(id))) return false
  }

  if (quest.targetCategory) {
    const match = collectedRelics.filter(r => r.category === quest.targetCategory)
    if (quest.targetProvenance) {
      if (!match.some(r => r.provenance_sub === quest.targetProvenance || r.provenance_class === quest.targetProvenance)) return false
    } else {
      if (match.length === 0) return false
    }
  }

  if (quest.targetCategories && quest.targetCategories.length > 0) {
    const hasCategory = collectedRelics.some(r => quest.targetCategories!.includes(r.category))
    if (!hasCategory) return false
    if (quest.requiresActiveFeast && !activeFeast) return false
  }

  if (quest.requiredDignityTypes && quest.requiredDignityTypes.length > 0) {
    const provenanceRelics = quest.targetProvenance
      ? collectedRelics.filter(r => r.provenance_sub === quest.targetProvenance || r.provenance_class === quest.targetProvenance)
      : collectedRelics
    for (const dignity of quest.requiredDignityTypes) {
      if (!provenanceRelics.some(r => r.theological_dignity === dignity)) return false
    }
  }

  if (quest.requiredCollectionCount) {
    if (collected.length < quest.requiredCollectionCount) return false
  }

  return true
}

export const TUTORIAL_QUESTS: TutorialQuest[] = [
  {
    id: 'tutorial_1_initium',
    step: 1,
    name: 'Initium Peregrinationis',
    description: "Salve, peregrine. Begin your sacred journey at the Duomo. The *Santo Chiodo* calls you.",
    objective: 'Reach the NAIL relic at the Duomo and complete the first procession.',
    targetRelicIds: ['santo-chiodo'],
    reward: { holyEssence: 150, title: 'Peregrinus Primus' },
    hint: 'The dark red ring at the Duomo glows brighter than the others…',
  },
  {
    id: 'tutorial_2_prima_collectio',
    step: 2,
    name: 'Prima Collectio',
    description: "Now seek a BONE relic of the holy bishop Ambrose at the Basilica of Sant'Ambrogio.",
    objective: 'Collect one BONE relic of Ambrosian provenance.',
    targetCategory: 'BONE',
    targetProvenance: 'Ambrosian',
    reward: {
      holyEssence: 180,
      title: 'Collector Primus',
      miracleBuff: { name: 'Benedictio Ambrosiana', latinName: 'Benedictio Ambrosiana', duration: 3600, effect: '+15% on Patristic relics' },
    },
  },
  {
    id: 'tutorial_3_dignitas',
    step: 3,
    name: 'Dignitas Theologica',
    description: "Reassemble the first pieces of St. Ambrose. Learn the ranks of *Dignitas Theologica*.",
    objective: 'Collect one Primaria relic and one Secundaria relic of Ambrosian provenance.',
    targetProvenance: 'Ambrosian',
    requiredDignityTypes: ['Primaria', 'Secundaria'],
    reward: { holyEssence: 220, title: 'Custos Dignitatis' },
    hint: 'Look for relics of different ranks among the Ambrosian saints.',
  },
  {
    id: 'tutorial_4_festum',
    step: 4,
    name: 'In Festum Crucis',
    description: "The *Instrumenta Passionis* shine brighter during a sacred feast. Seize the moment.",
    objective: 'Collect any INSTRUMENT or WOOD relic while a liturgical feast is active.',
    targetCategories: ['INSTRUMENT', 'WOOD'],
    requiresActiveFeast: true,
    reward: {
      holyEssence: 280,
      title: 'Particeps Festi',
      miracleBuff: { name: 'Virtus Crucis', latinName: 'Virtus Ligni Crucis', duration: 7200, effect: '×1.5 on Passion relics today' },
    },
  },
  {
    id: 'tutorial_5_capella',
    step: 5,
    name: 'Capella Tua Prima',
    description: "Return to your private chapel and venerate what you have gathered.",
    objective: 'Open the Chapel with at least 3 relics collected.',
    requiredCollectionCount: 3,
    reward: { holyEssence: 200, title: 'Aedificator Capellae' },
    hint: 'After collecting, tap the Chapel tab (⛪) and watch the relics settle into the wall.',
  },
]
