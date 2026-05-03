import { RELICS, type Relic } from '../data/relics'
import { getActiveFeastToday, type LiturgicalFeast } from '../data/liturgicalCalendar'

export type QuestType =
  | 'CATEGORY_SWEEP'
  | 'SAINT_REASSEMBLY'
  | 'THEOLOGICAL_SET'
  | 'INSTRUMENTA_PASSIONIS'
  | 'LOCAL_PATRON'

export interface MiracleBuff {
  id: string
  name: string
  latinName: string
  effect: string
  durationHours: number
}

export interface Quest {
  id: string
  type: QuestType
  name: string
  latinName: string
  description: string
  objective: string
  targetRelicIds: string[]
  requiredCount: number
  currentCount: number
  progressPercent: number
  rewards: {
    holyEssence: number
    title: string
    titleLatin: string
    buff?: MiracleBuff
  }
  liturgicalBonus: number
  activeFeastName?: string
  isCompleted: boolean
  hasIncorruptio: boolean
}

const MIRACLE_BUFFS: MiracleBuff[] = [
  {
    id: 'benedictio-ambrosiana',
    name: 'Benedictio Ambrosiana',
    latinName: 'Benedictio Ambrosiana',
    effect: '+25% XP on all Patristic relics',
    durationHours: 24,
  },
  {
    id: 'virtus-ligni',
    name: 'Virtue of the Living Wood',
    latinName: 'Virtus Ligni Crucis',
    effect: 'Double discovery rate for Lignum relics',
    durationHours: 24,
  },
  {
    id: 'intercessio-petri',
    name: "Peter's Intercession",
    latinName: 'Intercessio Petri Apostoli',
    effect: '+1 extra relic clue per hunt',
    durationHours: 48,
  },
  {
    id: 'gratia-romana',
    name: 'Roman Grace',
    latinName: 'Gratia Romana Aeterna',
    effect: '+20% points on all Rome relics',
    durationHours: 24,
  },
  {
    id: 'incorruptio-sancti',
    name: 'Miracle of Incorruption',
    latinName: 'Incorruptio Sancti – Signum Gloriae',
    effect: '+50% Primaria drop rate',
    durationHours: 48,
  },
  {
    id: 'lux-mundi',
    name: 'Light of the World',
    latinName: 'Lux Mundi – Claritas Divina',
    effect: 'Reveal 2 hidden relic locations on map',
    durationHours: 12,
  },
]

function seededPick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length]
}

function hashStr(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i)
  return Math.abs(h >>> 0)
}

function calcFeastBonus(feat: LiturgicalFeast | null): number {
  return feat ? feat.pointsMultiplier : 1
}

// ─── CATEGORY SWEEP ──────────────────────────────────────────────────────────

function buildCategorySweepQuests(
  collected: Set<string>,
  relics: Relic[],
  feat: LiturgicalFeast | null,
): Quest[] {
  const combos = new Map<string, Relic[]>()
  for (const r of relics) {
    const key = `${r.material_class}|${r.provenance_class}`
    const list = combos.get(key) ?? []
    list.push(r)
    combos.set(key, list)
  }

  const LATIN_MATERIAL: Record<string, string> = {
    Osseous: 'Ossearum',
    Lignum: 'Ligni',
    Metallic: 'Metallicarum',
    Textile: 'Textilearum',
    'Other Artifact': 'Artificialium',
    'Soft Tissue': 'Tissuae Sacrae',
  }

  const quests: Quest[] = []
  for (const [key, targets] of combos) {
    if (targets.length < 2) continue
    const [mat, prov] = key.split('|')
    const ids = targets.map(r => r.id)
    const current = ids.filter(id => collected.has(id)).length
    const pct = Math.floor((current / targets.length) * 100)
    if (pct >= 100) continue

    const hash = hashStr(key)
    const feastBonus = calcFeastBonus(feat)
    const latMat = LATIN_MATERIAL[mat] ?? mat
    const latinName = `Collectio Omnium Reliquiarum ${latMat} – Origo ${prov}`

    quests.push({
      id: `quest_sweep_${hash}`,
      type: 'CATEGORY_SWEEP',
      name: `All ${mat} relics of ${prov} origin`,
      latinName,
      description: `Gather every *Reliquia* of *Forma Materialis* ${mat} from the *Origo Sancta* ${prov}. Per decretum Patrum — *"communio sanctorum per pignora sancta."*`,
      objective: `Collect ALL relics: Material = ${mat}, Provenance = ${prov}`,
      targetRelicIds: ids,
      requiredCount: targets.length,
      currentCount: current,
      progressPercent: pct,
      rewards: {
        holyEssence: Math.floor(targets.reduce((s, r) => s + r.points, 0) * 0.6 * feastBonus),
        title: `${prov} ${mat} Collector`,
        titleLatin: `Collectoris ${latMat}`,
        buff: seededPick(MIRACLE_BUFFS, hash),
      },
      liturgicalBonus: feastBonus,
      activeFeastName: feat?.latinName,
      isCompleted: false,
      hasIncorruptio: targets.some(r => r.incorruptio),
    })
  }
  return quests
}

// ─── SAINT REASSEMBLY ────────────────────────────────────────────────────────

function buildSaintReassemblyQuests(
  collected: Set<string>,
  relics: Relic[],
  feat: LiturgicalFeast | null,
): Quest[] {
  const byProvSub = new Map<string, Relic[]>()
  for (const r of relics) {
    if (!r.body_part_group) continue
    const list = byProvSub.get(r.provenance_sub) ?? []
    list.push(r)
    byProvSub.set(r.provenance_sub, list)
  }

  const quests: Quest[] = []
  for (const [provSub, bodyRelics] of byProvSub) {
    const groups = [...new Set(bodyRelics.map(r => r.body_part_group!))]
    if (groups.length < 2) continue

    const ids = bodyRelics.map(r => r.id)
    const groupsDone = groups.filter(g =>
      bodyRelics.filter(r => r.body_part_group === g).some(r => collected.has(r.id))
    )
    const pct = Math.floor((groupsDone.length / groups.length) * 100)
    if (pct >= 100) continue

    const hash = hashStr(provSub)
    const feastBonus = calcFeastBonus(feat)
    const hasIncorruptio = bodyRelics.some(r => r.incorruptio)

    quests.push({
      id: `quest_reassembly_${hash}`,
      type: 'SAINT_REASSEMBLY',
      name: `Reassemble: ${provSub}`,
      latinName: `Reconstitutio Corporis ${provSub}`,
      description: `Reassemble the *Corpus* of ${provSub}: collect at least 1 relic from each *pars corporis* (${groups.join(', ')}). *Exuviae primariae per cultum duliae.*`,
      objective: `Collect 1 relic from each body group: ${groups.join(', ')}`,
      targetRelicIds: ids,
      requiredCount: groups.length,
      currentCount: groupsDone.length,
      progressPercent: pct,
      rewards: {
        holyEssence: Math.floor(bodyRelics.reduce((s, r) => s + r.points, 0) * 0.8 * feastBonus),
        title: `Reconstituter of ${provSub}`,
        titleLatin: `Reconstitutor Sancti ${provSub}`,
        buff: hasIncorruptio
          ? MIRACLE_BUFFS.find(b => b.id === 'incorruptio-sancti')
          : seededPick(MIRACLE_BUFFS, hash),
      },
      liturgicalBonus: feastBonus,
      activeFeastName: feat?.latinName,
      isCompleted: false,
      hasIncorruptio,
    })
  }
  return quests
}

// ─── INSTRUMENTA PASSIONIS ───────────────────────────────────────────────────

function buildInstrumentaPassionisQuest(
  collected: Set<string>,
  relics: Relic[],
  feat: LiturgicalFeast | null,
): Quest | null {
  const targets = relics.filter(r => r.theological_dignity === 'Instrumenta Passionis')
  if (targets.length < 3) return null

  const ids = targets.map(r => r.id)
  const current = ids.filter(id => collected.has(id)).length
  const required = Math.max(3, Math.ceil(targets.length * 0.55))
  const pct = Math.min(100, Math.floor((current / required) * 100))
  if (pct >= 100) return null

  const feastBonus = calcFeastBonus(feat)
  const totalEssence = targets.reduce((s, r) => s + r.points, 0)

  return {
    id: 'quest_instrumenta_passionis',
    type: 'INSTRUMENTA_PASSIONIS',
    name: 'Gather the Instruments of the Passion',
    latinName: 'Collectio Omnium Instrumentorum Passionis Domini',
    description:
      'Gather the sacred *Instrumenta* of the *Crucifixio Domini Nostri* (*Clavus*, *Lancea*, *Lignum Crucis*, *Spinae*, *Titulus*). *Per modum signi*, as decreed at Trent, Session XXV.',
    objective: `Collect ${required} or more relics of *Instrumenta Passionis* dignity (Latria).`,
    targetRelicIds: ids,
    requiredCount: required,
    currentCount: current,
    progressPercent: pct,
    rewards: {
      holyEssence: Math.floor(totalEssence * 1.2 * feastBonus),
      title: 'Bearer of the Passion Instruments',
      titleLatin: 'Portitor Instrumentorum Passionis',
      buff: MIRACLE_BUFFS.find(b => b.id === 'virtus-ligni'),
    },
    liturgicalBonus: feastBonus,
    activeFeastName: feat?.latinName,
    isCompleted: false,
    hasIncorruptio: false,
  }
}

// ─── LOCAL PATRON ────────────────────────────────────────────────────────────

function buildLocalPatronQuest(
  collected: Set<string>,
  relics: Relic[],
  feat: LiturgicalFeast | null,
): Quest | null {
  const AMBROSIAN_SUBS = ['Ambrosian', 'Gervasian', 'Protosian', 'Early Martyr']
  const targets = relics.filter(
    r =>
      r.city === 'milano' &&
      (r.provenance_class === 'Patristic / Early Saint' ||
        AMBROSIAN_SUBS.includes(r.provenance_sub)),
  )
  if (targets.length < 3) return null

  const ids = targets.map(r => r.id)
  const current = ids.filter(id => collected.has(id)).length
  const pct = Math.floor((current / targets.length) * 100)
  if (pct >= 100) return null

  const feastBonus = calcFeastBonus(feat)
  const totalEssence = targets.reduce((s, r) => s + r.points, 0)

  return {
    id: 'quest_ambroseana_mediolanensia',
    type: 'LOCAL_PATRON',
    name: 'The Ambrosian Treasures of Milan',
    latinName: 'Ambroseana Mediolanensia',
    description:
      "Complete the *Exuviae* and *Instrumenta Vitae* of the *Patres Mediolanenses* in the Ambrosian Rite zone. *De Obitu Theodosii* calls us to venerate Milan's patron.",
    objective:
      'Collect all Patristic and Early Martyr relics with Ambrosian provenance in Milano.',
    targetRelicIds: ids,
    requiredCount: targets.length,
    currentCount: current,
    progressPercent: pct,
    rewards: {
      holyEssence: Math.floor(totalEssence * 0.7 * feastBonus),
      title: 'Ambrosian Relic Hunter',
      titleLatin: 'Venator Ambrosianus',
      buff: MIRACLE_BUFFS.find(b => b.id === 'benedictio-ambrosiana'),
    },
    liturgicalBonus: feastBonus,
    activeFeastName: feat?.latinName,
    isCompleted: false,
    hasIncorruptio: targets.some(r => r.incorruptio),
  }
}

// ─── MAIN ENTRY POINT ────────────────────────────────────────────────────────

export function generateQuests(collectedIds: string[], count = 3): Quest[] {
  const collected = new Set(collectedIds)
  const feat = getActiveFeastToday()

  const candidates: Quest[] = [
    ...buildCategorySweepQuests(collected, RELICS, feat),
    ...buildSaintReassemblyQuests(collected, RELICS, feat),
  ]

  const instrumenta = buildInstrumentaPassionisQuest(collected, RELICS, feat)
  if (instrumenta) candidates.push(instrumenta)

  const patron = buildLocalPatronQuest(collected, RELICS, feat)
  if (patron) candidates.push(patron)

  // Score: prefer 20–70% progress, favour feast bonuses
  const scored = candidates
    .filter(q => q.progressPercent < 100)
    .map(q => {
      const pref = 100 - Math.abs(q.progressPercent - 45)  // sweet spot ~45%
      const feastBonus = q.liturgicalBonus > 1 ? 25 : 0
      return { quest: q, score: pref + feastBonus }
    })
    .sort((a, b) => b.score - a.score)

  // Deduplicate by type: max 2 CATEGORY_SWEEP, 1 of all others
  const typeCounts = new Map<QuestType, number>()
  const results: Quest[] = []
  for (const { quest } of scored) {
    if (results.length >= count) break
    const limit = quest.type === 'CATEGORY_SWEEP' ? 2 : 1
    const seen = typeCounts.get(quest.type) ?? 0
    if (seen >= limit) continue
    typeCounts.set(quest.type, seen + 1)
    results.push(quest)
  }

  return results
}

// ─── PROGRESS UPDATE ─────────────────────────────────────────────────────────

export function updateQuestProgress(quest: Quest, collectedIds: string[]): Quest {
  const collected = new Set(collectedIds)

  if (quest.type === 'SAINT_REASSEMBLY') {
    const bodyRelics = RELICS.filter(r => quest.targetRelicIds.includes(r.id) && r.body_part_group)
    const allGroups = [...new Set(bodyRelics.map(r => r.body_part_group!))]
    const doneGroups = allGroups.filter(g =>
      bodyRelics.filter(r => r.body_part_group === g).some(r => collected.has(r.id)),
    )
    const pct = Math.floor((doneGroups.length / allGroups.length) * 100)
    return {
      ...quest,
      currentCount: doneGroups.length,
      progressPercent: pct,
      isCompleted: pct >= 100,
    }
  }

  const current = quest.targetRelicIds.filter(id => collected.has(id)).length
  const pct = Math.min(100, Math.floor((current / quest.requiredCount) * 100))
  return { ...quest, currentCount: current, progressPercent: pct, isCompleted: pct >= 100 }
}
