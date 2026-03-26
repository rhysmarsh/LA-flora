# LA County Plant, Moss & Lichen Field Guide

A free, open-source progressive web app (PWA) field guide to **1,476 plants, mosses, and lichens** of Los Angeles County. Wildflowers, trees, shrubs, ferns, grasses, cacti, aquatic plants, vines, mosses, and lichens — with photos, field marks, bloom times, ecological notes, and iNaturalist observation maps.

**Live at [la-flora.org](https://la-flora.org)**

## Features

- **1,476 species** across 10 taxa groups — 1,058 native, 379 introduced, 43 invasive
- **iNaturalist life list tracking** — enter your iNat username to see which species you've observed
- **Satellite observation maps** — iNat occurrence maps for every species
- **Photo caching** — photos fetched from iNat API and cached in IndexedDB for fast loading
- **Offline-capable** — service worker caches all files for offline use
- **100% ecological association notes** — every species has a unique species-specific ecological note with named wildlife species, fire ecology, indigenous ethnobotany, and sourced extraordinary claims
- **Cross-linked ecosystem** — 237 deep links connecting plants to companion guides for bugs, birds, mammals, and fungi
- **Establishment filter** — toggle Native / Introduced / Invasive species
- **Endemic filter** — show only California endemic species
- **Family chips** — filter by plant family with taxonomic or alphabetical sorting
- **Responsive** — designed for mobile field use
- **No tracking, no ads, no login required**

## Ecological Depth

Every species card includes ecological associations verified against published sources. Coverage across 1,476 species:

| Ecological dimension | Species | Coverage | Sources |
|---|---|---|---|
| Pollinator associations | 1,036 | 70% | Xerces Society, Las Pilitas, UC Riverside |
| Named bird species | 758 | 51% | LA Audubon, eBird, CWHR |
| Butterfly/moth species | 211 | 14% | Las Pilitas, Art Shapiro (UC Davis) |
| Fire ecology | 211 | 14% | Keeley & Fotheringham, CA Chaparral Institute |
| Mammal/herp associations | 262 | 18% | CWHR, USDA browse database |
| Indigenous ethnobotany | 139 | 9% | Timbrook (2007), Bean & Saubel (1972), McCawley (1996) |
| Mycorrhizal associations | 57 | 4% | UC Berkeley mycology |
| Conservation status | 46 | 3% | CNPS, USFWS, CDFW |
| Sourced claims | 10 | 1% | Jepson eFlora, UC Davis, USFWS, Xerces |

### Wildlife Species Referenced

- **29/29 butterfly species** documented in LA County — each named on its host/nectar plants
- **11 moth species** including California Oak Moth, Polyphemus Moth, Elegant Sheep Moth
- **85 bird species** linkable to All About Birds (Cornell Lab)
- **~25 mammal/herp species** linkable to la-fauna.org
- **6 specialist bee genera** (Andrena, Diadasia, Colletes, Osmia, Habropoda, Peponapis)
- **2 endangered bee species** (Bombus crotchii, B. occidentalis)

### Cross-Link Ecosystem

Ecological associations contain clickable links to companion field guides:

| Destination | Link map | Entries | Styling |
|---|---|---|---|
| [labugs.org](https://labugs.org) | BUG_LINKS + GROUP_LINKS | 51 + 49 = 100 | Green text, gold underline |
| [allaboutbirds.org](https://allaboutbirds.org) | BIRD_LINKS | 85 | Brown #5D4037, underline #8D6E63 |
| [la-fauna.org](https://la-fauna.org) | FAUNA_LINKS | 54 | Green #2E7D32, underline #66BB6A |

## Architecture

v3 two-file PWA architecture:

```
index.html          — 92 KB (CSS + JS + config, no framework)
species-data.json   — 1,060 KB (species data, loaded async)
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
     "desc": "Evergreen tree to 80 ft with dense rounded crown...",
     "bloom": "Mar-May",
     "hp": "Supports 300+ insect species (UC Berkeley)...",
     "fm": {
       "Leaves": "Evergreen, convex, spiny margin...",
       "Bark": "Gray, furrowed...",
       "Acorns": "Slender, pointed...",
       "Habitat": "Canyons, north-facing slopes...",
       "Size": "30-80 ft..."
     }
   }
   ```

2. **`index.html`** — Update the following sections:
   - Site title and domain references
   - Cross-link maps (`BUG_LINKS`, `BIRD_LINKS`, `FAUNA_LINKS`, `FUNGI_LINKS`) — update to your region's companion guides or remove
   - iNaturalist `place_id` in the API call (LA County = 962; find yours at inaturalist.org/places)
   - Footer links to companion guides

3. **`manifest.json`** — Update app name and short_name

4. **`sw.js`** — Update cache name

### Building your species list

The recommended workflow for building a regional species list:

1. **Start with iNaturalist**: Query research-grade observations for your place_id to get a baseline species list
2. **Cross-reference with regional floras**: Verify against published floras, Jepson eFlora (California), or equivalent regional references
3. **Add ecological associations**: Use local Audubon data, Xerces Society pollinator lists, state wildlife habitat databases (CWHR in California), and published ethnobotany sources for your region's indigenous peoples
4. **Verify fire ecology**: If applicable, use regional fire ecology databases (Keeley & Fotheringham for California chaparral)

### Continuation prompt

A comprehensive continuation prompt is included in this repository at `continuation-prompt.md`. It contains the complete build history, architectural decisions, data quality standards, and ecological source references needed to continue development in a new AI session. Feed this prompt to Claude or another AI assistant to resume work on the guide.

## Data Sources

Species data verified against iNaturalist research-grade observations (LA County, place_id=962, >=2 RG observations). Full gap audit run 2026-03-25.

### Botanical References
- Jepson eFlora (ucjeps.berkeley.edu/eflora)
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
- **[labugs.org](https://labugs.org)** — Invertebrate Field Guide (1,016 species)
- **[lafungi.org](https://lafungi.org)** — Fungi Field Guide (567 species)
- **[la-fauna.org](https://la-fauna.org)** — Vertebrate Field Guide (planned)

## License

GPL v3. See [LICENSE](LICENSE) for details.

For informational purposes only — not a substitute for expert identification. Do not eat wild plants based on this guide.

## Author

Rhys Marsh · Los Angeles, CA
