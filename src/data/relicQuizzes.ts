export interface QuizQuestion {
  question: string
  answers: [string, string, string]   // always exactly 3
  correctIndex: 0 | 1 | 2
  explanation: string   // shown after answering — correct answer + bonus context
}

export interface RelicQuiz {
  relicId: string
  questions: [QuizQuestion, QuizQuestion, QuizQuestion]  // always exactly 3
}

export const RELIC_QUIZZES: RelicQuiz[] = [
  {
    relicId: 'santo-chiodo',
    questions: [
      {
        question: 'How high above the ground does the Holy Nail hang inside the Duomo?',
        answers: ['45 metres', '12 metres', '80 metres'],
        correctIndex: 0,
        explanation: 'The nail is suspended 45 metres above the floor in the apse vault, sealed inside a golden sunburst reliquary. The height was deliberate — it places the relic beyond human reach, emphasising its heavenly nature.',
      },
      {
        question: 'What is the cloud-shaped machine called that lowers the nail once a year?',
        answers: ['Carroccio', 'Nivola', 'Ambulacro'],
        correctIndex: 1,
        explanation: 'The Nivola (from the Latin "nubes", cloud) is a wooden cloud-shaped vessel that descends from the vault on ropes during the Feast of the Holy Cross in September. Volunteers dressed as angels ride inside it.',
      },
      {
        question: 'Which archbishop invented the machine to retrieve the nail during plagues?',
        answers: ['Federico Borromeo', 'Carlo Borromeo', 'Ambrogio da Saronno'],
        correctIndex: 1,
        explanation: 'Carlo Borromeo (1538–1584), the reforming Archbishop of Milan, built the Nivola in the 1570s. He believed exposing the nail to the city air would end the plague — and had it lowered three times during the devastating 1576 epidemic.',
      },
    ],
  },
  {
    relicId: 'fragmentum-ligni-crucis-duomo',
    questions: [
      {
        question: 'Where is the True Cross Splinter housed inside the Duomo?',
        answers: ['In the crypt beneath the altar', 'Inside the Santo Chiodo reliquary in the apse', 'In the sacristy treasury'],
        correctIndex: 1,
        explanation: 'The splinter is housed within the same apse reliquary as the Holy Nail, treated as a companion relic. Both are Instrumenta Passionis — objects directly associated with Christ\'s crucifixion.',
      },
      {
        question: 'According to theological tradition, what happens to the power of a True Cross fragment when it is divided?',
        answers: ['It diminishes proportionally', 'It is lost entirely', 'It does not diminish — each fragment is equally powerful'],
        correctIndex: 2,
        explanation: 'This doctrine, affirmed at the Council of Trent, holds that the virtus (sacred power) of a relic is indivisible. The whole is present in every part — similar to how each consecrated host in the Eucharist is considered the complete body of Christ.',
      },
      {
        question: 'Which council affirmed the sacred power (virtus) of True Cross fragments?',
        answers: ['Council of Trent', 'Council of Nicaea', 'First Vatican Council'],
        correctIndex: 0,
        explanation: 'The Council of Trent (1545–1563) specifically defended relic veneration against Protestant rejection, decreeing that relics are worthy of honour and that their virtus flows from God through the saints. It remains the definitive Catholic teaching on relics.',
      },
    ],
  },
  {
    relicId: 'vestigium-caroli',
    questions: [
      {
        question: 'During which disaster did St. Charles Borromeo wear the plague-processional robe?',
        answers: ['The 1630 Manzoni plague', 'The 1576 Great Plague of Milan', 'The 1348 Black Death'],
        correctIndex: 1,
        explanation: 'The 1576 plague killed roughly 17,000 Milanese. Borromeo organised public processions, fed the sick from his own resources, and famously walked barefoot through the infected streets — acts that made him the defining image of the Counter-Reformation bishop.',
      },
      {
        question: 'How did Borromeo walk through the infected streets of Milan during the plague?',
        answers: ['On horseback, wearing armour', 'Barefoot, in penitential procession', 'Hidden in a covered litter'],
        correctIndex: 1,
        explanation: 'Walking barefoot was a deliberate act of penitential humility — Borromeo was offering himself as a spiritual shield between the city and God\'s wrath. Contemporaries recorded that he carried a large cross and wept openly in the streets.',
      },
      {
        question: 'What is a brandeum?',
        answers: ['A relic that touched the body of a saint', 'A fragment of bone from a martyr', 'A document certifying a relic\'s authenticity'],
        correctIndex: 0,
        explanation: 'A brandeum (from Latin "brand", a burning touch) is a secondary relic made by touching cloth to a primary relic or holy tomb. The practice was common in early Christianity — Pope Gregory the Great famously sent brandeums to Queen Theodelinda instead of body parts.',
      },
    ],
  },
  {
    relicId: 'sant-ambrogio-body',
    questions: [
      {
        question: 'Who flanks the body of St. Ambrose in the crypt of Sant\'Ambrogio?',
        answers: ['SS. Vitale and Agricola', 'SS. Gervasius and Protasius', 'SS. Nazarius and Celsus'],
        correctIndex: 1,
        explanation: 'The three bodies share a single porphyry sarcophagus in the Confessio. Ambrose himself discovered Gervasius and Protasius in 386 AD and chose to be buried with them — a union he described as "two soldiers flanking their general".',
      },
      {
        question: 'How many sacraments did Ambrose receive in one week before becoming bishop?',
        answers: ['Three', 'Five', 'Seven'],
        correctIndex: 2,
        explanation: 'Ambrose received baptism, confirmation, tonsure, and the four orders (lector, exorcist, acolyte, subdeacon, deacon, priest) in rapid succession, then was consecrated bishop on December 7, 374 AD — a date still celebrated as his feast day in Milan.',
      },
      {
        question: 'What was Ambrose\'s status in the Church when the crowd demanded he become bishop?',
        answers: ['A deacon serving in Rome', 'A monk at a Milanese monastery', 'Not even a baptized Christian'],
        correctIndex: 2,
        explanation: 'Ambrose was a Roman governor — a catechumen (enrolled for baptism but not yet baptized) when the crowd spontaneously chanted his name to resolve a deadlock between Arian and Nicene Christians. He tried to flee the city to avoid the appointment.',
      },
    ],
  },
  {
    relicId: 'gervase-protase',
    questions: [
      {
        question: 'Who discovered the bones of Gervase and Protase?',
        answers: ['St. Augustine of Hippo', 'St. Ambrose of Milan', 'Emperor Constantine'],
        correctIndex: 1,
        explanation: 'Ambrose discovered the bones in 386 AD under the floor of a church near the basilica he was building. He identified them through their extraordinary size and a vision. Augustine of Hippo, who was in Milan at the time, witnessed the miracles at the translation and described them in his Confessions.',
      },
      {
        question: 'What miracle reportedly occurred at the bones\' translation ceremony?',
        answers: ['A blind man\'s sight was restored', 'The bones glowed with golden light', 'Rain fell on a clear day'],
        correctIndex: 0,
        explanation: 'A blind man named Severus, who touched the burial shroud during the procession, reportedly had his sight restored. The miracle was witnessed by thousands and described by both Ambrose and Augustine. The Empress Justina — who opposed Ambrose — accused him of staging a fraud.',
      },
      {
        question: 'In what century were Gervase and Protase martyred?',
        answers: ['3rd century', '1st century', '4th century'],
        correctIndex: 1,
        explanation: 'They are considered proto-martyrs of Milan — killed in the 1st century during the Neronian or Domitianic persecutions. The identification of their enormous bones with these specific martyrs was theological inference by Ambrose, not documentary evidence.',
      },
    ],
  },
  {
    relicId: 'ossa-protasii',
    questions: [
      {
        question: 'Where are the bones of Protasius venerated in Sant\'Ambrogio?',
        answers: ['In the apse reliquary', 'In the porphyry sarcophagus in the Confessio', 'In the Chapel of San Vittore'],
        correctIndex: 1,
        explanation: 'The Confessio (the crypt beneath the high altar) contains the famous porphyry sarcophagus holding Ambrose, Gervasius, and Protasius together. Porphyry was an imperial purple stone reserved for emperors — its use here was a deliberate statement about the saints\' royal dignity.',
      },
      {
        question: 'What did Ambrose interpret from the exceptional size of the martyrs\' bones?',
        answers: ['That they were Roman soldiers', 'A sign of their heroic virtue and martyr\'s crown', 'That they were twin giants'],
        correctIndex: 1,
        explanation: 'In patristic theology, a martyr\'s body was believed to be spiritually transfigured by suffering, often described as growing in stature. Ambrose cited the large bones as physical proof of their interior greatness — their bodies had been transformed by their faith.',
      },
      {
        question: 'Protasius and Gervasius are described as twin brothers. What century were they killed?',
        answers: ['1st century', '3rd century', '4th century'],
        correctIndex: 0,
        explanation: 'According to tradition, they were the sons of two other Milanese martyrs, Vitalis and Valeria. All four are commemorated together in the Ambrosian rite. Their 1st-century date makes them among the earliest known Christian martyrs in northern Italy.',
      },
    ],
  },
  {
    relicId: 'alb-dalmatica-ambrosii',
    questions: [
      {
        question: 'In which chapel of Sant\'Ambrogio are the vestment fragments housed?',
        answers: ['Cappella Portinari', 'Chapel of San Vittore in Ciel d\'Oro', 'Cappella del Sacramento'],
        correctIndex: 1,
        explanation: 'San Vittore in Ciel d\'Oro (Saint Victor in the Golden Sky) is named for its 5th-century gold mosaic ceiling. The chapel is one of the oldest surviving Christian mosaic interiors in the world, predating the main basilica by centuries.',
      },
      {
        question: 'What is believed to be special about the mosaic portrait of Ambrose in San Vittore chapel?',
        answers: ['It is the largest mosaic in Lombardy', 'It is the oldest known realistic portrait of any historical person in Italy', 'It was painted by St. Luke himself'],
        correctIndex: 1,
        explanation: 'The mosaic, made c. 386 AD, shows Ambrose with dark hair and a short beard — made while he was still alive by people who knew him personally. It gives us a face for one of the most influential figures in Church history. Scholars consider it a unique historical document.',
      },
      {
        question: 'What is the theological term for a relic that gained sanctity by touching a holy body?',
        answers: ['Pignora sancta', 'Brandeum', 'Tertiariae reliquiae'],
        correctIndex: 1,
        explanation: 'A brandeum is the standard term for a contact relic. Pignora sancta (sacred pledges) is a broader term for all relics used by early Christians, emphasising that they are pledges of the saints\' ongoing intercession. The vestments of Ambrose are technically both — they touched his body and serve as pignora.',
      },
    ],
  },
  {
    relicId: 'reliquiae-satyri',
    questions: [
      {
        question: 'Who was Satyrus in relation to St. Ambrose?',
        answers: ['His student and successor', 'His elder brother', 'His fellow bishop'],
        correctIndex: 1,
        explanation: 'Satyrus was Ambrose\'s older brother and managed the family estates in Africa so that Ambrose could dedicate himself entirely to Milan. When Ambrose became bishop, Satyrus sold his share of the inheritance and moved to Milan to serve him — an act Ambrose called supreme brotherly love.',
      },
      {
        question: 'What did Satyrus do when he heard his bishop-brother was in danger?',
        answers: ['He wrote a letter of intercession to the Emperor', 'He crossed the Alps in midwinter to rush to Milan', 'He organised a synod of bishops'],
        correctIndex: 1,
        explanation: 'The crossing was extraordinarily dangerous — Alpine routes in winter killed many travellers. Satyrus survived, but the journey damaged his health. He died shortly after arriving in Milan, which gave Ambrose the occasion to write his famous funeral oration.',
      },
      {
        question: 'What did Ambrose compose after Satyrus died?',
        answers: ['A hymn still sung at vespers', 'One of the finest funeral orations of early Christian literature', 'A theological treatise on martyrdom'],
        correctIndex: 1,
        explanation: 'Ambrose\'s De Excessu Fratris (On the Death of a Brother) is a masterpiece of Christian grief literature, combining Roman rhetoric with Christian hope for resurrection. Ambrose describes seeing his brother\'s body and struggling to accept the separation — a rawness unusual for a 4th-century bishop.',
      },
    ],
  },
  {
    relicId: 'phalanges-victoris',
    questions: [
      {
        question: 'What was St. Victor\'s profession before his martyrdom?',
        answers: ['A Roman senator', 'A Mauritanian soldier', 'A Dominican friar'],
        correctIndex: 1,
        explanation: 'Victor was a soldier in the Roman legions, originally from Mauretania (modern Morocco/Algeria). His military context is important — Roman soldiers who converted faced a unique dilemma since army service involved participating in pagan religious rites.',
      },
      {
        question: 'Under which emperor was Victor martyred in Milan?',
        answers: ['Emperor Maximian', 'Emperor Diocletian', 'Emperor Nero'],
        correctIndex: 0,
        explanation: 'Maximian was co-emperor with Diocletian and resided in Milan (then the western capital). His reign saw one of the worst persecutions in Milan\'s history — the Theban Legion massacre (of which Victor may have been a survivor) also took place under his orders.',
      },
      {
        question: 'What is notable about the 5th-century portrait of Victor in his chapel?',
        answers: ['It is made of pure gold leaf', 'It is one of the earliest surviving Christian portraits', 'It was painted by Ambrose himself'],
        correctIndex: 1,
        explanation: 'The gold mosaic portrait of Victor in the San Vittore in Ciel d\'Oro chapel dates to c. 400–450 AD, making it one of the earliest surviving Christian portrait mosaics in the Western world. Victor is depicted as a young, clean-shaven man — the conventional image of a Roman soldier-martyr.',
      },
    ],
  },
  {
    relicId: 'tre-magi',
    questions: [
      {
        question: 'Who transported the relics of the Three Magi to Milan in the 4th century?',
        answers: ['Emperor Constantine', 'Bishop Eustorgius', 'St. Ambrose'],
        correctIndex: 1,
        explanation: 'Bishop Eustorgius I brought the relics from Constantinople by ox-cart around 344 AD. According to legend, when the cart entered Milan, the oxen stopped and refused to move — interpreted as a divine sign to build the basilica on that exact spot. The basilica still stands there today.',
      },
      {
        question: 'Who looted the Three Magi relics from Milan in 1162?',
        answers: ['Frederick Barbarossa', 'Pope Innocent III', 'Attila the Hun'],
        correctIndex: 0,
        explanation: 'Frederick Barbarossa sacked Milan in 1162 after a prolonged siege. He gave the relics to his chancellor, Rainald of Dassel, who transported them to Cologne. The golden reliquary shrine built in Cologne became the largest reliquary in the Western world — and the reason Cologne Cathedral was built around it.',
      },
      {
        question: 'Where were most of the Magi relics sent after the 1162 looting?',
        answers: ['Paris, Notre-Dame Cathedral', 'Cologne Cathedral', 'Aachen Cathedral'],
        correctIndex: 1,
        explanation: 'The Shrine of the Three Kings in Cologne Cathedral is still there today — the largest medieval reliquary in existence. Only a few fragments returned to Milan in 1903, donated back by the Archbishop of Cologne. The Milanese still celebrate Epiphany with a procession to Sant\'Eustorgio every January 6th.',
      },
    ],
  },
  {
    relicId: 'san-nazaro-relics',
    questions: [
      {
        question: 'Which apostles\' relics are kept alongside St. Nazarius at San Nazaro Maggiore?',
        answers: ['Peter, Paul, Mark, Luke', 'Andrew, John, Thomas, and Bartholomew', 'Matthew, Philip, James, and Simon'],
        correctIndex: 1,
        explanation: 'Ambrose dedicated this basilica specifically as a repository for apostolic relics — his theological goal was to give Milan the same spiritual authority as Rome and Constantinople. The relics of Andrew, John, Thomas, and Bartholomew were gifts from Eastern churches.',
      },
      {
        question: 'What was the original name Ambrose gave to this basilica?',
        answers: ['Basilica Apostolorum', 'Basilica Martyrum', 'Basilica Sancti Nazarii'],
        correctIndex: 0,
        explanation: 'Ambrose\'s original name, Basilica Apostolorum (Basilica of the Apostles), revealed his intention: to make Milan a city of apostolic stature. The dedication to Nazarius came later. Today it is called San Nazaro Maggiore to distinguish it from other Milanese churches.',
      },
      {
        question: 'The Basilica di San Nazaro was the first Christian basilica built in Milan in what position?',
        answers: ['Inside the ancient city walls', 'Outside the ancient city walls', 'On the ruins of a Roman temple'],
        correctIndex: 1,
        explanation: 'Building outside the walls was a Roman funerary tradition — pagan law forbade burials within city limits. By placing the basilica outside, Ambrose was signalling that Christians followed their own law, consecrating the suburban space around martyrs\' tombs rather than suppressing it.',
      },
    ],
  },
  {
    relicId: 'peter-martyr-vestments',
    questions: [
      {
        question: 'How was St. Peter of Verona (Peter Martyr) killed?',
        answers: ['He was burned at the stake', 'He was struck by an axe-blow', 'He was drowned in the river Po'],
        correctIndex: 1,
        explanation: 'Peter was attacked on the road between Como and Milan on April 6, 1252. His assassin Carino struck him on the head with an axe, then stabbed his companion. According to tradition, Peter used his own blood to write "Credo in Deum" in the dust as he died.',
      },
      {
        question: 'How long after his death was Peter of Verona canonized — the fastest in Catholic history?',
        answers: ['337 days', '2 years', '5 years'],
        correctIndex: 0,
        explanation: 'Canonized on March 25, 1253 — exactly 337 days after his death — by Pope Innocent IV. The speed reflects both the political urgency of the Dominican order and the genuine popular veneration that erupted immediately after his murder. His relics were working miracles within days.',
      },
      {
        question: 'What remarkable thing happened to Peter\'s assassin, Carino of Balsamo?',
        answers: ['He fled to France and was never found', 'He repented, joined a Dominican monastery, and was himself beatified', 'He was executed by the Inquisition'],
        correctIndex: 1,
        explanation: 'Carino (also called Acerbus) was a hired killer, paid by Cathar sympathisers. After the murder he lived for decades in hiding, tormented by guilt. He eventually surrendered to the Dominicans, was received into the order, and died in great holiness. He was beatified in 1867 — murderer and victim venerated side by side.',
      },
    ],
  },
]

export const QUIZ_COOLDOWN_MS = 10 * 1000   // 10 seconds (temp — will tie to prayer points)

export function getQuizForRelic(relicId: string): RelicQuiz | null {
  return RELIC_QUIZZES.find(q => q.relicId === relicId) ?? null
}

export function shuffleQuestions(quiz: RelicQuiz): QuizQuestion[] {
  return [...quiz.questions].sort(() => Math.random() - 0.5)
}
