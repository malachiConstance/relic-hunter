import type { RelicCategory } from './relics'

export interface Goal {
  id: string
  title: string
  description: string
  check: (collectedIds: string[], allMilanRelicIds: string[], categoriesCollected: RelicCategory[]) => boolean
}

export const GOALS: Goal[] = [
  {
    id: 'first-relic',
    title: 'First Blood',
    description: 'Collect your very first relic.',
    check: (ids) => ids.length >= 1,
  },
  {
    id: 'nail-hunter',
    title: 'Nail Hunter',
    description: 'Collect the Holy Nail in the Duomo.',
    check: (ids) => ids.includes('santo-chiodo'),
  },
  {
    id: 'bone-collector',
    title: 'Bone Collector',
    description: 'Collect 2 or more bone or body relics.',
    check: (_, __, cats) => cats.filter(c => c === 'BONE' || c === 'BODY').length >= 2,
  },
  {
    id: 'magi-seeker',
    title: 'Magi Seeker',
    description: "Find the Three Kings in Sant'Eustorgio.",
    check: (ids) => ids.includes('tre-magi'),
  },
  {
    id: 'ambrosian',
    title: 'Filius Ambrosii',
    description: 'Collect the body of St. Ambrose and two of his associated relics.',
    check: (ids) => {
      const ambrosian = ['sant-ambrogio-body', 'reliquiae-satyri', 'alb-dalmatica-ambrosii', 'gervase-protase', 'ossa-protasii']
      return ids.includes('sant-ambrogio-body') && ambrosian.filter(id => ids.includes(id)).length >= 3
    },
  },
  {
    id: 'pilgrim',
    title: 'True Pilgrim',
    description: 'Collect at least one relic of each category present in Milano.',
    check: (_, __, cats) => {
      const unique = new Set(cats)
      return unique.has('NAIL') && unique.has('MAGI') && unique.has('BODY') && unique.has('BONE') && unique.has('CLOTH')
    },
  },
  {
    id: 'apostle-trail',
    title: 'Apostle Trail',
    description: 'Collect relics from 3 different churches.',
    check: (ids) => {
      const churches = new Set<string>()
      if (ids.includes('santo-chiodo') || ids.includes('fragmentum-ligni-crucis-duomo') || ids.includes('vestigium-caroli')) churches.add('duomo')
      if (ids.includes('tre-magi') || ids.includes('peter-martyr-vestments')) churches.add('santeustorgio')
      if (ids.includes('sant-ambrogio-body') || ids.includes('gervase-protase') || ids.includes('ossa-protasii') ||
          ids.includes('alb-dalmatica-ambrosii') || ids.includes('reliquiae-satyri') || ids.includes('phalanges-victoris')) churches.add('santambrogio')
      if (ids.includes('san-nazaro-relics')) churches.add('sannazaro')
      return churches.size >= 3
    },
  },
  {
    id: 'passion-seeker',
    title: 'Portitor Crucis',
    description: 'Collect 2 Instrumenta Passionis relics in Milano.',
    check: (ids) => {
      const passion = ['santo-chiodo', 'fragmentum-ligni-crucis-duomo']
      return passion.filter(id => ids.includes(id)).length >= 2
    },
  },
  {
    id: 'full-milano',
    title: 'Milano Completato',
    description: 'Collect every single relic in Milano. Magnifico.',
    check: (ids, all) => all.every(id => ids.includes(id)),
  },
]
