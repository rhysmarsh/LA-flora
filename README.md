# LA County Plant, Moss & Lichen Field Guide

A free, open-source progressive web app (PWA) field guide to **1,474 plants, mosses, and lichens** of Los Angeles County. Wildflowers, trees, shrubs, ferns, grasses, cacti, aquatic plants, vines, mosses, and lichens — with photos, field marks, bloom times, ecological notes, and iNaturalist observation maps.

**Live at [la-flora.org](https://la-flora.org)**

## Features

- **1,474 species** across 10 taxa groups — 1,058 native, 379 introduced, 43 invasive
- **iNaturalist life list tracking** — enter your iNat username to see which species you've observed
- **Satellite observation maps** — iNat occurrence maps for every species
- **Photo caching** — photos fetched from iNat API and cached in IndexedDB for fast loading
- **Offline-capable** — service worker caches all files for offline use
- **100% ecological association notes** — every species has a unique species-specific ecological note
- **Establishment filter** — toggle Native / Introduced / Invasive species
- **Endemic filter** — show only California endemic species
- **Family chips** — filter by plant family with taxonomic or alphabetical sorting
- **Responsive** — designed for mobile field use
- **No tracking, no ads, no login required**

## Species Coverage

| Group | Count | Notable |
|---|---|---|
| Wildflowers | 531 | Lupines, poppies, phacelias, buckwheats, sages |
| Shrubs | 391 | Chaparral, coastal sage scrub, desert shrubs |
| Grasses | 164 | Bunchgrasses, sedges, rushes, invasive annual grasses |
| Lichens | 128 | Foliose, fruticose, crustose, soil crust |
| Trees | 102 | Oaks, pines, sycamores, willows + common planted species |
| Ferns | 47 | Maidenhairs, lip ferns, bracken, horsetails, clubmosses |
| Cacti | 41 | Prickly pears, chollas, barrel cacti, dudleyas |
| Aquatic | 34 | Cattails, tule, pickleweed, salt marsh specialists |
| Mosses | 26 | Rock mosses, streambank mosses, urban mosses |
| Vines | 16 | Wild grape, morning glories, clematis, dodder |

## Architecture

v3 two-file PWA architecture:

```
index.html          — 77 KB (CSS + JS + config, no framework)
species-data.json   — 830 KB (species data, loaded async)
sw.js               — 1 KB (service worker, network-first + cache-fallback)
manifest.json       — PWA manifest
icons/              — App icons (192px, 512px, apple-touch)
```

## Deployment

Hosted on Netlify via drag-and-drop zip deployment.

1. Zip all files: `index.html`, `species-data.json`, `sw.js`, `manifest.json`, `_headers`, `_redirects`, `icons/`
2. Drag zip to [app.netlify.com/drop](https://app.netlify.com/drop)
3. Configure custom domain: `la-flora.org`

## Data Sources

Species data verified against iNaturalist research-grade observations (LA County, place_id=962, ≥2 RG observations). Full gap audit run 2026-03-25.

### Botanical References
- Jepson eFlora (ucjeps.berkeley.edu/eflora)
- Muns & Chester, *Flora of the Santa Monica Mountains* (1999/2002)
- Cooper, *Flora of Griffith Park* (2015)
- Raven, Thompson & Prigge, *Flora of the Santa Monica Mountains* (1986)
- Calflora, CNPS, Calscape, Cal-IPC Inventory

### Ecological References
- Xerces Society, *California Pollinator Plant List*
- Las Pilitas Nursery, butterfly-plant database
- California Chaparral Institute, fire ecology
- Keeley et al., chaparral fire ecology research
- Tucker & Ryan, *Revised Catalog of California Lichens*
- Malcolm, Shevock & Norris, *California Mosses*

## Related Guides

Part of the LA County Field Guide Suite:
- **[labugs.org](https://labugs.org)** — Invertebrate Field Guide (1,016 species)
- **[lafungi.org](https://lafungi.org)** — Fungi Field Guide (567 species)

## License

GPL v3. See [LICENSE](LICENSE) for details.

For informational purposes only — not a substitute for expert identification. Do not eat wild plants based on this guide.

## Author

Rhys Marsh · Los Angeles, CA
