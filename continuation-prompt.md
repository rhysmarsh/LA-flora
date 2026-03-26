# LA County Field Guide Suite — Continuation Prompt

## Context

I'm building a suite of self-contained PWA field guides to the natural history of Los Angeles County. Three guides are live; more are planned. All share the same architecture, branding, and iNat API integration pattern. This prompt provides the context needed to:

1. **Sync features between Plant Guide and Invertebrate Guide (labugs.org v3.019, 3,439 species)**
2. **Create new guides** (next: la-fauna.org vertebrate guide) using the Plant Guide v3.011 as the template
3. **Maintain and expand existing guides** — cross-link ecosystem now spans 4 guide domains + All About Birds
4. **Backport cross-link features** to labugs.org and lafungi.org

---

## Architecture (shared across all guides)

Single-file PWA for most guides. **Plant Guide v3+ uses two-file architecture** with externalized SPECIES_DATA for scale.

- **Photos**: fetched from iNat `/taxa/autocomplete`, cached in IndexedDB (persistent across sessions)
- **Life list**: iNat `species_counts` API with `place_id=962` (LA County)
- **Maps**: ESRI satellite tiles + iNat observation overlay, bounds `[[33.70,-118.95],[34.82,-117.65]]`
- **Fonts**: EB Garamond (serif) + DM Sans (sans-serif) via Google Fonts
- **Branding**: dark forest green `#1A3C35`, muted gold `#BFA46E`, warm cream `#FAF8F4`
- **SW cache**: `{guide-name}-v{version}`
- **Deploy**: Netlify drag-and-drop zip (index.html, sw.js, manifest.json, _headers, _redirects, icons/, and species-data.json for v3+ guides)
- **File size**: Single-file architecture scales to ~600KB before performance concerns. Fungi guide reached 594KB at 567 species. Plant guide exceeded this at 824 species, triggering v3 migration.

### v3 Two-File Architecture (Plant Guide v3.011+)
```
index.html          — 81 KB (CSS + JS code + config objects + filters + cross-links)
species-data.json   — 830 KB (all SPECIES_DATA, loaded async)
sw.js               — 1 KB (network-first + cache-fallback)
icons/              — 5 production icons (128, 180, 192, 512, 1024px)
```
**Why v3**: At 824 species (591 KB single-file), the plant guide hit the performance ceiling. Externalizing SPECIES_DATA to a separate JSON file:
- Drops index.html to 68 KB (532 KB headroom for code features)
- Allows species-data.json to grow to 2-5 MB+ (3,000-8,000 species)
- SW caches both files for offline use
- Loading overlay with branded spinner during async data fetch
- Graceful error handling with cache fallback if network fails

**Init chain (v3.011)**:
```
loadState() → register SW → loadSpeciesData() → [hydrateCache() → render() → checkDeepLink()] + fetchLL()
```
SW registers first so its cache is available as fallback for `loadSpeciesData()`.

**Deep-link support (bidirectional with labugs v3.019)**:
- `?species=Scientific+name` — preferred format (used by both guides)
- `#species/Scientific_name` — legacy hash format (labugs also sends this)
- `checkDeepLink()` checks both URLSearchParams and location.hash on init
- `findAndOpenSpecies(query)` handles `+` and `_` as space, case-insensitive

**When to migrate other guides to v3**: When they exceed ~550 KB. Fungi (594 KB) is a candidate. Labugs (537 KB) is approaching. The migration script is reusable.

### CRITICAL BUILD LESSONS (from Plant + Fungi builds)

**1. Never use regex replace on script blocks:**
```python
# WRONG — causes HTML duplication and backtick corruption
html.replace(/<script>[\s\S]*?<\/script>/, ...)

# RIGHT — find largest script block by index
scripts = list(re.finditer(r'<script>([\s\S]*?)</script>', html))
main = max(scripts, key=lambda m: len(m.group(1)))
js = main.group(1)
# ... modify js ...
html_new = html[:main.start()] + '<script>' + js + '</script>' + html[main.end():]
```

**2. activeTaxon initialization:**
Template has `activeTaxon:'wildflowers'`. MUST change to the first taxa group key for each new guide (e.g., `'agarics'` for fungi, `'lizards'` for herps). Failure causes blank first load with no photos — the render chain produces an empty species list when the key doesn't exist in SPECIES_DATA.

**3. Structural validation — backticks only:**
Brace/paren/bracket counting is unreliable because JSON string values contain `()` `{}` `[]` characters (e.g., "(PSK)" in hp text). Only backtick count is a reliable structural test for template literal integrity. Use `json.loads()` / `json.dumps()` for data validation.

**4. Species group placement requires rules:**
The fungi build had 17 species misplaced (stinkhorns in agarics, boletes in agarics, polypores in agarics). Each guide needs explicit group-assignment rules. For herps: snakes vs lizards, frogs vs salamanders, turtles vs tortoises.

**5. Filter slot is guide-specific:**
The plant guide uses an endemic filter. Fungi replaced it with an edibility filter (endemic was useless — 1 species). Each guide should evaluate what filter is most useful for its taxa: venomous (herps), migratory (birds), native/introduced (all).

**6. Scientific name verification is mandatory:**
The fungi build found 3 duplicates from obsolete synonyms (*G. autumnalis* = *G. marginata*, *O. olearius* = *O. olivascens*, *P. mutabilis* = *K. mutabilis*). All scientific names must be verified against iNat current taxonomy before publish.

**7. Gray family color defaults (#999) cause multiple cleanup rounds:**
Assign real colors immediately when adding new families. Never use #999 as a placeholder.

**8. INTRO_SET must sync with species `intro` flags:**
Easy to forget. Verify after every species addition round.

**9. README drifts fast:**
README showed 256 species when guide had 497. Either update README with every expansion round or generate stats programmatically.

**10. NEVER use lazy regex to extract/replace SPECIES_DATA:**
The pattern `r'const SPECIES_DATA=(\{.*?\});\s'` with `re.DOTALL` can match a `};` inside a JSON string value (e.g., a description containing `"...};"`), causing the replacement to capture only part of the data and leave an orphaned JSON fragment that breaks the JS. This caused a production-breaking bug in the fungi guide (blank page, no render). Also, `json.dumps()` output can clobber adjacent code if the regex match boundaries are wrong — the `APG_IDX` builder `forEach((f,i)=>APG_IDX[f]=i)` was eaten by a SPECIES_DATA replacement. **Always use brace-depth counting with string awareness:**
```python
# Find the opening brace after 'const SPECIES_DATA='
start = js.find('const SPECIES_DATA=') + len('const SPECIES_DATA=')
depth = 0; in_str = False; esc = False
for i in range(start, len(js)):
    c = js[i]
    if esc: esc = False; continue
    if c == '\\' and in_str: esc = True; continue
    if c == '"' and not esc: in_str = not in_str; continue
    if in_str: continue
    if c == '{': depth += 1
    elif c == '}':
        depth -= 1
        if depth == 0:
            sd_json = js[start:i+1]  # complete JSON object
            break
```

### Species Data Schema (universal)
```javascript
{
  id: 'wil_0001',               // {taxon_prefix}_{number}
  cn: 'California Poppy',       // Common name
  sn: 'Eschscholzia californica', // Scientific name (must match iNat current taxonomy)
  fam: 'Papaveraceae',          // Family — must match familyColors key
  st: 'common',                 // common|uncommon|rare|endangered|vagrant|extirpated|historical
  dur: 'annual',                // Duration/trophic/activity (guide-specific values)
  desc: '...',                  // Description 50-300 chars
  elev: 'low,foot',             // coast|low|foot|mid|high|wide
  mo: [2,3,4,5,6,7],           // Active/bloom/flight/fruiting months
  pk: [3,4,5],                  // Peak months (must be subset of mo)
  fm: {                         // Field marks (key-value, guide-specific)
    vs: '...',                  // Differentiation from similar species
  },
  hp: '...',                    // Ecological associations (target: 100% coverage)
  end: 'CA',                    // Optional endemic tag: CA|SoCal|Channel Islands|CA/Baja
  intro: true,                  // Non-native flag (optional)
  ssp: true,                    // Subspecies — excluded from headline counts (optional)
  // Guide-specific fields:
  ipc: 'High',                  // Cal-IPC rating (plants only)
  edibility: 'toxic',           // edible|edible-caution|inedible|toxic|deadly (fungi only)
  venomous: true,               // Venomous flag (herps only)
}
```

### SEO Template (apply to ALL new guides from the start)
```html
<meta name="description" content="{keyword-rich, species count, key features}">
<meta property="og:url" content="https://{domain}">
<meta property="og:type" content="website">
<meta property="og:title" content="{Guide Name} — {N} Species">
<meta property="og:description" content="{concise feature summary}">
<meta property="og:image" content="https://{domain}/icon-512.png">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#1A3C35">
<meta name="robots" content="index, follow">
<meta name="author" content="Rhys Marsh">
<meta name="keywords" content="{guide-specific keywords}">
<link rel="canonical" href="https://{domain}">
<script type="application/ld+json">{ WebApplication schema }</script>
```

### Cross-Reference Verification (pre-publish, ALL guides)
1. **Scientific name currency** — verify all names against iNat current taxonomy. Flag obsolete synonyms.
2. **LA County occurrence** — verify each species has iNat observations in place_id=962. Flag zero-observation species.
3. **Index Fungorum / ITIS / iNat alignment** — verify accepted names match nomenclatural authorities.
4. **Safety classification cross-reference** — for guides with safety implications (fungi edibility, herps venomous), verify against primary references and NAMA/poison control data.
5. **NAME_ALIASES for reclassifications** — add bidirectional aliases for recently reclassified taxa to maintain life list matching.

### Cross-Guide Linking
For taxa that overlap between guides (e.g., lichens in both flora and fungi), add a cross-reference note rather than duplicating. Pattern: brief note in guide body + link to companion guide.

---

## Guide 1: LA County Invertebrate Field Guide (labugs.org)

**Status**: v3.019 — deploy-ready, 3,439 species
**Species**: 3,439 (3,434 main + 5 ssp) across 15 taxa groups
**Architecture**: Multi-file split (index.html 74 KB + 15 data/*.json files = 1,381 KB total)
**IDB name**: `invertGuidePhotos`
**SW cache**: `la-bugs-guide-v3.019`
**GitHub**: https://github.com/rhysmarsh/LA-bugs

### Key Metrics
- **3,439 species** | 100% enriched descriptions (all ≥80 chars, zero templates)
- **587 cross-links** to la-flora.org via `xlink` field in species data
- **Deep-link support**: `?species=` (preferred) and `#species/` (legacy hash)
- **Origin tracking**: `INTRO_SET` (317) + `INVASIVE_SET` (62) + `ENDEMIC_SET` (48) as separate Sets
- **Multi-file data**: 15 per-group JSON files loaded in parallel for progressive rendering
- **Taxa bar order**: butterflies → moths → beetles → dragonflies → nativeBees → arachnids → wasps → trueBugs → flies → orthoptera → hoverflies → snails → bumblebees → myriapods → isopods

### Key Architecture Differences from Plant Guide
| Feature | Plant (la-flora.org) | Invertebrate (labugs.org) |
|---|---|---|
| Data files | 1 (species-data.json) | 15 (data/{group}.json) |
| Origin tracking | `est` field per species | 3 separate Set objects |
| Outbound cross-links | Regex maps in `rHP()` | `xlink` field in data + `rXL()` |
| Badge layout | `.badge-col` flex column | Inline positioned |
| SW pattern | Network-first | Cache-first |

### Sync Opportunities (bidirectional)
**Plant → Bugs patterns to adopt**:
1. `.badge-col` flex column for stacking badges
2. Network-first SW (better for updates)
3. Production icons at all 5 sizes (labugs has only 3)

**Bugs → Plant patterns to adopt**:
1. `xlink` field in data (more maintainable than regex maps at scale)
2. `ENDEMIC_SET` as separate Set (cleaner than mixing with est field)
3. Multi-file split (if plant guide exceeds ~3,000 species)
4. 4-button origin filter (Native/Introduced/Invasive/Endemic — plant guide already has this)

---

## Guide 2: LA County Plant, Moss & Lichen Field Guide (la-flora.org)

**Status**: v3.011 — deploy-ready, 23/23 audit checks passed, production icons installed
**Species**: 1,476 across 10 taxa groups (533 wildflowers, 105 trees, 391 shrubs, 163 grasses, 46 ferns, 35 cacti, 16 vines, 34 aquatic, 26 mosses, 128 lichens)
**Architecture**: v3 two-file (index.html 81 KB + species-data.json 830 KB)
**IDB name**: `plantGuidePhotos`
**SW cache**: `la-plant-guide-v3.011`
**GitHub**: https://github.com/rhysmarsh/LA-flora
**License**: GPL v3 + disclaimer

This is the **template source** for all new guides. Fork v3.011 and adapt.

### Key Metrics
- **1,476 species** (1,473 main + 3 ssp) | 10 taxa groups | v3 two-file architecture
- **100% hp ecological association coverage** (1,476/1,476) — all species-specific, zero template notes
- **100% est field coverage** — every species tagged native/introduced/invasive
- **Full SEO** — JSON-LD WebApplication schema, OG tags, canonical, keywords, author, robots
- **Cross-guide ecosystem** — links to 4 external resources: labugs.org (invertebrates), allaboutbirds.org (birds/Merlin), la-fauna.org (vertebrates), lafungi.org (fungi). 146 link map entries total. 1,087 plants link to labugs, 249 to birds, 34 to fauna, 57 to fungi
- **Deep-link URL support** — `?species=Scientific+name` opens directly to detail sheet
- **Cross-guide footer nav** to labugs.org and lafungi.org
- **Search debounce** (150ms) for performance on large species lists
- **Async data loading** with branded loading overlay and cache fallback
- **Network-first SW** — caches index.html + species-data.json + all 5 icon sizes for offline use
- **CONSERVATION object** with CNPS/ESA/CESA badges for 38+ rare/endangered species
- **INTRO_SET** for 420 introduced species with Cal-IPC ratings where applicable
- **INV/INTRO badges on photo cards** — red `⚠ INV` or orange `INTRO` pill on cards, stacked via `.badge-col` flex column
- **Production app icons** — custom botanical field guide icon at 128, 180, 192, 512, 1024px

### Coverage Analysis (iNat gap audit verified, ≥2 RG obs)
Full audit run 2026-03-25: 908 research-grade species queried, 1,476 in guide.
- **Wildflowers**: 533 — good coverage (Fabaceae, Convolvulaceae, Solanaceae well represented)
- **Trees**: 105 — comprehensive (native + major introduced, 3 rescued from wildflowers)
- **Shrubs**: 391 — comprehensive (includes many Asteraceae species)
- **Grasses**: 163 — good coverage (Poaceae, Cyperaceae, Juncaceae)
- **Ferns**: 46 — comprehensive
- **Cacti**: 35 — comprehensive
- **Lichens**: 128 — good coverage
- **Aquatic**: 34 — moderate (not all queried by gap finder)
- **Mosses**: 26 — moderate (fewer iNat observations for this group)
- **Vines**: 16 — moderate (not all queried by gap finder)

**Establishment breakdown**: 1,056 native / 371 introduced / 50 invasive
**species-data.json**: 830 KB — capacity for ~3,200 spp at 2 MB

### Plant Guide-Specific Build Notes
- `activeTaxon:'wildflowers'` — the default first-load group
- `INTRO_SET` — non-native species set (no `INVASIVE_SET` — unlike labugs)
- `CONSERVATION` object — CNPS/ESA/CESA conservation badges
- Badges: `renderDurBadge`, `renderEndemicBadge`, `renderIpcBadge`, `renderEstBadge`
- **Filter layout**: two-row compact design — Row 1: All/Common/Uncommon/Rare/Endangered (+Seen/Unseen when logged in); Row 2: Native/Intro/Invasive/Endemic. Zero-height div forces the line break.
- `NAME_ALIASES` — bidirectional iNat reclassification mapping (Pennisetum↔Cenchrus, Cheilanthes↔Myriopteris, Piperia↔Platanthera + others)
- Cross-taxon search: queries across all 10 groups when no match in active group
- **Establishment filter**: Native / Introduced / Invasive toggle buttons in filter bar
- `est` field on every species: `'native'` | `'introduced'` | `'invasive'`
- `renderEstBadge()` renders orange (intro) or red (invasive) badge on detail sheet
- **INV/INTRO badges on photo cards**: `.badge-col` flex column stacks establishment pill above rarity pip (top-left), observed ✓ stays top-right. CSS: `.inv-pill` (red), `.intro-pill` (orange), `.badge-col` (flex column container)
- **Cross-guide deep links to labugs.org**: `rHP()` replaces 38 butterfly/moth species names and ~15 bee/moth group terms with clickable `<a>` links. Species links use `?species=Scientific+name` deep-link format. Group links use `#groupKey` hash format. 465 plant species (32%) have at least one cross-link.
- **Deep-link URL parser**: `findAndOpenSpecies(query)` searches all taxa groups by SN or CN, switches group, opens detail sheet. Triggered on init via `URLSearchParams`. This is the inbound handler — labugs needs the same function added to receive links from la-flora.org.
- **Taxa bar PWA fix (v3.011)**: `top: calc(-1 * env(safe-area-inset-top)); padding-top: env(safe-area-inset-top)` — the negative top offset matches the padding, so in flow the padding area overlaps with the preceding header (no visible gap). When stuck, the bar pins at `top: -47px` (on notch iPhone), which means the 47px padding area slides behind the status bar while tab content (emoji + labels) sits at the visible edge. This is the cleanest pattern for safe-area-aware sticky headers — no gap on initial load, seamless notch coverage when scrolled.
- **Intro mark / badge font fix**: `.intro-mark`, `.inv-pill`, `.intro-pill` all use `font-family:var(--fb);font-style:normal` to prevent italic serif inheritance from `.csn`

### Taxonomy Scrub (v3.011)
Resolved during pre-publish audit:
- **3 duplicates removed**: Pennisetum setaceum (=Cenchrus setaceus), Cheilanthes newberryi (=Myriopteris newberryi), Piperia cooperi (=Platanthera cooperi)
- **1 duplicate removed**: Cenchrus clandestinus (renamed from Pennisetum clandestinum, collided with existing entry from gap audit)
- **3 trees rescued from wildflowers**: Robinia pseudoacacia, Erythrina afra, Gleditsia triacanthos
- **8 Cal-IPC High species fixed**: Delairea odorata (Cape Ivy), Oxalis pes-caprae, Cynara cardunculus, Lepidium latifolium, Genista monspessulana, Spartium junceum, Centaurea stoebe, Cenchrus setaceus — all upgraded from `est:'introduced'` to `est:'invasive'`
- **15 genus-only common names fixed** (e.g., "Heterotheca sp." → "Erect Goldenaster")
- **1 false ssp flag removed**: Senecio lyonii
- **Q. agrifolia var. oxyadenia**: ssp flag and ID corrected

---

## Guide 3: LA County Fungi Field Guide (la-fungi.org)

**Status**: v2.004 — deploy-ready, 23/23 audit checks passed
**Species**: 567 across 10 taxa groups
**IDB name**: `fungiGuidePhotos`
**SW cache**: `la-fungi-guide-v2.004`
**GitHub**: https://github.com/rhysmarsh/LA-fungi
**License**: GPL v3 + disclaimer
**iNat taxon IDs**: 47170 (Fungi), 47685 (Slime Molds) | place_id: 962

### Taxa Groups (10)
```
🍄 Agarics (245) | 🪵 Polypores (61) | 🌰 Boletes (34) | 🪸 Coral & Club (23)
☁️ Puffballs (29) | 🍽️ Cup Fungi (37) | 🧫 Crust Fungi (27) | 🫧 Jelly Fungi (22)
🦠 Slime Molds (23) | 🔬 Ascomycetes (66)
```

### Key Metrics
- **567 species** | 310 genera | 140 families | 594KB
- **10 deadly** | 53 toxic | 99 caution | 111 edible | 294 inedible
- **0 edible/caution species without vs notes** (318 total vs notes)
- **100% hp ecological association coverage** (567/567)
- **Full SEO** — JSON-LD, OG tags, canonical, keywords, structured data
- **All 23 audit checks passed**
- **Edibility filter** verified functional (was broken in initial template fork — plant guide endemic logic)
- **isO life list matching** enhanced with NAME_ALIASES for reclassified taxa

### Fungi-Specific Schema Adaptations
```javascript
{
  dur: 'saprobic',          // saprobic|mycorrhizal|parasitic|lichenized (replaces plant dur)
  edibility: 'toxic',       // edible|edible-caution|inedible|toxic|deadly (NEW field)
  fm: { Cap, Gills, Stem, Spore_Print, Odor, Habitat, Substrate, vs, Edibility, Ecology }
}
```

### Fungi Build Decisions (precedent for future guides)
- **Lichens excluded** — covered in la-flora.org. Cross-reference note added.
- **Psilocybin species included** as `edibility:"toxic"` with factual legal notes (standard field guide practice per Desjardin/Arora).
- **Endemic filter replaced** with edibility filter (only 1 endemic fungal species in LA County).
- **Stinkhorns, bird's nests, puffball-like fungi** moved from agarics to puffballs (gasteroid fungi).
- **Gomphidiaceae** moved from agarics to boletes.
- **Practical species ceiling**: ~500-600 for photo-identifiable macrofungi. Guide reached 567 at 594KB (approaching ~600KB file size ceiling).
- **Edibility filter required code fix** — plant template had endemic filter logic (`'endemic'`/`'non-endemic'`) that never matched edibility chip values (`'edible'`/`'toxic'`/`'inedible'`). Chips highlighted but species never filtered. Must verify filter logic matches chip data-attributes when adapting template.
- **isO life list matching** needed NAME_ALIASES integration — iNat reclassifications caused silent match failures.

### Fungi Backport Priority (from Plant Guide v3.011)
Features to backport from the plant guide to the fungi guide, in priority order:
1. **v3 architecture migration** — fungi at 594KB is at single-file ceiling. Migrate to species-data.json + index.html for expansion headroom. Reuse plant guide migration script.
2. **Establishment filter** — add `est` field (native/introduced) and filter UI. Most fungi are native but some (e.g., Agaricus bisporus, Coprinopsis atramentaria) are introduced. Tag all 567 species.
3. **renderEstBadge()** — port the badge function and wire into detail sheet alongside edibility badge.
4. **iNat gap audit** — build fungi-specific gap-finder tool querying taxon_id 47170 (Fungi) + 47685 (Slime Molds). Run full audit for species expansion.
5. **Search debounce** — if not already present, add 150ms debounce on search input.
6. **Network-first SW** — upgrade from cache-first to network-first + cache-fallback (v3 pattern).
7. **hp quality audit** — verify all 567 hp notes are species-specific. Re-run the enhancement methodology used for plant guide.

### Fungi Sources
Desjardin/Wood/Stevens *California Mushrooms* (2015), Arora *Mushrooms Demystified* (2nd ed.), Siegel/Schwarz *Mushrooms of the Redwood Coast* (2016), MykoWeb/CAF (mykoweb.com — 862 CA species), MushroomExpert.com (Michael Kuo), NAMA Poison Case Registry, LAMS (lamushrooms.org), iNaturalist, Index Fungorum, GBIF, Catalogue of Life

---

## Guide 4: LA County Non-Avian Vertebrates Field Guide (NEW — to create)

**Planned URL**: lawildlife.org
**Template**: Fork from Plant Guide v3.011
**IDB name**: `vertGuidePhotos`
**GitHub**: https://github.com/rhysmarsh/LA-vertebrates
**iNat taxon IDs**: 26036 (Reptilia) + 20978 (Amphibia) + 40151 (Mammalia) + 47178 (Actinopterygii, freshwater only) | place_id: 962
**Primary references**: CaliforniaHerps.com (Gary Nafis), Jameson & Peeters *Mammals of California* (2004), Moyle *Inland Fishes of California* (2002)
**Local authority**: RASCals (NHMLAC herps), LA Urban Coyote Project, Santa Monica Mountains NRA wildlife surveys

### Proposed Taxa Groups (11)
🦎 Lizards — ~20 species (Western Fence Lizard, Side-blotched, Alligator Lizards, Geckos, Skinks, Whiptails, Horned Lizards, Legless Lizards, Chuckwalla)
🐍 Snakes — ~20 species (Gopher Snake, Kingsnake, Racers, Rattlesnakes, Ring-necked, Night Snake, Rosy Boa)
🐢 Turtles & Tortoises — ~5 species (Western Pond Turtle + introduced sliders/softshells, Desert Tortoise at range edge)
🐸 Frogs & Toads — ~10 species (Pacific Treefrog, California Treefrog, Western Toad, Bullfrogs, African Clawed Frog)
🦎 Salamanders & Newts — ~5 species (Arboreal Salamander, Black-bellied Slender, Garden Slender, CA Newt, Ensatina)
🦁 Large Mammals — ~15 species (Mountain Lion, Coyote, Bobcat, Black Bear, Mule Deer, Gray Fox, Raccoon, Striped Skunk, Opossum, Ringtail)
🐿️ Small Mammals — ~25 species (CA Ground Squirrel, Woodrats, Pocket Gophers, Rabbits, Shrews, Moles, Mice, Voles)
🦇 Bats — ~15 species (Big-eared Bats, Free-tailed, Myotis, Pallid Bat, Western Red Bat — nocturnal, conservation-heavy)
🦭 Marine Mammals — ~10 species (CA Sea Lion, Harbor Seal, Gray Whale, Bottlenose Dolphin, Common Dolphin, Sea Otter — seen from shore)
🐟 Freshwater Fish — ~30 species (Santa Ana Sucker, Arroyo Chub, Unarmored Threespine Stickleback + introduced bass, carp, mosquitofish, tilapia)
🐊 Introduced Herps — ~10 species (Mediterranean Gecko, Brown Anole, Red-eared Slider, African Clawed Frog, various pet trade escapees)

### Estimated species count: ~165
Medium-sized guide — between herps-only (~70) and fungi (~567). Enough for deep per-species content: behavior, conservation, human-wildlife interaction, urban ecology.

### Schema Adaptations for Non-Avian Vertebrates
```javascript
{
  dur: 'diurnal',              // diurnal|nocturnal|crepuscular|cathemeral (replaces plant dur)
  venomous: true,              // Venomous flag (optional — rattlesnakes only)
  conservation: 'SSC',         // SSC|FE|FT|SE|ST (Species of Special Concern, ESA, CESA)
  fm: {
    Size: '...',               // Total length or weight range
    Color: '...',              // Pattern/pelage/scale description
    Habitat: '...',
    Behavior: '...',           // Basking, burrowing, arboreal, aquatic, migratory
    Diet: '...',               // Carnivore, herbivore, omnivore, insectivore
    vs: '...',                 // Confusable species — CRITICAL for rattlesnake vs gopher snake
    Venom: '...',              // Only for venomous species
    Conservation: '...',       // Threats, status, protection, recovery plans
    Urban: '...',              // Urban adaptation notes (major LA theme)
  }
}
```

### Guide-Specific Considerations
- **Venomous badges CRITICAL** — Southern Pacific Rattlesnake is the primary safety concern. Clear venomous/non-venomous distinction.
- **Activity period** (`dur`) — diurnal/nocturnal/crepuscular/cathemeral. Bats are entirely nocturnal; many mammals are crepuscular.
- **Urban wildlife is a major LA story** — Coyotes, Mountain Lions (P-22 legacy), Bobcats, Raccoons, Opossums are deeply woven into LA culture. The guide should reflect this.
- **Wildlife corridors** — Wallis Annenberg Wildlife Crossing (Liberty Canyon), 101 Freeway barrier, genetic isolation of Santa Monica Mountains mountain lion population. Major conservation theme.
- **Introduced species** — Brown Anoles, Mediterranean Geckos, Red-eared Sliders, African Clawed Frogs, American Bullfrogs (predators of native species), introduced fish displacing native Santa Ana Sucker and Arroyo Chub.
- **Conservation is the heaviest theme** across all guides — Unarmored Threespine Stickleback (FE), Desert Tortoise (FT/ST), CA Red-legged Frog (FE, extirpated from LA), Santa Ana Sucker (FT), Two-striped Garter Snake (SSC), Western Pond Turtle (SSC), Pallid Bat (SSC).
- **Marine mammals visible from shore** — Gray Whale migration (Dec-Apr), CA Sea Lions at harbors, Harbor Seals at Leo Carrillo/Point Dume, Bottlenose Dolphins in Santa Monica Bay. These are shore-observable species, not requiring a boat. Marine invertebrates/fish are a separate Marine Guide.
- **Freshwater fish** — LA's rivers and creeks (LA River, San Gabriel River, Malibu Creek, Big Tujunga) host native fish in decline and abundant introduced species. The native fish conservation story is urgent.
- **Seasonality**: reptiles year-round but peak spring-fall; amphibians rain-dependent Nov-Mar; bats year-round but most active Apr-Oct; marine mammal migrations seasonal; freshwater fish year-round.
- **Filter slot**: replace endemic/edibility with venomous filter (⚠ Venomous | 🟢 Non-venomous | All). For mammals/fish this filter shows "All" by default.

### Sources
- CaliforniaHerps.com (Gary Nafis) — definitive CA herps resource with range maps, photos, sounds
- Stebbins & McGinnis, *Field Guide to Western Reptiles and Amphibians* (4th ed., 2018)
- Jameson & Peeters, *Mammals of California* (revised ed., 2004)
- Moyle, *Inland Fishes of California* (revised ed., 2002)
- CDFW Species of Special Concern lists (amphibians, reptiles, mammals, fish)
- RASCals / NHMLAC community science project (iNaturalist)
- San Diego Natural History Museum Amphibian and Reptile Atlas (herpatlas.sdnhm.org)
- NPS Santa Monica Mountains NRA wildlife monitoring data
- LA Urban Coyote Project
- USFWS Critical Habitat designations
- iNaturalist (inaturalist.org)

---

## Future Guides (lower priority)

### LA County Bird Guide
- URL: labirds.org | iNat: 3 (Aves) | ~450+ species
- Unique: seasonal abundance bars, eBird hotspot integration, song playback links
- Schema: `migration: 'resident|winter|summer|passage|vagrant'`
- Filter slot: migratory status
- Massive species count — will push file size limits of single-file architecture

### LA County Marine Guide
- URL: lamarine.org | iNat: various
- Unique: tidal zone indicator, depth range
- Schema: `zone: 'intertidal|subtidal|pelagic|deep'`

## Guide 5: LA County Marine Life Field Guide (NEW — to create)

**Planned URL**: lamarine.org
**Template**: Fork from Plant Guide v3.011 (v3 two-file architecture — marine species count will exceed 500)
**IDB name**: `marineGuidePhotos`
**GitHub**: https://github.com/rhysmarsh/LA-marine
**iNat taxon IDs**: Multiple — 47115 (Mollusca), 47549 (Arthropoda marine subset), 47548 (Cnidaria), 47706 (Echinodermata), 47533 (Annelida), 47153 (Chordata marine fish), 48222 (Algae) | place_id: 962
**Primary references**: Hinton *Seashore Life of Southern California* (1987), Gotshall *Guide to Marine Invertebrates* (2005), Love *Certainly More Than You Want to Know About the Fishes of the Pacific Coast* (2011), Miller & Lea *Guide to the Coastal Marine Fishes of California* (1972)
**Local authority**: Cabrillo Marine Aquarium, Heal the Bay, NHMLAC Malacology, Reef Check California, SCUBA community surveys

### Proposed Taxa Groups (12)
🐚 Gastropods (Snails) — ~60 species (limpets, abalones, top shells, turbans, whelks, nudibranchs, sea hares)
🦪 Bivalves (Clams, Mussels) — ~25 species (mussels, oysters, clams, scallops, piddocks)
🦀 Crustaceans — ~40 species (shore crabs, hermit crabs, barnacles, isopods, amphipods, lobster, shrimp)
🪸 Cnidarians — ~25 species (sea anemones, hydroids, corals, jellyfish, Portuguese man-of-war)
⭐ Echinoderms — ~15 species (sea stars, urchins, sand dollars, sea cucumbers, brittle stars)
🪱 Marine Worms — ~10 species (polychaetes visible at low tide — feather dusters, sandcastle worms, tube worms)
🧽 Sponges & Tunicates — ~10 species (encrusting and upright sponges, sea squirts)
🐟 Intertidal Fish — ~20 species (gobies, blennies, sculpins, opaleye, garibaldi visible from shore)
🐙 Cephalopods — ~5 species (two-spot octopus, market squid, California brown sea hare)
🌊 Marine Algae — ~40 species (kelps, rockweeds, corallines, sea lettuce, feather boas)
🏖️ Beach & Drift — ~15 species (sand crabs, beach hoppers, by-the-wind sailors, pelagic goose barnacles, sea beans)
🐚 Chitons & Others — ~10 species (chitons, peanut worms, bryozoans)

### Estimated species count: ~275
Medium-large guide. Focus on shore-observable and low-tide-accessible species only — no SCUBA-required species. The guide is for tidepoolers, beachcombers, and pier fishers.

### Schema Adaptations for Marine Life
```javascript
{
  dur: 'year-round',          // year-round|seasonal|migratory (replaces plant dur)
  zone: 'intertidal',         // intertidal|subtidal|pelagic|beach|pier (NEW field — tidal zone)
  edibility: 'inedible',      // edible|inedible|protected|toxic (for marine species)
  fm: {
    Size: '...',               // Maximum size range
    Color: '...',              // Pattern/texture description
    Habitat: '...',            // Rock, sand, mud, kelp, pier piling
    Zone: '...',               // High/mid/low intertidal, subtidal
    Behavior: '...',           // Feeding, defensive, locomotion
    Diet: '...',               // Filter feeder, predator, herbivore, scavenger
    vs: '...',                 // Look-alikes — important for edible vs toxic species
    Conservation: '...',       // MPA status, fishing regulations
    Tide: '...',               // Best observed at which tide conditions
  }
}
```

### Marine Guide-Specific Considerations
- **Tidal zone badge CRITICAL** — species organized by intertidal zone (splash/high/mid/low/subtidal). Filter slot replaces endemic filter with zone filter.
- **Marine Protected Areas** — several LA County MPAs (Point Dume, Palos Verdes, Catalina). Conservation context for every relevant species.
- **Shore-observable only** — no SCUBA-required species. Focus: tidepools, rocky shores, sandy beaches, piers, harbors, kelp forest edge.
- **Garibaldi** — California state marine fish. Protected. Bright orange. Most iconic LA tidepool fish.
- **Best tidepool sites**: Point Fermin, White Point, Abalone Cove, Cabrillo Beach, Leo Carrillo, El Matador, Dana Point tidepools.
- **Kelp forest** — bull kelp and giant kelp visible from shore. Foundation species for marine ecosystem. Declining due to warming.
- **Marine algae** as separate group — seaweeds are major component of intertidal ecology. Red, green, brown algae + corallines.
- **Beach wrack ecology** — kelp wrack on beach supports entire ecosystem of invertebrates (beach hoppers, kelp flies, rove beetles). Conservation story: beach grooming destroys this habitat.
- **iNat taxon complexity** — marine species span multiple kingdoms (Animalia, Chromista, Plantae for algae). Multiple taxon_id queries needed. Gap-finder tool will need adaptation.
- **Cal-IPC has no marine equivalent** — use CDFW fishing regulations and MPA status instead for conservation context.

### Marine Sources
Hinton *Seashore Life of Southern California* (1987), Gotshall *Guide to Marine Invertebrates: Alaska to Baja* (2005), Love *Certainly More Than You Want to Know About the Fishes of the Pacific Coast* (2011), Ricketts/Calvin/Hedgpeth *Between Pacific Tides* (5th ed.), Heal the Bay Aquarium species lists, Cabrillo Marine Aquarium field guides, Reef Check California surveys, CalCOFI data, MPA Watch monitoring, CDFW Marine Region species lists, iNaturalist LA County marine observations

---

## Build Workflow (for any guide)

### Creating a New Guide from Template
1. Copy Plant Guide v3.011 `index.html` as starting point (for small guides, re-inline SPECIES_DATA if <500 species expected; for large guides, keep v3 two-file architecture)
2. **CRITICAL: Change `activeTaxon:'wildflowers'`** to first taxa group key (e.g., `'lizards'`)
3. Find/replace: guide name, IDB name, SW cache name, canonical URL, OG tags, GitHub URL
4. Replace SPECIES_DATA with new taxa
5. Replace TAXA object with new taxa groups (emoji, label, iNatTaxonId, familyColors)
6. Replace TAXA_ORDER array
7. Update APG_ORDER for the relevant taxonomic scope
8. Adjust idMap for iNat life list taxon ID deduplication
9. Update manifest.json, sw.js, _headers, icons (and species-data.json for v3 guides)
10. Adjust badge rendering (dur/end/edibility/venomous) for guide-specific badge types
11. Evaluate which filter slot is most useful (endemic/edibility/venomous/migratory)
12. Set up footer: byline → disclaimer with license link → credits → Fork GitHub link
13. Add full SEO block (JSON-LD, OG tags, canonical, keywords, author, robots, theme-color)
14. **Add deep-link URL parser**: `findAndOpenSpecies()` + `URLSearchParams` in init chain
15. **Add cross-guide links in `rHP()`**: map species/group names to other guide URLs
16. Run pre-publish audit
17. Run cross-reference verification (scientific names, occurrence, safety classifications)

### Pre-Publish Audit Checklist (23 items — target: all [x])
- [ ] 0 duplicate IDs
- [ ] 0 duplicate scientific names
- [ ] 0 duplicate common names
- [ ] 0 missing required fields (id, cn, sn, fam, st, desc, mo, pk, dur)
- [ ] 0 missing family colors (no gray #999 defaults)
- [ ] Peak months (pk) are subset of active months (mo)
- [ ] All guide-specific field values valid (edibility, venomous, etc.)
- [ ] All trophic/activity mode values valid
- [ ] No species misplaced in wrong taxa group
- [ ] INTRO_SET consistent with species `intro` flags
- [ ] Even backtick count in JS
- [ ] Version synced across header, SW cache, JSON-LD, **and sw.js file**
- [ ] Header species count matches actual data
- [ ] Disclaimers present (header banner, footer, meta description)
- [ ] Safety warnings render for all dangerous species (toxic/deadly/venomous)
- [ ] **0 safety-relevant species without vs look-alike notes** (edible fungi, venomous herps)
- [ ] **100% ecological association (hp) coverage**
- [ ] **SEO complete** — JSON-LD, OG tags, canonical, keywords
- [ ] **Cross-guide links present** where taxa overlap
- [ ] **Filter logic matches chip data-attributes** (edibility/venomous/endemic values must match rSp filter code)
- [ ] **isO life list function uses NAME_ALIASES** for reclassified taxa
- [ ] **Node.js syntax validation passes** (`node -c` on extracted JS)
- [ ] **Cross-reference verification complete** — names verified against iNat/ITIS

### hp Ecological Associations — Proven 100% Coverage Methodology
The plant guide achieved 100% species-specific hp coverage across 1,476 species using this multi-pass approach (reuse for all guides):

1. **Template generation** — generate initial notes from species attributes (trophic mode, habitat, family, establishment status). Gets to 100% coverage but generic quality.
2. **Source-verified enhancement (top tier)** — research top ~200 species (highest iNat observation count) against authoritative sources: Xerces Society pollinator lists, Las Pilitas butterfly-plant database, Cal-IPC invasive rankings, Calscape wildlife associations, fire ecology literature (Keeley, California Chaparral Institute).
3. **Systematic sweep (middle tier)** — enhance all species ≥20 RG observations. Covers the species users will actually encounter. Focus on: pollinator associations, fire ecology, Cal-IPC status, indigenous uses, wildlife dependencies, conservation concern.
4. **Final sweep (lower tier)** — enhance all remaining species. Even low-observation species get a unique note covering at minimum: establishment context, habitat specialization, one ecological relationship.
5. **Zero-template verification** — run template indicator check confirming 0 generic notes remain.

**Key: write hp notes in batches of 100-200 species per pass using a Python dict mapped by scientific name, applied via JSON update. Never edit species-data.json manually.**

### Version Convention
- Format: `vN.NNN` (e.g., v2.004)
- Increment +.001 on each build
- Sync across: `<title>`, header `<span>`, SW cache name, JSON-LD softwareVersion
- **sw.js is a separate file** — must be updated manually. See Build Lesson #16.

### Build Lesson #16: sw.js Cache Name Must Sync with Version
The service worker file (`sw.js`) contains a cache name string like `la-plant-guide-v3.011`. This lives **outside** `index.html` and is NOT updated by the standard version bump find/replace on the HTML. Failure to update sw.js causes the old service worker to serve stale cached content after deploy.

**v3 sw.js also caches species-data.json** — the ASSETS array must include it.

**Cache name conventions per guide:**
- Plant guide: `la-plant-guide-v{version}`
- Invertebrate guide: `la-bugs-guide-v{version}`
- Fungi guide: `la-fungi-guide-v{version}`
- Future guides: `la-{name}-guide-v{version}`

### Build Lesson #17: v3 Two-File Build Workflow (Plant Guide)
In v3, SPECIES_DATA lives in `species-data.json`, not inline in `index.html`. Build workflow changes:

1. **To modify species data**: Load `species-data.json` → parse → modify → `json.dumps()` → write back
2. **To modify code/CSS**: Edit `index.html` directly (standard str_replace)
3. **On every build**: Increment version in index.html (title, header, JSON-LD) AND sw.js cache name
4. **Deploy zip must include**: index.html, species-data.json, sw.js, manifest.json, icons/

**v3 species data extraction pattern:**
```python
import json
with open('species-data.json', 'r') as f:
    data = json.load(f)
# ... modify data dict ...
with open('species-data.json', 'w') as f:
    json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
```

**No more brace-depth counting needed** for species data — it's clean JSON in its own file. Build Lesson #10 still applies for any remaining inline JS objects (TAXA, CONSERVATION, etc.).

### Known Gotcha: Template Literal Injection
When injecting HTML into template literals in rTI, the family group count uses conditional pluralization: `group${fams.length===1?'':'s'}</span>`. The literal string `groups</span>` does NOT exist in the source. The correct injection point is after `s'}</span>`.

### Build Lesson #18: Cross-Guide Deep Links
The plant guide implements bidirectional cross-linking with labugs.org using two mechanisms:

**Outbound (plant → bug)**: `rHP()` contains two maps:
- `BUG_LINKS` — 38 specific butterfly/moth species → `labugs.org?species=Scientific+name`
- `GROUP_LINKS` — ~15 pollinator group terms (bumble bee, carpenter bee, etc.) → `labugs.org#groupKey`

Both use regex replacement on the hp text string. Species links get `font-weight:600` (bold), group links are normal weight. Link style: forest green text with gold underline (`text-decoration-color:var(--gold)`).

**Inbound (bug → plant)**: `findAndOpenSpecies(query)` searches all taxa groups by SN or CN match, switches to the correct group, and opens the detail sheet after a 300ms render delay. Triggered on page load via `URLSearchParams('species')`. URL format: `?species=Asclepias+fascicularis` (works with scientific or common name, case-insensitive).

**Three URL parameter formats (bidirectional)**:
- `?species=Scientific+name` — opens single species detail sheet (both guides)
- `?search=search+term` — pre-fills search box, filters species grid (both guides)
- `#species/Scientific_name` — legacy hash format for species deep-link

**Four cross-link maps in `rHP()` (v3.011)**:
- `BUG_LINKS`: 41 butterfly/moth species → `labugs.org?species=Danaus+plexippus` (species deep-link)
- `GROUP_LINKS`: 49 pollinator group terms → `labugs.org?search=bumble+bee` (filtered search)
- `BIRD_LINKS`: 35 bird species → `allaboutbirds.org/guide/Species_Name/overview` (Cornell Lab / Merlin)
- `FAUNA_LINKS`: 18 mammal/herp terms → `la-fauna.org?search=coyote` (vertebrate guide)
- `FUNGI_LINKS`: 3 mycorrhizal terms → `lafungi.org?search=mycorrhiz` (fungi guide)

**Link styling by destination** (visual distinction):
- labugs.org: forest green text, gold underline (`color:var(--forest)`)
- allaboutbirds.org: warm brown text (`color:#5D4037`, underline `#8D6E63`)
- la-fauna.org: green text (`color:#2E7D32`, underline `#66BB6A`)
- lafungi.org: earth brown text (`color:#795548`, underline `#A1887F`)

**Inbound handler** (`checkDeepLink()`):
- Checks `?species=`, then `?search=`, then `#species/` on init
- `?search=` sets `state.searchQuery` and triggers `render()` — shows filtered grid
- Used by labugs to link to e.g. `la-flora.org?search=milkweed` (shows all milkweeds)

**Labugs cross-link architecture** (different from plant guide):
- Labugs stores cross-links as `xlink` field in species JSON data, rendered by `rXL()`
- Plant guide stores cross-links as regex maps (`BUG_LINKS`/`GROUP_LINKS`) in `rHP()` code
- Both patterns work; `xlink` is more maintainable at scale (labugs has 587 xlink species)

**To complete bidirectional linking for a new guide pair**: add `findAndOpenSpecies()` + `checkDeepLink()` to the receiving guide's init chain, and add outbound link map via either `xlink` field in data or regex map in `rHP()`.

### Build Lesson #19: Badge Layout on Photo Cards
The `.badge-col` pattern prevents badge overlap on species photo cards. All top-left badges (establishment pill + rarity pip) are wrapped in a single flex column container:

```html
<div class="badge-col">
  <div class="inv-pill">⚠ INV</div>    <!-- only if invasive -->
  <div class="st-pip">● Uncommon</div>  <!-- only if non-common -->
</div>
```

CSS: `.badge-col { position:absolute; top:5px; left:5px; z-index:3; display:flex; flex-direction:column; gap:3px; align-items:flex-start }`

The observed ✓ checkmark stays `position:absolute; top:6px; right:6px` independently — it's NOT inside the badge-col.

**Font fix**: `.inv-pill` and `.intro-pill` must declare `font-family:var(--fb); font-style:normal` to prevent italic serif inheritance from the `.csn` (scientific name) context.

---



## Guide 5: LA County Vertebrate Field Guide (la-fauna.org)

**Status**: Planned — domain reserved, not yet built
**Template**: Fork from Plant Guide v3.011 (v3 two-file architecture)
**Estimated species**: ~350 (mammals ~90, reptiles ~60, amphibians ~20, freshwater fish ~40, marine shore fish ~20, marine mammals ~20)
**IDB name**: `faunaGuidePhotos`
**GitHub**: https://github.com/rhysmarsh/LA-fauna

### Cross-link integration (already seeded)
The plant guide (v3.011) already contains `FAUNA_LINKS` map with 18 terms linking to `la-fauna.org?search=term`. When la-fauna.org launches with `findAndOpenSpecies()` and `?search=` handler, these links will work immediately.

Plant guide hp notes already reference: Mule Deer, Desert Tortoise, coyote, ground squirrel, gopher, bighorn sheep, bobcat, mountain lion, gray fox, woodrat, pronghorn — all linking to la-fauna.org.

### Reciprocal links needed
When building la-fauna.org, add outbound cross-links:
- Plant associations via `xlink` field or `PLANT_LINKS` map → `la-flora.org?species=Scientific+name`
- Invertebrate prey via `BUG_LINKS` → `labugs.org?species=` or `?search=`
- Bird links already go to All About Birds (allaboutbirds.org)

## Source References (shared across guides)

### Vascular Plants
Muns & Chester SMM Checklist (1999/2002), Chester/Fisher/Strong Lower Eaton Canyon (2003), Cooper Flora of Griffith Park (2015), Raven/Thompson/Prigge Flora of SMM (1986), Jepson eFlora, Calflora, CNPS, Theodore Payne, Las Pilitas, CalPhotos, Calscape, Xerces Society

### Invertebrates
Powell & Hogue Insects of the Los Angeles Basin (1979), Emmel & Emmel Butterflies of SoCal (1973), Hogue Insects of the Los Angeles Basin (1993), BugGuide, iNat LA County checklists

### Fungi
Desjardin/Wood/Stevens California Mushrooms (2015), Arora Mushrooms Demystified (2nd ed.), Siegel/Schwarz Mushrooms of the Redwood Coast (2016), MykoWeb/CAF, MushroomExpert.com, NAMA Poison Case Registry, LAMS, iNat, Index Fungorum, GBIF, Catalogue of Life

### Non-Avian Vertebrates
CaliforniaHerps.com (Gary Nafis), Stebbins & McGinnis Western Reptiles and Amphibians (4th ed.), Jameson & Peeters Mammals of California (revised ed.), Moyle Inland Fishes of California (revised ed.), CDFW SSC lists, RASCals (NHMLAC), SD Herp Atlas, NPS SMMNRA surveys, LA Urban Coyote Project, iNat

### Lichens
Tucker & Ryan Revised Catalog of CA Lichens (2006/2013), CALS SoCal Mini Guide, Sharnoff California Lichens

### Mosses
Malcolm/Shevock/Norris California Mosses (2009), CA Moss eFlora

### Marine Life
Hinton Seashore Life of Southern California (1987), Gotshall Guide to Marine Invertebrates (2005), Love Certainly More Than You Want to Know About the Fishes of the Pacific Coast (2011), Ricketts/Calvin/Hedgpeth Between Pacific Tides (5th ed.), Heal the Bay, Cabrillo Marine Aquarium, Reef Check California, CalCOFI, MPA Watch, iNat

---

## Instructions for Claude

When continuing this project:
1. **User will upload the current guide file(s)** — do not assume files persist from previous sessions
2. **Read the file first** before making changes — extract SPECIES_DATA, TAXA, and key functions
3. **Use the safe rebuild pattern** (see CRITICAL BUILD LESSONS above)
4. **Validate structure** via backtick count (not brace/paren/bracket count) and JSON.parse for data
5. **Always run the pre-publish audit** (20 items) after species data changes
6. **Increment version** on every build (+.001), sync title/header/SW/JSON-LD. **Also write updated sw.js** with matching cache name — see Build Lesson #16. For v3 guides, update sw.js ASSETS array if files change.
7. **Match the user's working style**: proceed on assumptions, peer-level depth, institutional-quality output, clear positions, proactive risk flags
8. **Watch for the template literal injection gotcha** — see "Known Gotcha" above
9. **Change activeTaxon** immediately when forking template for a new guide
10. **Assign real family colors** immediately — never use #999 placeholder
11. **Update README** with every major expansion — track stats drift
12. **Run cross-reference verification** before publish — scientific names against iNat, occurrence against place_id=962
13. **Target 100% hp coverage** and 0 safety-relevant species without vs notes
14. **For v3 guides**: species data is in `species-data.json` — load, modify, and write that file directly. No brace-depth counting needed. For v2 (single-file) guides, use brace-depth counting — see Build Lesson #10
15. **Verify filter logic matches chip values** after template fork — the fungi build shipped with broken edibility filter because rSp still had the plant guide's endemic filter code (`'endemic'`/`'non-endemic'`) while chips sent `'edible'`/`'toxic'`/`'inedible'`
16. **Add cross-guide deep links** when ecological connections exist between guides — see Build Lesson #18. Add `findAndOpenSpecies()` for inbound links + species/group maps in `rHP()` for outbound links
17. **Production icons**: deploy zip must include all 5 icon sizes (128, 180, 192, 512, 1024px). SW ASSETS array must list all icon paths. Manifest must declare all sizes. Never ship placeholder icons.
18. **Taxonomy scrub**: before publish, check for reclassified taxa (Pennisetum→Cenchrus, Cheilanthes→Myriopteris, Piperia→Platanthera patterns), verify Cal-IPC High species are tagged `est:'invasive'`, check for trees misplaced in wildflowers
