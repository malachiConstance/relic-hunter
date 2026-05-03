export interface LiturgicalFeast {
  id: string
  name: string
  latinName: string
  mmdd: string        // MM-DD format
  windowDays: number  // days before/after that count
  pointsMultiplier: number
  essenceBonus: number
  flavorText: string
  relatedProvenanceSubs?: string[]
}

export const LITURGICAL_FEASTS: LiturgicalFeast[] = [
  {
    id: 'rito-nivola',
    name: 'Rito della Nivola',
    latinName: 'Expositio Clavus Crucis Mediolanensis',
    mmdd: '09-14',
    windowDays: 3,
    pointsMultiplier: 3.0,
    essenceBonus: 800,
    flavorText: 'The Holy Nail descends from the vault of the Duomo. All Milan kneels before the Clavus Crucis.',
    relatedProvenanceSubs: ['Passion Instrument'],
  },
  {
    id: 'inventio-crucis',
    name: 'Finding of the Holy Cross',
    latinName: 'Inventio Crucis Sanctae Helenae',
    mmdd: '05-03',
    windowDays: 3,
    pointsMultiplier: 2.0,
    essenceBonus: 500,
    flavorText: 'The True Cross is revealed. Latria relics shimmer with divine light. *Inventio Crucis!*',
    relatedProvenanceSubs: ['Passion Instrument'],
  },
  {
    id: 'good-friday',
    name: 'Good Friday',
    latinName: 'Feria VI in Passione et Morte Domini',
    mmdd: '04-18',
    windowDays: 3,
    pointsMultiplier: 2.5,
    essenceBonus: 700,
    flavorText: 'The Instrumenta Passionis tremble with sacred remembrance. *Ecce Lignum Crucis!*',
    relatedProvenanceSubs: ['Passion Instrument'],
  },
  {
    id: 'feast-ambrose',
    name: 'Feast of St. Ambrose',
    latinName: 'Festum Sancti Ambrosii Episcopi',
    mmdd: '12-07',
    windowDays: 3,
    pointsMultiplier: 1.5,
    essenceBonus: 400,
    flavorText: "The patron of Milan blesses all who seek his relics. Benedictio Ambrosiana upon the faithful!",
    relatedProvenanceSubs: ['Ambrosian', 'Gervasian', 'Protosian'],
  },
  {
    id: 'epiphany',
    name: 'Epiphany of the Lord',
    latinName: 'Festum Epiphaniae Domini',
    mmdd: '01-06',
    windowDays: 3,
    pointsMultiplier: 1.5,
    essenceBonus: 350,
    flavorText: "The Magi are honored. The star of Bethlehem shines above Sant'Eustorgio.",
    relatedProvenanceSubs: ['Magi'],
  },
  {
    id: 'feast-peter',
    name: 'Feast of SS. Peter & Paul',
    latinName: 'Festum SS. Petri et Pauli Apostolorum',
    mmdd: '06-29',
    windowDays: 3,
    pointsMultiplier: 1.75,
    essenceBonus: 450,
    flavorText: 'The Prince of the Apostles reigns. Petrine relics radiate Apostolic glory from the Confessio.',
    relatedProvenanceSubs: ['Petrine', 'Mixed Apostolic'],
  },
  {
    id: 'feast-gervasius',
    name: 'Feast of SS. Gervasius & Protasius',
    latinName: 'Festum SS. Gervasii et Protasii Martyrum',
    mmdd: '06-19',
    windowDays: 2,
    pointsMultiplier: 1.4,
    essenceBonus: 300,
    flavorText: "Milan's proto-martyrs are honored. Their bones glow with the light of the first martyrs.",
    relatedProvenanceSubs: ['Gervasian', 'Protosian'],
  },
  {
    id: 'feast-charles',
    name: 'Feast of St. Charles Borromeo',
    latinName: 'Festum Sancti Caroli Borromaei Episcopi',
    mmdd: '11-04',
    windowDays: 3,
    pointsMultiplier: 1.5,
    essenceBonus: 380,
    flavorText: "The great reformer who walked barefoot through plague-stricken Milan blesses all pilgrims.",
    relatedProvenanceSubs: ['Borromeo'],
  },
  {
    id: 'assumption',
    name: 'Assumption of the Blessed Virgin',
    latinName: 'Assumptio Beatae Mariae Virginis in Caelum',
    mmdd: '08-15',
    windowDays: 7,
    pointsMultiplier: 2.0,
    essenceBonus: 600,
    flavorText: 'Hyperdulia reigns supreme. Marian relics glow with rose-gold light. *Regina Caeli, laetare!*',
    relatedProvenanceSubs: ['Marian'],
  },
  {
    id: 'feast-thomas',
    name: 'Feast of St. Thomas the Apostle',
    latinName: 'Festum Sancti Thomae Apostoli',
    mmdd: '07-03',
    windowDays: 2,
    pointsMultiplier: 1.4,
    essenceBonus: 300,
    flavorText: "The Doubter's finger that touched the Risen Christ pulses with apostolic virtue.",
    relatedProvenanceSubs: ['Thomistic', 'Mixed Apostolic'],
  },
]

export function isFeastActive(feast: LiturgicalFeast, date: Date = new Date()): boolean {
  const [fm, fd] = feast.mmdd.split('-').map(Number)
  const feastDate = new Date(date.getFullYear(), fm - 1, fd)
  const diffDays = (date.getTime() - feastDate.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays >= -feast.windowDays && diffDays <= feast.windowDays
}

export function getActiveFeastToday(): LiturgicalFeast | null {
  const today = new Date()
  return LITURGICAL_FEASTS.find(f => isFeastActive(f, today)) ?? null
}

export function getActiveFeastsForRelic(provenanceSub: string, liturgicalFeast?: string | null): LiturgicalFeast[] {
  const today = new Date()
  return LITURGICAL_FEASTS.filter(f => {
    if (!isFeastActive(f, today)) return false
    if (f.relatedProvenanceSubs?.includes(provenanceSub)) return true
    if (liturgicalFeast && (
      liturgicalFeast.toLowerCase().includes(f.name.toLowerCase()) ||
      liturgicalFeast.toLowerCase().includes(f.latinName.toLowerCase().split(' ')[0])
    )) return true
    return false
  })
}
