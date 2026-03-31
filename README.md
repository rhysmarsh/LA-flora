# LA County Plant, Moss & Lichen Field Guide

A free, open-source progressive web app (PWA) field guide to **1,485 plants, mosses, and lichens** of Los Angeles County. Wildflowers, trees, shrubs, ferns, grasses, cacti, aquatic plants, vines, mosses, and lichens — with photos, field marks, bloom times, ecological notes, and iNaturalist observation maps.

**Live at [la-flora.org](https://la-flora.org)**

## Features

- **1,485 species** across 10 taxa groups — 1,052 native, 367 introduced, 66 invasive
- **iNaturalist life list tracking** — enter your iNat username to see which species you've observed
- **Satellite observation maps** — iNat occurrence maps for every species
- **Photo caching** — photos fetched from iNat API and cached in IndexedDB for fast loading
- **Offline-capable** — service worker caches all files for offline use
- **100% ecological association notes** — every species has a unique species-specific ecological note with named wildlife species, fire ecology, indigenous ethnobotany, and sourced extraordinary claims
- **160 look-alike differentiation notes** — Jepson eFlora diagnostic keys for confusable species pairs, including all safety-critical toxic species
- **Cross-linked ecosystem** — 199 deep links connecting plants to companion guides for bugs, birds, and mammals, with target taxa group routing
- **Elevation filter** — toggle Coast / Lowland / Foothill / Mid-elevation / Mountain
- **Establishment filter** — toggle Native / Introduced / Invasive species
- **Endemic filter** — show only California endemic species
- **Rarity filter** — All / Common / Uncommon / Rare / Endangered
- **Family chips** — filter by plant family with taxonomic or alphabetical sorting
- **Responsive** — designed for mobile field use
- **No tracking, no ads, no login required**

## Ecological Depth

Every species card includes ecological associations verified against published sources. Coverage across 1,476 species:

| Ecological dimension | Species | Coverage | Sources |
|---|---|---|---|
| Specific pollinator families | 731 | 49% | Xerces Society, Las Pilitas, UC Riverside |
| Named bird species | 873 | 59% | LA Audubon, eBird, CWHR |
| Butterfly/moth species | 217 | 15% | Las Pilitas, Art Shapiro (UC Davis) |
| Fire ecology | 210 | 14% | Keeley & Fotheringham, CA Chaparral Institute |
| Mammal/herp associations | 261 | 18% | CWHR, USDA browse database |
| Indigenous ethnobotany | 136 | 9% | Timbrook (2007), Bean & Saubel (1972), McCawley (1996) |
| Look-alike (vs) notes | 160 | 11% | Jepson eFlora diagnostic keys |
| Mycorrhizal associations | 57 | 4% | UC Berkeley mycology |
| Conservation status | 45 | 3% | CNPS, USFWS, CDFW |

### Wildlife Species Referenced

- **29/29 butterfly species** documented in LA County — each named on its host/nectar plants
- **11 moth species** including California Oak Moth, Polyphemus Moth, Elegant Sheep Moth
- **86 bird species** linkable to All About Birds (Cornell Lab / Merlin)
- **~42 mammal/herp species** linkable to la-fauna.org
- **6 specialist bee genera** (Andrena, Diadasia, Colletes, Osmia, Habropoda, Peponapis)
- **4 endangered bee species** (Bombus crotchii, B. occidentalis, Osmia ribifloris, Habropoda depressa)

### Cross-Link Ecosystem

Ecological associations contain clickable links to companion field guides. GROUP_LINKS include target taxa group hashes so users land on the correct tab (e.g., `?search=mining+bee#nativeBees`).

| Destination | Link map | Entries | Description |
|---|---|---|---|
| [labugs.org](https://labugs.org) | BUG_LINKS | 42 | Butterfly/moth species → species deep-link |
| [labugs.org](https://labugs.org) | GROUP_LINKS | 29 | Pollinator groups → filtered search with target tab |
| [allaboutbirds.org](https://allaboutbirds.org) | BIRD_LINKS | 86 | Bird species → Cornell Lab / Merlin |
| [la-fauna.org](https://la-fauna.org) | FAUNA_LINKS | 42 | Mammal/herp species → vertebrate guide |

### Identification Support

- **160 look-alike (vs) notes** using Jepson eFlora diagnostic characters
- All 12+ oak species distinguishable via leaf shape, bark, acorn, and habitat
- All 15 pine species distinguishable via needle count, cone size, bark scent
- All safety-critical toxic species (Poison Hemlock, Sacred Datura, Oleander, Castor Bean, Star Lily) have vs notes
- Sage trio, buckwheat pair, manzanita pair, sumac trio, Ceanothus complex, monkeyflower trio, penstemon trio, paintbrush trio all keyed

## Architecture

v3 two-file PWA architecture:

```
index.html          — 91 KB (CSS + JS + config, no framework)
species-data.json   — 1,070 KB (species data, loaded async)
sw.js               — 1 KB (service worker, network-first + cache-fallback)
manifest.json       — PWA manifest
icons/              — App icons (128, 192, 512, 1024px + apple-touch)
```

## Deployment

Hosted on Netlify via drag-and-drop zip deployment.

1. Zip all files: `index.html`, `species-data.json`, `sw.js`, `manifest.json`, `_headers`, `_redirects`, `icons/`
2. Drag zip to [app.netlify.com/drop](https://app.netlify.com/drop)
3. Configure custom domain: `la-flora.org`

## Adapting This Guide to Other Regions

This guide architecture is designed to be adapted to any geographic region. The species data is entirely separate from the application code, so creating a guide for a different county, state, or bioregion requires only replacing the species data.

### What you need to change

1. **`species-data.json`** — Replace with species data for your region. Each species entry follows this schema:
   ```json
   {
     "sn": "Quercus agrifolia",
     "cn": "Coast Live Oak",
     "fam": "Fagaceae",
     "est": "native",
     "st": "common",
     "elev": "low,foot",
     "desc": "Evergreen tree to 80 ft with dense rounded crown...",
     "bloom": "Mar-May",
     "hp": "Supports 300+ insect species (UC Berkeley)...",
     "fm": {
       "Leaves": "Evergreen, convex, spiny margin...",
       "Bark": "Gray, furrowed...",
       "vs": "Distinguished from scrub oak by tree form..."
     }
   }
   ```

2. **`index.html`** — Update the following sections:
   - Site title and domain references
   - Cross-link maps (`BUG_LINKS`, `BIRD_LINKS`, `FAUNA_LINKS`, `GROUP_LINKS`) — update to your region's companion guides or remove
   - iNaturalist `place_id` in the API call (LA County = 962; find yours at inaturalist.org/places)
   - Footer links to companion guides
   - Elevation band labels if your region's bands differ

3. **`manifest.json`** — Update app name and short_name

4. **`sw.js`** — Update cache name

### Building your species list

The recommended workflow for building a regional species list:

1. **Start with iNaturalist**: Query research-grade observations for your place_id to get a baseline species list
2. **Cross-reference with regional floras**: Verify against published floras, Jepson eFlora (California), or equivalent regional references
3. **Add ecological associations**: Use local Audubon data, Xerces Society pollinator lists, state wildlife habitat databases (CWHR in California), and published ethnobotany sources for your region's indigenous peoples
4. **Verify fire ecology**: If applicable, use regional fire ecology databases (Keeley & Fotheringham for California chaparral)
5. **Add look-alike notes**: Use regional flora keys for confusable species pairs, prioritizing safety-critical toxic species

### Continuation prompt

A comprehensive continuation prompt is included in this repository at `continuation-prompt.md`. It contains the complete build history, architectural decisions, data quality standards, and ecological source references needed to continue development in a new AI session. Feed this prompt to Claude or another AI assistant to resume work on the guide.

## Data Sources

Species data verified against iNaturalist research-grade observations (LA County, place_id=962, >=2 RG observations). Full gap audit run 2026-03-25.

### Botanical References
- Jepson eFlora (ucjeps.berkeley.edu/eflora) — primary source for diagnostic keys and vs notes
- Calflora, CNPS Calscape, Cal-IPC Inventory
- Muns & Chester, *Flora of the Santa Monica Mountains* (1999/2002)
- Cooper, *Flora of Griffith Park* (2015)

### Ecological References
- Xerces Society, *California Pollinator Plant List*
- Las Pilitas Nursery, butterfly-plant database (laspilitas.com)
- LA Audubon Society, native plant bird study (2022)
- California Chaparral Institute (californiachaparral.org)
- Keeley & Fotheringham, chaparral fire ecology research
- CWHR — California Wildlife Habitat Relationships System (CDFW)
- Art Shapiro's Butterfly Site (UC Davis) — butterfly.ucdavis.edu

### Ethnobotanical References
- Timbrook, Jan. *Chumash Ethnobotany* (2007)
- Bean, Lowell & Saubel, Katherine. *Temalpakh: Cahuilla Indian Knowledge and Usage of Plants* (1972)
- McCawley, William. *The First Angelinos: The Gabrielino Indians of Los Angeles* (1996)

### Mycological & Lichenological References
- Tucker & Ryan, *Revised Catalog of California Lichens*
- Malcolm, Shevock & Norris, *California Mosses*

## Related Guides

Part of the LA County Field Guide Suite:
- **[labugs.org](https://labugs.org)** — Invertebrate Field Guide (3,439 species)
- **[lafungi.org](https://lafungi.org)** — Fungi Field Guide (724 species)
- **[la-fauna.org](https://la-fauna.org)** — Vertebrate Field Guide (planned)

## License

GPL v3. See [LICENSE](LICENSE) for details.

For informational purposes only — not a substitute for expert identification. Do not eat wild plants based on this guide.

## Author

Rhys Marsh · Los Angeles, CA
