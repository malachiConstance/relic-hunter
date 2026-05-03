import rawXml from './gameDoc.xml?raw'

export interface GlossaryTerm {
  id: string
  word: string
  short: string
  full: string
}

export interface DocArticle {
  id: string
  title: string
  body: string
}

export interface DocSection {
  id: string
  title: string
  articles: DocArticle[]
}

export interface TutorialStep {
  num: number
  id: string
  title: string
  reward: string
  objective: string
  howto: string
  hint?: string
}

export interface GameDoc {
  glossary: GlossaryTerm[]
  glossaryMap: Map<string, GlossaryTerm>
  sections: DocSection[]
  tutorialSteps: TutorialStep[]
  tutorialIntro: string
  tutorialCompletion: { title: string; body: string } | null
}

function text(el: Element, tag: string): string {
  return el.querySelector(tag)?.textContent?.trim() ?? ''
}

function parseXml(): GameDoc {
  const parser = new DOMParser()
  const doc = parser.parseFromString(rawXml, 'application/xml')

  // Glossary
  const glossary: GlossaryTerm[] = []
  doc.querySelectorAll('glossary > term').forEach(el => {
    glossary.push({
      id: el.getAttribute('id') ?? '',
      word: text(el, 'word'),
      short: text(el, 'short'),
      full: text(el, 'full'),
    })
  })
  const glossaryMap = new Map(glossary.map(t => [t.id, t]))

  // Sections
  const sections: DocSection[] = []
  doc.querySelectorAll('section').forEach(sec => {
    const articles: DocArticle[] = []
    sec.querySelectorAll('article').forEach(art => {
      articles.push({
        id: art.getAttribute('id') ?? '',
        title: art.getAttribute('title') ?? '',
        body: text(art, 'body'),
      })
    })
    sections.push({
      id: sec.getAttribute('id') ?? '',
      title: sec.getAttribute('title') ?? '',
      articles,
    })
  })

  // Tutorial
  const tutEl = doc.querySelector('tutorial')
  const tutorialIntro = text(tutEl!, 'intro')
  const tutorialSteps: TutorialStep[] = []
  doc.querySelectorAll('tutorial > step').forEach(el => {
    tutorialSteps.push({
      num: parseInt(el.getAttribute('num') ?? '0'),
      id: el.getAttribute('id') ?? '',
      title: el.getAttribute('title') ?? '',
      reward: el.getAttribute('reward') ?? '',
      objective: text(el, 'objective'),
      howto: text(el, 'howto'),
      hint: el.querySelector('hint')?.textContent?.trim(),
    })
  })
  const compEl = doc.querySelector('tutorial > completion')
  const tutorialCompletion = compEl
    ? { title: compEl.getAttribute('title') ?? '', body: text(compEl, 'body') }
    : null

  return { glossary, glossaryMap, sections, tutorialSteps, tutorialIntro, tutorialCompletion }
}

// Parsed once at module load — reload page to pick up XML edits in dev
export const GAME_DOC: GameDoc = parseXml()
