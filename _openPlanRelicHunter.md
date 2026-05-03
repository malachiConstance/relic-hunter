# Relic Hunter — App Plan

> Half-serious, half-fun tourist app for visiting relic locations. Start: **Milano, Italy**.

---

## Concept

A mobile-first web app (PWA) where tourists hunt ancient relics hidden in churches across a city. Visualized on a styled antique/medieval map. Each relic can be "collected" via GPS or manual check-in. Collected relics build a visible pilgrimage route on the map. Goals and achievements keep it engaging.

**Tone:** Think Indiana Jones meets pilgrimage diary. Reverent but not boring.

---

## Tech Stack (recommended)

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + TypeScript (Vite) | Fast PWA, mobile-friendly |
| Map | Leaflet.js | Flexible, free, custom tiles |
| Map tiles | Stamen Watercolor / MapTiler Antique | Gives old/medieval feel |
| Icons | Custom SVG relic icons per category | Distinct visual identity |
| State | Zustand | Lightweight, persists to localStorage |
| Backend | None (v1) / Next.js API routes (v2) | Start fully client-side |
| Database | localStorage (v1) / Supabase (v2) | Scale when needed |
| Location | Browser Geolocation API | No extra lib needed |

**v1 ships fully static** — no backend, no auth, all data hardcoded. Works offline after first load.

---

## Relic Categories

| Code | Label | Icon idea | Description |
|---|---|---|---|
| `NAIL` | Nail of the Cross | ⚔ iron nail | Nails used in the Crucifixion |
| `WOOD` | True Cross | 🪵 wood fragment | Wood from the Holy Cross |
| `THORN` | Crown of Thorns | 🌿 thorn branch | Thorns from Jesus' crown |
| `BLOOD` | Holy Blood | 🩸 vial/ampule | Blood relics of Christ or saints |
| `BODY` | Saint's Body | 👁 sarcophagus | Full or near-full body |
| `BONE` | Saint's Bones | 💀 bone fragment | Skeletal remains |
| `CLOTH` | Holy Vestments | 🧥 folded cloth | Clothing, shrouds, sudarium |
| `MAGI` | Three Kings | ⭐ star | Relics related to the Wise Men |
| `INSTRUMENT` | Instrument of Passion | ⛓ other objects | Sponge, lance, crown etc. |

---

## Milano Relics Dataset (v1)

### 1. Santo Chiodo — Holy Nail
- **Category:** `NAIL`
- **Location:** Duomo di Milano (Cathedral)
- **Coordinates:** 45.4641, 9.1919
- **Description:** The most important relic of the Archdiocese of Milan. Believed to be a nail from the True Cross. Kept ~45m high in the apse inside a golden tabernacle. Once a year (September, Feast of the Holy Cross) it is lowered in a theatrical ceremony called the *Rito della Nivola* — Bishop Borromeo invented a special cloud-shaped machine (la Nivola) to retrieve it.
- **Interesting fact:** The nail inspired the Iron Crown of Lombardy (in nearby Monza) — one of its iron bands is claimed to be made from this same nail.

### 2. Tre Magi — Relics of the Three Magi
- **Category:** `MAGI`
- **Location:** Basilica di Sant'Eustorgio
- **Coordinates:** 45.4599, 9.1854
- **Description:** Bone fragments of the Three Wise Men (Caspar, Melchior, Balthasar). Bishop Eustorgius brought the relics from Constantinople by ox-cart (4th century). Legend: the cart was so heavy it couldn't move once it entered Milan — taken as a divine sign. In 1162, Frederick Barbarossa looted them for Cologne. Only a few fragments returned in 1903.
- **Interesting fact:** The basilica's tower has the oldest dated tombstone in Milan (1279) and the oldest surviving bell in Milan.

### 3. Sant'Ambrogio — Body of St. Ambrose
- **Category:** `BODY`
- **Location:** Basilica di Sant'Ambrogio
- **Coordinates:** 45.4641, 9.1781
- **Description:** The complete body of Saint Ambrose (339–397 AD), one of the four original Doctors of the Church and patron saint of Milan. Dressed in pontifical vestments in a glass urn in the crypt alongside the bodies of Saints Gervase and Protase (the first Milanese martyrs).
- **Interesting fact:** Ambrose was elected bishop by popular acclamation while he was still a catechumen (unbaptized). He was baptized and consecrated bishop within one week.

### 4. Santi Gervaso e Protaso — Martyrs
- **Category:** `BONE`
- **Location:** Basilica di Sant'Ambrogio (crypt, flanking Ambrose)
- **Coordinates:** 45.4641, 9.1781
- **Description:** Milan's proto-martyrs. Ambrose himself discovered their bones in 386 AD buried under a church he was building. Their blood-soaked soil was used to heal the blind.
- **Interesting fact:** Their discovery caused a political crisis — Empress Justina tried to confiscate the basilica from Ambrose, but the miraculous finds strengthened his popular support.

### 5. San Nazaro — Body of St. Nazarius + Apostle Relics
- **Category:** `BODY`
- **Location:** Basilica di San Nazaro Maggiore
- **Coordinates:** 45.4615, 9.1965
- **Description:** The body of St. Nazarius (1st-century martyr) and relics of multiple Apostles, including Andrew, John, Thomas, and Bartholomew. Also discovered by Ambrose (382 AD). The church was the first built outside the ancient city walls.
- **Interesting fact:** It was originally called *Basilica Apostolorum* — Apostles' Basilica. Ambrose himself was buried here before being moved to Sant'Ambrogio.

### 6. San Pietro Martire — Vestments of Peter of Verona
- **Category:** `CLOTH`
- **Location:** Cappella Portinari, Basilica di Sant'Eustorgio
- **Coordinates:** 45.4599, 9.1854
- **Description:** Bloodstained vestments of St. Peter of Verona (Pietro da Verona), a Dominican inquisitor murdered in 1252 near Milan. The assassination became the fastest canonization in Catholic history — just 337 days after his death.
- **Interesting fact:** His assassin, Carino, later repented, became a Dominican lay brother, and was also beatified. Murderer and victim are both venerated saints.

### 7. Corona Ferrea — Iron Crown of Lombardy *(nearby: Monza)*
- **Category:** `NAIL`
- **Location:** Duomo di Monza (20 min from Milano by train)
- **Coordinates:** 45.5830, 9.2741
- **Description:** One of the oldest royal insignia of Europe. Its inner iron band is claimed to be forged from a nail of the True Cross (the Holy Nail described above). Used to crown Charlemagne, Napoleon, and many other rulers of northern Italy.
- **Interesting fact:** Napoleon Bonaparte had himself crowned King of Italy with this crown in 1805, declaring: *"God gave it to me; woe to him who touches it."*
- **Note:** Optional day-trip relic for bonus achievement.

---

## App Features (v1 Scope)

### Map
- Leaflet.js with antique/watercolor tile style
- Custom relic markers by category (SVG icons, parchment-style)
- Clicking a marker opens a relic card
- Collected relics shown with a "worn/discovered" visual state
- Pilgrimage path drawn between collected relics in order

### Relic Card
- Name + category badge
- Church name + address
- Short lore text (2–4 sentences)
- "Interesting fact" highlight
- Collect button (manual or GPS-based)
- Distance from current location

### Collection Mechanic
- **GPS check-in:** If user is within ~100m of the relic location, "Collect via GPS" becomes active
- **Manual check-in:** Always available (honor system) — user taps "I'm here" → confirm dialog
- Collected state stored in localStorage
- Collection triggers brief animation + sound (parchment stamp)

### Pilgrimage Route
- After 2+ collections, draw a line on the map connecting them in order
- Route styled as aged ink line, not a clean GPS line
- Optional: show total walking distance

### Goals / Achievements
| Goal | Condition |
|---|---|
| **First Relic** | Collect 1 relic |
| **Nail Hunter** | Collect all `NAIL` relics in Milano |
| **Body Count** | Collect all `BODY` relics in Milano |
| **Full Milano** | Collect all relics in Milano |
| **Bone Collector** | Collect 3+ `BONE` relics |
| **Pilgrim** | Collect 1 of each category |
| **Magi Seeker** | Collect the Three Magi relic |
| **Apostle Trail** | Collect relics from 3+ churches |

Future (multi-city):
- **True Cross Devotee:** Collect 5+ `NAIL` or `WOOD` relics across cities
- **Saint's Tour:** Collect 10+ `BODY` relics across Europe
- **Relic Pilgrim:** Collect in 3+ cities

---

## App Structure (file layout)

```
src/
  data/
    relics.ts          # All relic data (coordinates, categories, lore)
    goals.ts           # Goal definitions and check logic
  components/
    Map.tsx            # Leaflet map + markers + route
    RelicCard.tsx      # Sidebar/modal relic details
    GoalsPanel.tsx     # Achievements drawer
    CollectButton.tsx  # GPS or manual collect
  hooks/
    useLocation.ts     # Browser geolocation
    useCollection.ts   # localStorage state for collected relics
  utils/
    distance.ts        # Haversine distance calc
    route.ts           # Build polyline from collection order
  App.tsx
```

---

## Design Direction

- **Color palette:** Aged parchment (#F5E6C8), dark sepia (#3D2B1F), faded crimson (#8B1A1A), gold (#C9A84C)
- **Typography:** Serif/medieval feel — `Cinzel` or `IM Fell English` from Google Fonts
- **Map markers:** Small illuminated-manuscript-style icons per category
- **UI frames:** Rough border/frame textures on cards, vignette overlay on map
- **Collect animation:** Wax seal stamp impression on collection

---

## Phased Roadmap

| Phase | Scope |
|---|---|
| **v1** | Static PWA, Milano only, localStorage, manual + GPS collect |
| **v2** | Add Rome, Venice, Florence; user accounts; Supabase backend |
| **v3** | Multi-city goals, leaderboard, share route as image |
| **v4** | AR overlay (camera view shows relic marker), audio guide |

---

## Open Questions / Decisions

- [ ] Native mobile app (React Native) vs PWA? → PWA first for speed
- [ ] Map tile provider cost at scale? → Evaluate MapTiler free tier
- [ ] How to verify GPS (can be spoofed)? → Honor system for v1, OK given half-fun tone
- [ ] Offline support? → Cache tiles + data via service worker
- [ ] Monza as separate "mini expansion" or part of Milano? → Separate optional zone

---

*Sources used during research:*
- [YesMilano — 10 Major Churches](https://www.yesmilano.it/en/see-and-do/itineraries/10-major-churches-milano)
- [Sant'Eustorgio & Three Magi](https://www.yesmilano.it/en/see-and-do/venues/basilica-di-santeustorgio)
- [Three Kings in Milan — ilcentro.net](https://ilcentro.net/the-three-kings-in-milan-santeustorgio-the-relics-of-the-magi-and-an-ancient-epiphany-tradition/)
- [Wikipedia — Relic](https://en.wikipedia.org/wiki/Relic)
- [Wikipedia — Basilica of Sant'Eustorgio](https://en.wikipedia.org/wiki/Basilica_of_Sant'Eustorgio)
- [Rito della Nivola](https://en.wikipedia.org/wiki/Rito_della_Nivola)
