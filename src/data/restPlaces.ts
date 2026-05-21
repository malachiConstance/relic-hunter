// Rest places: churches, klosters, and taverns where pilgrims recover Fervor
// and hear news of relics and other sacred sites.
//
// Fervor (Fervor Spiritalis) is the spiritual energy that powers processions.
// Churches restore 35, klosters 50, taverns 15.
//
// All locations are real historical places in Milan with attested history.

export type RestPlaceType = 'church' | 'kloster' | 'tavern'

export type RobberyLossType = 'fervor' | 'essence' | 'both'

export interface RobberyEvent {
  id: string
  title: string
  narrative: string   // what happened
  rescue: string      // who gave you the bare minimum to continue
  lossType: RobberyLossType
  essenceLoss?: number  // only for 'essence' or 'both' types
}

export const ROBBERY_EVENTS: RobberyEvent[] = [
  {
    id: 'poisoned-wine',
    title: 'The Poisoned Wine',
    narrative:
      'A pilgrim presses a cup of wine on you with great warmth. "From my own village," he says. You drink deeply. When you wake, your purse is gone, your legs unsteady, and the man has vanished with your coins and your dignity.',
    rescue:
      'A Franciscan friar finds you slumped against the wall. He presses a small coin into your palm and steadies you to your feet. "Go. God saw what was done to you."',
    lossType: 'both',
    essenceLoss: 30,
  },
  {
    id: 'spiked-food',
    title: 'The Spiked Supper',
    narrative:
      'You accept bread and a bowl of stew from a kind-faced woman near the gate. By the time you find a doorway to sit in, the world is spinning. You wake past midnight, stripped of your travelling money and weak as a newborn calf.',
    rescue:
      'The innkeeper\'s wife, who saw you from the window, brings water and a crust. "I know that woman," she mutters. "Go before she returns."',
    lossType: 'both',
    essenceLoss: 25,
  },
  {
    id: 'gambling-trap',
    title: 'The Gambling Trap',
    narrative:
      'Three men invite you to a friendly game of dice, "just for small stakes." Before you understand what is happening, the game is crooked, the stakes are not small, and you are out everything you had. They melt into the crowd before you can protest.',
    rescue:
      'A passing merchant claps you on the shoulder. "I saw the whole thing — they do it every week. Here, enough for one meal and a walk home." He is gone before you can thank him.',
    lossType: 'essence',
    essenceLoss: 50,
  },
  {
    id: 'midnight-attack',
    title: 'The Midnight Attack',
    narrative:
      'You are sleeping in the common room when rough hands drag you outside in the dark. The blow is fast. When you come to your senses on the cobblestones, the night is quiet and your belt purse is gone. You did not even see their faces.',
    rescue:
      'A night watchman finds you at his rounds. He has no money to give but he knows a brother at a nearby church who will receive you. He walks you there himself and knocks until someone opens the door.',
    lossType: 'fervor',
  },
  {
    id: 'false-pilgrim',
    title: 'The False Pilgrim',
    narrative:
      'A man in pilgrim garb walks beside you for an hour, sharing hardships of the road, asking about your route. His hand, light as a spider, lifts your purse so gently you feel nothing. You discover the loss only when you reach for it at a stall.',
    rescue:
      'A stall-keeper who witnessed it hands you a few coins from his own box. "That one I know. A thief who wears the scallop shell. God will settle with him."',
    lossType: 'both',
    essenceLoss: 20,
  },
  {
    id: 'temptation-trap',
    title: 'The Temptation Trap',
    narrative:
      'A beautiful stranger with a kind voice leads you into a side room, promising rest and company. In the morning she is gone, along with your purse, your spare sandals, and the small reliquary you wore at your neck.',
    rescue:
      'The establishment\'s owner — embarrassed and genuinely sorry — presses enough coins on you to walk away. "She does this. I have turned her out before. I am sorry, pilgrim."',
    lossType: 'both',
    essenceLoss: 40,
  },
  {
    id: 'relic-scam',
    title: 'The Relic Merchant\'s Fraud',
    narrative:
      'A merchant shows you a splinter of what he swears is the True Cross, wrapped in linen and priced to sell quickly. You pay well for it. Three streets later you unwrap it and find a chip of old wood stained with wine. The merchant\'s stall is gone.',
    rescue:
      'A sympathetic canon from a nearby church sees your face and guesses what happened. He gives you a blessing and enough coin to continue your pilgrimage. "Half the wood in Italy is sold as the Cross," he says drily.',
    lossType: 'essence',
    essenceLoss: 60,
  },
  {
    id: 'false-confessor',
    title: 'The False Confessor',
    narrative:
      'A man in clerical robes offers to hear your confession in a private chapel nearby. In the middle of your confession he produces a list of "indulgence fees" for each sin named. Shaken and confused, you pay. Outside, you notice his robes are poorly made and his tonsure drawn on with chalk.',
    rescue:
      'A real priest from the Augustinian house nearby spots you exiting the alley, white-faced. He listens, shakes his head, and gives you bread and a small coin. "You owe nothing. God is not a merchant."',
    lossType: 'both',
    essenceLoss: 35,
  },
  {
    id: 'street-child-gang',
    title: 'The Street Children',
    narrative:
      'A mob of small children surrounds you, laughing and pulling at your cloak. You think it is play until you are through the crowd and realize your coin purse has been lifted with professional skill. The children have scattered down three different alleys.',
    rescue:
      'An old woman selling chestnuts at the corner watched the whole thing. She presses a few coins into your hand. "The big one in the brown cap — he is the leader. He works for a man near the Vetra. I am sorry. It happens every week."',
    lossType: 'fervor',
  },
  {
    id: 'loaded-confession',
    title: 'The Loaded Brotherhood',
    narrative:
      'You are invited to join a confraternity meeting in a private room — prayers, singing, fellowship. But by the end of the evening there have been many collections, a "voluntary" levy for the brotherhood\'s church repairs, and a "gift for the poor" that you feel unable to decline. You leave considerably lighter.',
    rescue:
      'A member who saw your discomfort follows you out. "I am sorry. This confraternity is not what it claims to be. Here — I will not pretend this makes it right, but it will get you somewhere to sleep." He presses coins into your hand and disappears back inside.',
    lossType: 'essence',
    essenceLoss: 45,
  },
]

export interface EncounterReveal {
  placeId?: string    // reveals a rest place on the map
  relicId?: string    // reveals a relic on the map
  isFalseLead?: boolean  // revealed place yields nothing (or robbery)
}

export interface Encounter {
  id: string
  type: 'helpful' | 'neutral' | 'negative'
  pilgrimName: string
  from: string
  dialogue: string
  reveal?: EncounterReveal
  fervorPenalty?: number  // for robbery/negative outcomes (applied when the false lead is visited)
}

export interface RestPlace {
  id: string
  name: string
  nameLocal: string
  type: RestPlaceType
  coord: [number, number]
  description: string
  history: string
  fervorRestore: number
  encounterPool: string[]   // encounter IDs that can fire here
  saintAffinity?: string    // special procession knowledge tied to this place
  isFalseLead?: boolean     // if true, visiting yields robbery instead of rest
  robberyChance?: number    // 0–1 probability of random robbery at a real place
}

// ── Encounters ─────────────────────────────────────────────────────────────

export const ENCOUNTERS: Encounter[] = [
  // Castello Sforzesco encounters (start location)
  {
    id: 'castello-1',
    type: 'helpful',
    pilgrimName: 'Brother Giacomo',
    from: 'from Pavia',
    dialogue:
      'I have been walking for three weeks. Take heart, friend. The Basilica of Sant\'Ambrogio lies barely half a mile west — the holy Doctor himself rests entire in a glass urn, flanked by his martyrs Gervase and Protase. The brothers there are generous with a bed and a candle.',
    reveal: { relicId: 'sant-ambrogio-body' },
  },
  {
    id: 'castello-2',
    type: 'helpful',
    pilgrimName: 'Marta the Widow',
    from: 'from Como',
    dialogue:
      'The Benedictine sisters of San Maurizio kept me three nights without charge, fed me soup, and prayed with me each compline. Their cloister is west on the Corso Magenta. Pilgrims know it as a place of deep peace — you will restore your spirit quickly there.',
    reveal: { placeId: 'san-maurizio' },
  },
  {
    id: 'castello-3',
    type: 'neutral',
    pilgrimName: 'Old Tommaso',
    from: 'from Milan itself',
    dialogue:
      'The Duomo Nail is the most famous relic in all Lombardy, aye. But the procession demands much. A man must be strong in spirit before he attempts it. Eat something, rest, let God fill you before you make the attempt.',
  },
  {
    id: 'castello-4',
    type: 'helpful',
    pilgrimName: 'Friar Benedetto',
    from: 'from Bergamo',
    dialogue:
      'If you seek the Three Kings — and what pilgrim does not — they lie at Sant\'Eustorgio, south of the city. The gold sarcophagus was looted by Barbarossa and most carried to Cologne, but what remains is still miraculous. I have seen healings there with my own eyes.',
    reveal: { relicId: 'tre-magi' },
  },
  {
    id: 'castello-5',
    type: 'negative',
    pilgrimName: 'A shifty pilgrim from the south',
    from: 'or so he claims',
    dialogue:
      'Friend! I know of a hidden shrine, east along the walls near Porta Orientale. They say a splinter of the True Cross is kept there by a hermit. Worth the detour, I promise you.',
    reveal: { placeId: 'false-shrine-east', isFalseLead: true },
  },

  // San Maurizio kloster encounters
  {
    id: 'san-maurizio-1',
    type: 'helpful',
    pilgrimName: 'Sister Agnese',
    from: 'Benedictine novice',
    dialogue:
      'We Sisters pray for all pilgrims who pass through. A word of guidance: the church of San Nazaro south of the Duomo holds the bones of the Apostle — yes, of the Apostle himself, brought here by Ambrose. Many overlook it, but it is a very great treasure.',
    reveal: { relicId: 'san-nazaro-relics' },
  },
  {
    id: 'san-maurizio-2',
    type: 'helpful',
    pilgrimName: 'A Florentine merchant',
    from: 'from Florence',
    dialogue:
      'I travel these roads twice a year. There is a good tavern just west of the old castle walls — the Locanda al Falcone. Ask for old Pietro; he knows every pilgrim who has passed through Milan in twenty years. Many relics have been tracked down from a tip given there.',
    reveal: { placeId: 'locanda-falcone' },
  },
  {
    id: 'san-maurizio-3',
    type: 'neutral',
    pilgrimName: 'A pilgrim from Cremona',
    from: 'from Cremona',
    dialogue:
      'These sisters pray seven times a day without fail. I have slept here three nights now and my spirit is much recovered. The Benedictine rule — ora et labora — is a great medicine for the weary pilgrim.',
  },

  // San Marco church encounters
  {
    id: 'san-marco-1',
    type: 'helpful',
    pilgrimName: 'Fra Antonio',
    from: 'Augustinian friar',
    dialogue:
      'San Pietro in Gessate, to the east, is not well-known to outsiders, but a certain relic of great virtue is kept in the sacristy — not listed in any guide. The Sforza duke who built that church put something very rare in the walls when it was consecrated. Go and ask the sacristan.',
    reveal: { placeId: 'san-pietro-gessate' },
  },
  {
    id: 'san-marco-2',
    type: 'helpful',
    pilgrimName: 'A German pilgrim',
    from: 'from Augsburg',
    dialogue:
      'I heard in the tavern by the Piazza della Vetra that the canons of Sant\'Ambrogio will grant a private audience with the holy relics if you bring a letter of introduction from any Augustinian house. This church — San Marco — is Augustinian. The prior here can give you such a letter.',
    reveal: { relicId: 'alb-dalmatica-ambrosii' },
  },
  {
    id: 'san-marco-3',
    type: 'neutral',
    pilgrimName: 'A young painter\'s apprentice',
    from: 'Milanese',
    dialogue:
      'Leonardo himself attended Mass here at San Marco, you know. Or so the old men say. I do not know much of relics, but I know this church is a peaceful place to rest your feet.',
  },

  // San Pietro in Gessate encounters
  {
    id: 'san-pietro-1',
    type: 'helpful',
    pilgrimName: 'The sacristan',
    from: 'Milanese',
    dialogue:
      'A pilgrim asked me last week about the Basilica di San Marco to the north. I hear the friars there are very learned and can interpret the theological significance of any relic you have collected. They may also know where certain relics in the city are kept, as they keep detailed records.',
    reveal: { placeId: 'san-marco' },
  },
  {
    id: 'san-pietro-2',
    type: 'helpful',
    pilgrimName: 'Donna Costanza',
    from: 'from Lodi',
    dialogue:
      'My late husband was a physician. He always said the ancient church of San Calimero in the south of the city was where he prayed before difficult cases. San Calimero was bishop here in the second century — very ancient, very powerful prayers. The church is much older than it appears.',
    reveal: { placeId: 'san-calimero' },
  },
  {
    id: 'san-pietro-3',
    type: 'negative',
    pilgrimName: 'A rough-looking man',
    from: 'origin unknown',
    dialogue:
      'There is a great treasure hidden near the old Roman amphitheatre, not far from the Colonne di San Lorenzo. A pilgrim from the east told me. He said it is a bone of San Vittore in a silver reliquary, hidden in a crevice in the wall. He could not fetch it himself — his hands.',
    reveal: { placeId: 'false-amphitheatre', isFalseLead: true },
  },

  // San Calimero encounters
  {
    id: 'san-calimero-1',
    type: 'helpful',
    pilgrimName: 'An elderly canon',
    from: 'served here 40 years',
    dialogue:
      'The pilgrim road south passes the Bettolino della Vetra — a modest tavern near Piazza della Vetra. The pilgrims who know it well say it is the best place in Milan to learn of relics from the eastern roads. Merchants from Venice pass through and bring news of shrines all along the Via Francigena.',
    reveal: { placeId: 'bettolino-vetra' },
  },
  {
    id: 'san-calimero-2',
    type: 'helpful',
    pilgrimName: 'Brother Luca',
    from: 'from a monastery in Brescia',
    dialogue:
      'I made a special study of the martyrs of Milan. There is a reliquary at the Basilica of Sant\'Eustorgio — not the Magi tomb, the other one — that contains the head of San Pietro Martire. He was a Dominican who was killed with an axe in 1252, just north of here. His vestments are there too.',
    reveal: { relicId: 'peter-martyr-vestments' },
  },
  {
    id: 'san-calimero-3',
    type: 'neutral',
    pilgrimName: 'A young woman on her knees',
    from: 'local Milanese',
    dialogue:
      'My child was healed after I prayed here three nights. San Calimero does not get many visitors — he is not famous like Ambrose. But those who pray here say the answers come quietly, like a lamp in a room rather than a thunderclap.',
  },

  // Locanda al Falcone tavern encounters
  {
    id: 'falcone-1',
    type: 'helpful',
    pilgrimName: 'Old Pietro the innkeeper',
    from: 'Milan-born',
    dialogue:
      'I have been keeping this inn since the Sforza was still in power. Every pilgrim who has come through here — and there have been thousands — asks about the same things. Sant\'Ambrogio they all know. But the ones who stay a night learn about the little church of San Calimero in the south. Very ancient. Very quiet. Very powerful.',
    reveal: { placeId: 'san-calimero' },
  },
  {
    id: 'falcone-2',
    type: 'helpful',
    pilgrimName: 'A Venetian glass merchant',
    from: 'from Venice',
    dialogue:
      'I sold glass to the brothers at San Pietro in Gessate last month. The sacristan let slip that a new reliquary had arrived from Venice — a bone fragment, he would not say whose. The church is east of here, near what used to be Porta Orientale.',
    reveal: { placeId: 'san-pietro-gessate' },
  },
  {
    id: 'falcone-3',
    type: 'neutral',
    pilgrimName: 'Two pilgrims from Lyon',
    from: 'from Lyon',
    dialogue:
      'We have been three weeks on the road. We say: in every city, find the tavern, find the inn. The innkeeper always knows more than the bishop. That is our method.',
  },
  {
    id: 'falcone-4',
    type: 'negative',
    pilgrimName: 'A smooth-tongued pilgrim',
    from: 'says he is from Rome',
    dialogue:
      'You look like a man of discernment. I know of a small chapel just past Porta Ticinese — not on any pilgrim map — where the reliquary of Santa Corona is kept. The brothers there only open it to genuine pilgrims. Worth your while.',
    reveal: { placeId: 'false-chapel-ticinese', isFalseLead: true },
  },

  // Osteria dei Pellegrini encounters
  {
    id: 'pellegrini-1',
    type: 'helpful',
    pilgrimName: 'A Spanish pilgrim on her way to Rome',
    from: 'from Burgos',
    dialogue:
      'Gracias a Dios — this tavern saved me. Three days walking from the mountains. Listen: the church of San Marco, north near the Brera — the Augustinians keep records of every relic in Lombardy. If you cannot find what you seek, go there. They will know.',
    reveal: { placeId: 'san-marco' },
  },
  {
    id: 'pellegrini-2',
    type: 'helpful',
    pilgrimName: 'A leper pilgrim',
    from: 'identity unknown',
    dialogue:
      'I cannot enter the churches. But I have sat outside enough of them. The Benedictine sisters at San Maurizio on the Corso Magenta turned no one away — not even me. And I have heard them speak of a relic of Saint Satiro, brother of Ambrose. Very little known outside Milan.',
    reveal: { relicId: 'reliquiae-satyri' },
  },
  {
    id: 'pellegrini-3',
    type: 'neutral',
    pilgrimName: 'A pilgrim\'s wife',
    from: 'from Asti',
    dialogue:
      'My husband insists on visiting every church in the city. I have sat in this tavern three days waiting. God gives patience to some and wanderlust to others. Which are you, friend?',
  },

  // False-lead peaceful outcomes (60% chance — no robbery, just a quiet discovery)
  {
    id: 'false-lead-peaceful-1',
    type: 'neutral',
    pilgrimName: 'Your own thoughts',
    from: '',
    dialogue: 'You find nothing but crumbling stone and the quiet wind through empty walls. Yet the silence is strangely peaceful — a moment of stillness amid your long journey. Your spirit is a little restored.',
  },
  {
    id: 'false-lead-peaceful-2',
    type: 'neutral',
    pilgrimName: 'Your own thoughts',
    from: '',
    dialogue: 'The place holds no relic, no hermit, no treasure. Only old stones and weeds pushing through the mortar. You kneel briefly, say a prayer, and feel the better for it. Some journeys teach humility.',
  },
  {
    id: 'false-lead-peaceful-3',
    type: 'neutral',
    pilgrimName: 'Your own thoughts',
    from: '',
    dialogue: 'Whoever described this place as a sacred site was mistaken — or lying. You find nothing of note. But the walk itself was contemplative, and you return to the road with a clearer head and steadier legs.',
  },

  // Bettolino della Vetra encounters
  {
    id: 'vetra-1',
    type: 'helpful',
    pilgrimName: 'A Genoese sea captain',
    from: 'from Genoa',
    dialogue:
      'I bring goods from the East. Last year, a Venetian brought a reliquary to Milan — bone fragments of San Vittore, he said, martyr of the Theban Legion. The fragments went to the Benedictine sisters at San Maurizio, I heard. I do not know if this is true, but the Venetian was not a liar usually.',
    reveal: { placeId: 'san-maurizio' },
  },
  {
    id: 'vetra-2',
    type: 'helpful',
    pilgrimName: 'A Milanese cloth-dyer',
    from: 'Milanese',
    dialogue:
      'I am not a pilgrim myself — just a man who drinks here most evenings. But my mother told me: there is a church east of the city, San Pietro in Gessate they call it, built by the Sforza. The chapel on the left has something special. She prayed there and was cured of a fever. True story.',
    reveal: { placeId: 'san-pietro-gessate' },
  },
  {
    id: 'vetra-3',
    type: 'neutral',
    pilgrimName: 'A Franciscan friar',
    from: 'from Assisi',
    dialogue:
      'Our brother Francis said: "The place of true pilgrimage is within." But he also walked 2000 miles to Rome, so perhaps he meant something more nuanced. Drink something warm, friend. God will wait.',
  },
]

// ── Rest places ─────────────────────────────────────────────────────────────

export const REST_PLACES: RestPlace[] = [
  // ── FALSE LEAD PLACES (not real rest places — yield robbery/nothing) ────
  {
    id: 'false-shrine-east',
    name: 'Ruined Shrine near Porta Orientale',
    nameLocal: 'Sacellum Desertum',
    type: 'church',
    coord: [45.4675, 9.2018],
    description: 'A crumbling structure near the old eastern gate.',
    history: '',
    fervorRestore: 20,
    encounterPool: ['false-lead-peaceful-1', 'false-lead-peaceful-2', 'false-lead-peaceful-3'],
    isFalseLead: true,
  },
  {
    id: 'false-amphitheatre',
    name: 'Old Roman Amphitheatre Ruins',
    nameLocal: 'Amphitheatrum Mediolani',
    type: 'church',
    coord: [45.4587, 9.1826],
    description: 'Crumbling stone near the ancient amphitheatre.',
    history: '',
    fervorRestore: 20,
    encounterPool: ['false-lead-peaceful-1', 'false-lead-peaceful-2', 'false-lead-peaceful-3'],
    isFalseLead: true,
  },
  {
    id: 'false-chapel-ticinese',
    name: 'Chapel near Porta Ticinese',
    nameLocal: 'Capella Ticinensis',
    type: 'church',
    coord: [45.4558, 9.1855],
    description: 'A small locked chapel near the southern gate.',
    history: '',
    fervorRestore: 20,
    encounterPool: ['false-lead-peaceful-1', 'false-lead-peaceful-2', 'false-lead-peaceful-3'],
    isFalseLead: true,
  },

  // ── ACTUAL REST PLACES ──────────────────────────────────────────────────

  {
    id: 'castello-sforzesco',
    name: 'Castello Sforzesco',
    nameLocal: 'Castrum Portae Iovis',
    type: 'church',  // acts as starting sanctuary
    coord: [45.47028, 9.17944],
    description:
      'The great fortress of Milan, built by the Visconti and expanded by the Sforza dynasty. Its chapel offers refuge to weary pilgrims.',
    history:
      'Originally the "Porta Giovia" fortress (1358), rebuilt by Francesco Sforza after 1450. The ducal chapel within still preserves remnants of frescoes by the Lombard school. Leonardo da Vinci worked here as a court artist from 1482 to 1499.',
    fervorRestore: 25,
    encounterPool: ['castello-1', 'castello-2', 'castello-3', 'castello-4', 'castello-5'],
    saintAffinity: 'Ambrosian rite',
  },

  {
    id: 'san-maurizio',
    name: 'Monastero di San Maurizio',
    nameLocal: 'Monasterium Sancti Mauritii ad Monasterium Maius',
    type: 'kloster',
    coord: [45.4654, 9.1769],
    description:
      'The greatest Benedictine nunnery in Milan, founded in the 8th century. The nuns observe the strict Rule of St. Benedict. Their church contains magnificent frescoes by Bernardino Luini. The cloister garden is open to pilgrims seeking rest.',
    history:
      'The "Monastero Maggiore" (Greater Monastery) was the largest women\'s monastery in medieval Milan, endowed by the Lombard kings. The current church, built 1503–1519, conceals an older Benedictine complex. The divided nave — one half for the public, one for the nuns — reflects centuries of enclosed life.',
    fervorRestore: 50,
    encounterPool: ['san-maurizio-1', 'san-maurizio-2', 'san-maurizio-3'],
    saintAffinity: 'San Maurizio',
  },

  {
    id: 'san-marco',
    name: 'Basilica di San Marco',
    nameLocal: 'Basilica Sancti Marci',
    type: 'church',
    coord: [45.4725, 9.1886],
    description:
      'An Augustinian church founded in 1254, dedicated to Saint Mark the Evangelist. The friars maintain an extensive library of hagiographic records — every relic in Lombardy is noted somewhere in their archives.',
    history:
      'Built by the Augustinian friars on the site of an earlier chapel, San Marco became one of Milan\'s principal devotional churches. Giuseppe Verdi conducted the premiere of his Requiem here in 1874. Leonardo da Vinci is documented attending Mass here. The campanile dates from the 14th century.',
    fervorRestore: 35,
    encounterPool: ['san-marco-1', 'san-marco-2', 'san-marco-3'],
    saintAffinity: 'San Marco',
  },

  {
    id: 'san-pietro-gessate',
    name: 'San Pietro in Gessate',
    nameLocal: 'Sanctus Petrus in Gessatum',
    type: 'church',
    coord: [45.4622, 9.2025],
    description:
      'A late Gothic church built by the Sforza between 1447 and 1475. Named for the lime-plaster (gessato) workshops that once stood nearby. The sacristy contains a reliquary not listed in any pilgrim guide.',
    history:
      'Commissioned by the Sforza banker Pigello Portinari — who also built the famous Portinari Chapel at Sant\'Eustorgio — this church was given to the Benedictines of Santa Giustina. The apse frescoes, severely damaged over centuries, depicted scenes from the life of Saint Ambrose.',
    fervorRestore: 35,
    encounterPool: ['san-pietro-1', 'san-pietro-2', 'san-pietro-3'],
    saintAffinity: 'San Pietro',
  },

  {
    id: 'san-calimero',
    name: 'Basilica di San Calimero',
    nameLocal: 'Basilica Sancti Calimerī',
    type: 'church',
    coord: [45.4563, 9.1883],
    description:
      'One of Milan\'s oldest Christian basilicas, founded in the 4th century over the tomb of San Calimero, Bishop of Milan around 190 AD. A place of intense quiet, largely overlooked by mainstream pilgrimage routes — which is perhaps why its prayers are answered.',
    history:
      'San Calimero was the fourth bishop of Milan and a martyr. The original early-Christian basilica was rebuilt multiple times; the current structure largely dates from the 11th–15th centuries. The crypt preserves the oldest layers. The saint\'s feast day (31 July) draws local Milanese but few foreign pilgrims.',
    fervorRestore: 35,
    encounterPool: ['san-calimero-1', 'san-calimero-2', 'san-calimero-3'],
    saintAffinity: 'San Calimero',
  },

  // ── TAVERNS ────────────────────────────────────────────────────────────

  {
    id: 'locanda-falcone',
    name: 'Locanda al Falcone',
    nameLocal: 'Hospitium ad Falconem',
    type: 'tavern',
    coord: [45.4698, 9.1792],
    description:
      'An inn near the castle walls, its sign bearing the Sforza falcon. Old Pietro has kept it for forty years and knows every pilgrim route through Lombardy. The wine is rough but the information is worth its price.',
    history:
      'Taverns and inns clustered around the Castello Sforzesco to serve the constant traffic of merchants, soldiers, and pilgrims. The falcon (falcone) was the heraldic bird of the Visconti-Sforza dynasty; many establishments near the castle adopted it as their sign. This particular inn occupies a position on the main road north toward Como.',
    fervorRestore: 15,
    encounterPool: ['falcone-1', 'falcone-2', 'falcone-3', 'falcone-4'],
    robberyChance: 0.2,
  },

  {
    id: 'osteria-pellegrini',
    name: 'Osteria dei Pellegrini',
    nameLocal: 'Taberna Peregrinorum',
    type: 'tavern',
    coord: [45.4619, 9.1821],
    description:
      'On the Via dei Pellegrini — the street of pilgrims — this osteria has served travelers since the road south to Rome was first tramped by Christian feet. A mixing-pot of tongues, faiths, and rumours.',
    history:
      'The Via dei Pellegrini (Pilgrims\' Street) in Milan\'s southwestern quarter took its name from the constant flow of travelers heading south toward the Via Francigena and Rome. Pilgrims\' hospices and taverns lined this route; the Church of Santa Maria presso San Celso at its southern end was a major devotional stop. The street name survives in the modern city.',
    fervorRestore: 15,
    encounterPool: ['pellegrini-1', 'pellegrini-2', 'pellegrini-3'],
    robberyChance: 0.15,
  },

  {
    id: 'bettolino-vetra',
    name: 'Bettolino della Vetra',
    nameLocal: 'Caupona ad Vitream',
    type: 'tavern',
    coord: [45.4565, 9.1838],
    description:
      'A humble bettolino (small tavern) near the Piazza della Vetra, south of the city. The Vetra was Milan\'s public gathering place for centuries — market, spectacle, and execution ground. Men who have seen everything end up in its taverns eventually.',
    history:
      'The Piazza della Vetra (from the Latin "vitreum," glass) was a large open space outside the medieval walls near the Ticinese gate. It served as a public market, a place of punishment, and a gathering point for pilgrims heading toward Sant\'Eustorgio. The glassblowers\' workshops nearby gave the square its name. The taverns here had a rough but lively reputation.',
    fervorRestore: 15,
    encounterPool: ['vetra-1', 'vetra-2', 'vetra-3'],
    robberyChance: 0.25,
  },
]

// Lookup helpers
export function getRestPlace(id: string): RestPlace | undefined {
  return REST_PLACES.find(p => p.id === id)
}

export function getEncounter(id: string): Encounter | undefined {
  return ENCOUNTERS.find(e => e.id === id)
}

export const TRUE_REST_PLACES = REST_PLACES.filter(p => !p.isFalseLead)
export const FALSE_LEAD_PLACES = REST_PLACES.filter(p => p.isFalseLead)
