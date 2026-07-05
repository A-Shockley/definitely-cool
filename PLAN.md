# Plant Tracker v2 — Review, Research & Plan

*Date: July 2026*

---

## Part 1: Review of the Current App

### What exists today

Two versions live in this repository:

1. **React app** (`src/`, ~1,000 lines) — the main app. Add/edit/delete plants, set a
   watering frequency in days, click "Water" to log a watering, color-coded status
   (overdue / today / upcoming), search, and filters. Data saved in browser
   `localStorage`.
2. **Standalone HTML file** (`plant-tracker-standalone.html`) — a simplified single-file
   copy created as a workaround when the dev-server preview couldn't be reached. It has
   fewer features than the React app (no edit, no light/notes display) and its code has
   already drifted from the React version.

### What works well

- Clean, simple data model that's easy to extend
- The core loop (add plant → set frequency → tap Water → see status) is sound
- Good visual status system (the color-coded "needs water" indicators)
- No accounts, no server, no subscription — data stays on your device

### Gaps and problems found

| # | Issue | Impact |
|---|-------|--------|
| 1 | **No way to actually view the app** — the dev server runs inside Claude Code's cloud environment, which a Windows browser can't reach | This blocked all use so far. Fixed by deploying to GitHub Pages (see plan). |
| 2 | **No built-in plant knowledge** — you must know and type every plant's watering needs yourself | The #1 requested improvement (info cards) |
| 3 | **Only the last watering is stored** — each watering overwrites the previous date, so there's no history | Can't see patterns or export a care log |
| 4 | **No photos** | Requested feature |
| 5 | **No export/backup** — data lives only in one browser's localStorage; clearing browser data deletes everything silently | Requested feature; also a real data-loss risk |
| 6 | **Two diverging codebases** (React + standalone HTML) | Maintenance trap — every fix must be made twice |
| 7 | Watering is the only tracked task — no fertilizing, repotting, misting | Nice-to-have (top complaint about the "Greg" app) |
| 8 | Day-boundary math compares full timestamps, so "water today" can flip depending on time of day | Minor bug |

---

## Part 2: Research Findings

### A. What makes plant apps succeed or fail (Planta, Greg, Vera, Gardenia, Waterbug, Happy Plant, Plant Parent, PictureThis)

**Features users actually value most:**
1. A single **"Today" list** of what needs water *right now*, overdue items on top
   (the beloved Waterbug pattern — one screen, sorted by thirst)
2. **Snooze / skip / watered-late** controls — users hate rigid schedules; being unable
   to log a late watering or edit a past date is a top complaint about competitors
3. **Fast plant add** — name + photo + interval in under a minute (Greg's strength)
4. **Per-species care cards** (water, light, soil, humidity, pet toxicity) attached to
   each plant, with per-plant overrides
5. **Photo journal / growth timeline** — Happy Plant's "photo at each watering →
   time-lapse" is a genuinely loved mechanic
6. **Room/location grouping** — essential at dozens of plants to batch chores
7. Secondary tasks: fertilize, repot, rotate (absence is Greg's #1 complaint)

**What to deliberately skip (bloat users complain about):** social feeds, points/
gamification, community forums, AI plant diagnosis, weather widgets, light meters,
and above all subscriptions/paywalls (the single biggest complaint across every app).

**Export is a genuine differentiator:** Planta, Greg, Gardenia, PictureThis, and
Waterbug offer **no export at all**. When Vera by Bloomscape shut down in 2024, users
lost years of care history with no way to save it. Almost nobody does this well —
our app doing it is a real advantage, and it protects your data.

### B. Plant care data

A curated care database of **~30 common houseplants** was researched and verified
against university extension guidance, The Sill, Bloomscape, and ASPCA toxicity lists.
It covers six categories (trailing/vining, statement foliage, low-light, humidity-loving,
succulents & cacti, other popular) with, for each plant:

- Common + botanical name, and popular varieties (e.g., Pothos: Golden, Marble Queen, Neon)
- Watering interval, **summer vs. winter** (plants need less water in winter)
- Light, humidity, soil type, difficulty level
- Pet toxicity (per ASPCA)
- 1–2 key care tips (e.g., "Calathea: use distilled water — tap water browns the edges";
  "Snake plant: root rot from overwatering is the #1 killer")

Full researched table is in the appendix below — it becomes the app's built-in database.

**External plant APIs evaluated:** Perenual (best maintained, free tier limited to
100 requests/day), House Plants API (lightweight, ~300 species), Trefle (unmaintained),
OpenFarm (shut down 2025). **Decision: bundle our own curated JSON database instead of
depending on an API** — no rate limits, no downtime, works offline, and 30 well-curated
species beats 10,000 generic ones for a personal collection.

---

## Part 3: The Plan — Update, Don't Rewrite

**Recommendation: evolve the existing React app.** The foundation is solid and small
(~1,000 lines); a rewrite would throw away working code for no benefit. The standalone
HTML file should be **retired** once the app is deployed properly (issue #6).

### Phase 0 — Deploy it so you can finally use it *(do first, highest value)*

Set up **GitHub Pages** with an automatic deployment (GitHub Action). After this:

- Every push publishes the app to a real URL like
  `https://a-shockley.github.io/definitely-cool/`
- You open that URL **in Edge on your Windows machine like any normal website** —
  no dev server, no ports, no Claude Code preview needed
- It's free, and it's also installable to your phone's home screen later (Phase 4)

This directly fixes the problem that blocked every previous session.

### Phase 1 — Plant care database + info cards

1. Create `src/data/plantDatabase.js` with the ~30 researched species (appendix)
2. **Species picker in the Add Plant form**: start typing "pothos" → pick from the list →
   watering frequency, light, soil, humidity, toxicity, and tips **auto-fill**
   (all still editable — your home is not a lab; defaults are starting points)
3. **Care info card** on each plant: expandable card showing the species profile —
   watering guidance, light, humidity, soil, ☠️ pet-toxicity badge, difficulty, care tips
4. **Seasonal watering**: store summer and winter intervals; the app uses the right one
   automatically based on the month
5. A browsable **"Plant Library"** page listing all 30 species by category, so it doubles
   as a reference guide even for plants you don't own yet
6. "Custom plant" remains fully supported for anything not in the database

### Phase 2 — Photos

1. **Add photos from your phone/computer** via a simple file picker (`<input type="file">`
   — on a phone this automatically offers the camera)
2. Photos are **resized/compressed in the browser** (max ~1200px, JPEG) before saving
3. Stored in **IndexedDB** (a bigger browser database than localStorage — localStorage's
   ~5 MB cap would fill up after a handful of photos; IndexedDB comfortably holds
   hundreds)
4. Each plant gets a **cover photo** on its card plus a **photo timeline** (date-stamped
   gallery) so you can watch growth over time

### Phase 3 — Care history + export ("the Plant Binder")

1. **Care log**: every watering appends to a history list instead of overwriting one
   date; add "watered late" (pick the actual date) and "snooze 2 days" buttons
2. **Export options** (all generated in the browser, no server):
   - **JSON backup** — one click downloads a complete backup file; an **Import** button
     restores it. This is your safety net and lets you move data between devices.
   - **Plant Binder (printable document)** — generates a clean, print-formatted page with
     every plant: photo, care card, location, and watering history. Use the browser's
     *Print → Save as PDF* to get a polished PDF document you can keep or share.
   - **CSV export** — plants + watering history as a spreadsheet.
3. Gentle **backup reminder** ("It's been 30 days since your last backup") since
   browser storage can be cleared

### Phase 4 — Quality of life (later, as desired)

- **Rooms view**: group the Today list by location so you water room-by-room
- Additional task types: fertilize / repot / rotate, each with its own interval
- **PWA** (installable web app): add to phone home screen, works offline
- Browser notifications for watering day
- Archive (for plants that didn't make it 🪦) rather than delete, preserving history

### Technical notes

- Stack unchanged: React + Vite, no backend, no accounts, no cost
- Data: plant records stay in localStorage (small, fast); photos go to IndexedDB
- New files: `src/data/plantDatabase.js`, `src/utils/photoStorage.js`,
  `src/utils/exportUtils.js`, components for `CareCard`, `PhotoGallery`, `PlantLibrary`,
  `TodayView`
- One-time migration converts existing `lastWatered` into the first history entry
- Fix the day-boundary bug by comparing calendar dates, not timestamps
- Delete `plant-tracker-standalone.html` once GitHub Pages is confirmed working

### Suggested order & rough effort

| Phase | What you get | Effort |
|-------|--------------|--------|
| 0 | A URL you can open in Edge today | Small — one session |
| 1 | Species picker + care info cards + plant library | Medium — one session |
| 2 | Photos with growth timeline | Medium — one session |
| 3 | History, JSON backup, printable Plant Binder, CSV | Medium — one session |
| 4 | Rooms, fertilizing, PWA, notifications | As-desired increments |

---

## Appendix: Curated Plant Care Database (researched July 2026)

Light: L=low · M=medium · BI=bright indirect · DS=direct sun. Toxicity per ASPCA
(toxic to cats/dogs). Watering shown as summer / winter starting points — always
check the soil first.

### Trailing / Vining
| Plant | Botanical | Water | Light | Humidity | Soil | Toxic | Difficulty | Tips |
|---|---|---|---|---|---|---|---|---|
| Pothos (Golden, Marble Queen, Neon, Jade) | Epipremnum aureum | 7–10d / 10–14d | L–BI | avg | well-draining | Yes | Easy | Very forgiving; let top 2" dry. Yellow leaves = overwatering. |
| Heartleaf Philodendron (also Brasil, Micans) | Philodendron hederaceum | 7–10d / 10–14d | L–BI | avg–high | rich, well-draining | Yes | Easy | Nearly identical care to pothos; trails or climbs. |
| English Ivy | Hedera helix | 5–7d / 7–10d | M–BI | avg–high | well-draining | Yes | Moderate | Prone to spider mites; likes cooler temps. |
| String of Pearls | Curio rowleyanus | 10–14d / 14–21d | BI–DS | low | cactus mix | Yes | Moderate | Shriveled pearls = thirsty; mushy = overwatered. |
| Hoya (carnosa, Krimson Queen, kerrii) | Hoya spp. | 10–14d / 14–21d | BI | avg–high | chunky, airy mix | No | Easy | Don't cut spent flower spurs — it reblooms on them. |

### Statement Foliage
| Plant | Botanical | Water | Light | Humidity | Soil | Toxic | Difficulty | Tips |
|---|---|---|---|---|---|---|---|---|
| Monstera (deliciosa, adansonii) | Monstera deliciosa | 7–10d / 10–14d | BI | avg–high | rich, well-draining | Yes | Easy–Mod | Give it a moss pole for split leaves; wipe leaves. |
| Fiddle Leaf Fig | Ficus lyrata | 7–10d / 10–14d | BI (bright) | avg | well-draining | Yes | Hard | Hates being moved and drafts; brown spots from inconsistent watering. |
| Rubber Plant | Ficus elastica | 7–10d / 10–14d | M–BI | avg | well-draining | Yes | Easy–Mod | Dust the leaves; drooping = thirsty. |
| Bird of Paradise | Strelitzia reginae | 7d / 10–14d | BI–DS | avg–high | rich, well-draining | Yes | Moderate | Needs lots of light; rarely blooms indoors. |
| Alocasia (Polly, Zebrina) | Alocasia spp. | 5–7d / 7–10d | BI | high | airy, chunky | Yes | Hard | May go dormant in winter; hates soggy roots + dry air. |
| Croton (Petra) | Codiaeum variegatum | 7d / 10d | BI–DS | high | well-draining | Yes | Moderate | Drops leaves when stressed/moved; needs bright light for color. |
| Dracaena marginata | Dracaena marginata | 10–14d / 14d | M–BI | avg | well-draining | Yes | Easy | Fluoride-sensitive — filtered water prevents brown tips. |

### Low-Light / Nearly Indestructible
| Plant | Botanical | Water | Light | Humidity | Soil | Toxic | Difficulty | Tips |
|---|---|---|---|---|---|---|---|---|
| Snake Plant (Laurentii, Zeylanica, Moonshine) | Dracaena trifasciata | 14–21d / 21–30d | L–BI | low | cactus mix | Yes | Easy | Root rot from overwatering is the #1 killer — when in doubt, wait. |
| ZZ Plant | Zamioculcas zamiifolia | 14–21d / 21–30d | L–BI | low | well-draining | Yes | Easy | Rhizomes store water; thrives on neglect. |
| Chinese Evergreen (Silver Bay, Red Siam) | Aglaonema spp. | 7–10d / 10–14d | L–M | avg | well-draining | Yes | Easy | Green varieties tolerate lower light than pink/red ones. |
| Parlor Palm | Chamaedorea elegans | 7–10d / 10–14d | L–M | avg–high | well-draining | No | Easy | Pet-safe; watch for overwatering and spider mites. |
| Peace Lily | Spathiphyllum | 5–7d / 7–10d | L–M | high | rich, moist mix | Yes | Easy | Droops dramatically when thirsty, recovers fast; tap water browns tips. |

### Humidity-Loving / Fussy
| Plant | Botanical | Water | Light | Humidity | Soil | Toxic | Difficulty | Tips |
|---|---|---|---|---|---|---|---|---|
| Calathea (orbifolia, medallion, White Fusion) | Goeppertia spp. | 5–7d, evenly moist | M–BI | high | rich, peaty | No | Hard | Use distilled/rain water — tap water crisps the edges. |
| Maranta (Prayer Plant) | Maranta leuconeura | 5–7d | M–BI | high | rich, peaty | No | Moderate | Leaves fold up at night; same water sensitivity as Calathea. |
| Boston Fern | Nephrolepis exaltata | 3–5d, never dry | M–BI | high | rich, moist | No | Moderate | Constant moisture + humidity or it browns fast. |
| Anthurium | Anthurium andraeanum | 7d / 10d | BI | high | airy, orchid-like | Yes | Moderate | Long bloomer; wants bright indirect light and humidity. |
| African Violet | Streptocarpus sect. Saintpaulia | 7d, bottom-water | M–BI | avg | light, peaty | No | Moderate | Water from below; cold water on leaves causes spots. |
| Nerve Plant | Fittonia | 3–5d | M–BI | high | peaty | No | Moderate | "Faints" dramatically when dry, revives after watering. |

### Succulents & Cacti
| Plant | Botanical | Water | Light | Humidity | Soil | Toxic | Difficulty | Tips |
|---|---|---|---|---|---|---|---|---|
| Aloe Vera | Aloe barbadensis | 14–21d / 21–30d | BI–DS | low | cactus mix | Yes | Easy | Deep, infrequent watering; mushy leaves = overwatered. |
| Jade Plant | Crassula ovata | 14–21d / 21–30d | BI–DS | low | cactus mix | Yes | Easy | Wrinkled leaves = thirsty; wants bright light. |
| Echeveria / rosette succulents | Echeveria spp. | 10–14d / 21d | DS | low | gritty cactus mix | No (most) | Easy | Stretching means too little light. |
| Cacti | Cactaceae | 14–21d / 28d+ | DS | low | gritty cactus mix | No (most) | Easy | A dry, cool winter rest encourages blooming. |
| Peperomia | Peperomia spp. | 7–10d / 14d | M–BI | avg | airy, well-draining | No | Easy | Semi-succulent leaves; tolerant and pet-safe. |

### Other Popular
| Plant | Botanical | Water | Light | Humidity | Soil | Toxic | Difficulty | Tips |
|---|---|---|---|---|---|---|---|---|
| Spider Plant | Chlorophytum comosum | 7d / 10–14d | M–BI | avg | well-draining | No | Easy | Brown tips from fluoride/salts; makes baby "pups." |
| Orchid | Phalaenopsis spp. | 7d, soak & drain | BI | avg–high | bark mix (no soil) | No | Moderate | Never let roots sit in water; skip the ice-cube trick. |
| Bromeliad | e.g. Guzmania | fill central cup, soil ~7d | M–BI | high | fast-draining | No | Easy | Keep water in the central "tank"; blooms once, then makes pups. |
| Air Plant | Tillandsia spp. | soak 20–30 min weekly | BI | avg–high | none | No | Easy | Dry fully upside-down after soaking to prevent rot. |

*Toxicity note: some genera vary by species — for certainty on a specific plant,
check the ASPCA toxic/non-toxic plant lists (aspca.org).*
