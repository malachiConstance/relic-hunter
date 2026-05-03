export type VisionType = 'devotio' | 'hint' | 'rome_whisper'

export interface VeiledVision {
  id: string
  text: string
  devotioBonus: number
  type: VisionType
}

const POOL: VeiledVision[] = [
  { id: 'v1',  type: 'devotio',      devotioBonus: 6,  text: 'Soft candlelight flickers at the next crossing… +6 Devotio' },
  { id: 'v2',  type: 'devotio',      devotioBonus: 8,  text: 'The stones beneath your feet hum with ancient prayer… +8 Devotio' },
  { id: 'v3',  type: 'devotio',      devotioBonus: 5,  text: 'A church bell rings in the distance, calling the faithful… +5 Devotio' },
  { id: 'v4',  type: 'devotio',      devotioBonus: 10, text: 'You pass beneath a carved saint\'s face — its eyes seem to follow you… +10 Devotio' },
  { id: 'v5',  type: 'devotio',      devotioBonus: 7,  text: 'The scent of incense drifts from a courtyard. Someone is praying… +7 Devotio' },
  { id: 'v6',  type: 'hint',         devotioBonus: 0,  text: 'The stones here are ancient. You feel the weight of centuries.' },
  { id: 'v7',  type: 'hint',         devotioBonus: 0,  text: 'A pilgrim ahead kneels briefly, then rises and walks on.' },
  { id: 'v8',  type: 'hint',         devotioBonus: 0,  text: 'An old woman crosses herself as you pass. She knows where you are going.' },
  { id: 'v9',  type: 'hint',         devotioBonus: 0,  text: 'Rain-worn Latin letters above a doorway: *Ora et Labora*.' },
  { id: 'v10', type: 'hint',         devotioBonus: 0,  text: 'The streets narrow. The sacred precinct is close.' },
  { id: 'v11', type: 'rome_whisper', devotioBonus: 0,  text: 'A pilgrim ahead drops a scrap of parchment: *"…et in Roma…"*' },
  { id: 'v12', type: 'rome_whisper', devotioBonus: 0,  text: 'You hear two monks arguing quietly: *"…they say in Roma the relics are without number…"*' },
  { id: 'v13', type: 'rome_whisper', devotioBonus: 0,  text: 'A faded fresco shows pilgrims on a long road south. The destination is not Milan.' },
  { id: 'v14', type: 'devotio',      devotioBonus: 9,  text: 'A candle left at a street shrine still burns — freshly lit. Someone was here moments ago… +9 Devotio' },
  { id: 'v15', type: 'hint',         devotioBonus: 0,  text: 'The procession path is worn smooth by a thousand pilgrim feet before yours.' },
]

const SHOWN_IDS = new Set<string>()

export function rollVision(stepIndex: number): VeiledVision | null {
  // ~15% chance per roll
  const seed = (stepIndex * 2654435761) >>> 0
  if (seed % 100 >= 15) return null

  // Pick from pool, avoid immediate repeats
  const available = POOL.filter(v => !SHOWN_IDS.has(v.id))
  if (available.length === 0) { SHOWN_IDS.clear() }
  const pick = (available.length > 0 ? available : POOL)[seed % (available.length || POOL.length)]
  SHOWN_IDS.add(pick.id)
  return pick
}
