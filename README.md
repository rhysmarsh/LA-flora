# LA County Plant, Moss & Lichen Field Guide

> **⚠️ FOR INFORMATIONAL PURPOSES ONLY.** Do not eat, touch, or otherwise interact with any plant, lichen, or moss based solely on information in this guide. Misidentification can cause serious injury or death. Any action taken or not taken is solely at the user's own risk. See [LICENSE](LICENSE) for full disclaimer.

A comprehensive self-contained PWA field guide to the flora of Los Angeles County, California — from coastal salt marsh to 10,000 ft alpine, Mojave Desert to Channel Islands fog zone.

**[Live site →](https://la-flora.org)**

## Stats

| Taxa | Count |
|---|---|
| 🌸 Wildflowers | 353 |
| 🌿 Shrubs | 102 |
| 🌳 Trees | 66 |
| 🍃 Lichens | 55 |
| 🌾 Grasses / Rushes / Sedges | 48 |
| 🪨 Mosses | 26 |
| 🌵 Cacti / Succulents | 24 |
| 🌱 Ferns / Allies | 22 |
| 🌊 Aquatic / Wetland | 18 |
| 🪴 Vines | 16 |
| **Total** | **730** |

- **636 native** · 82 introduced (with Cal-IPC ratings)
- **150 families** represented, sortable by APG IV phylogenetic order
- **55 lichens** (field-identifiable — no microscopy/reagents required)
- **26 mosses** (field-identifiable by growth form and habitat)
- **50 species** tagged as endemic (CA, SoCal, Channel Islands, CA/Baja)
- **131 species** tagged with fire ecology
- **78 species** with ecological associations (pollinator/host plant data)
- **43 Cal-IPC rated invasives** (15 High, 22 Moderate, 6 Limited)
- **19 lupines** · 11 dudleyas · 9 manzanitas · 9 sages · 9 oaks · 9 ceanothus
- **10 confusable species pairs** with bidirectional `vs` field marks

## Features

- **Single-file PWA** — works offline after first load; installable on iOS/Android
- **iNaturalist integration** — photos via taxa/autocomplete API, cached in IndexedDB; life list via species_counts API
- **Satellite observation maps** — iNat occurrence data on ESRI basemap with LA County bounds
- **Cal-IPC invasive badges** — red (High), orange (Moderate), gray (Limited) on species cards
- **Endemic badges** — navy (CA), purple (SoCal), teal (Channel Islands)
- **Duration badges** — orange (annual), amber (biennial), green (perennial)
- **Conservation badges** — CNPS rare plant ranks, federal/state listings with detailed notes
- **Life list tracking** — enter your iNat username to see which LA County species you've observed, with per-taxon progress bars
- **Collapsible family chips** — family filter with species counts, zero-count auto-hide, A→Z / APG IV sort toggle synced to photo grid order
- **Status/Observed/Endemic filter chips** — filter by conservation status, life list observation, or endemic range
- **Cross-taxon search** — search any species name from any tab, with "Also found in" links
- **Phenology bars** — bloom period with peak months highlighted
- **Fire ecology** — fire response tagged in species detail cards
- **Ecological associations** — pollinator and host plant relationships
- **vs field marks** — bidirectional differentiation notes for confusable species pairs
- **Alias-aware life list** — handles iNat reclassifications with bidirectional NAME_ALIASES
- **iOS edge-to-edge** — respects safe area insets on notched devices

## Architecture

Self-contained single HTML file (~430 KB). All species data, CSS, and JS inlined. No build step, no dependencies, no framework.

- Photos: fetched from iNat `/taxa/autocomplete`, cached in IndexedDB (`plantGuidePhotos`)
- Life list: iNat `species_counts` API with place_id=962 (LA County)
- Maps: ESRI satellite tiles + iNat observation overlay, bounds [[33.70,-118.95],[34.82,-117.65]]
- Fonts: EB Garamond (serif) + DM Sans (sans-serif) via Google Fonts
- Branding: dark forest green `#1A3C35`, muted gold `#BFA46E`, warm cream `#FAF8F4`

## Sources

This guide was compiled from the following authoritative references:

**Vascular Plants**
- Muns & Chester, *SMM Flora Checklist* (1983/1999/2002) — 100% coverage
- Chester, Fisher, Strong et al., *Flora of Lower Eaton Canyon* (2003) — 98% coverage
- Muns, *Flora of Chantry Flat / Santa Anita Canyon* (1999)
- Raven, Thompson & Prigge, *Flora of the Santa Monica Mountains* (2nd ed., 1986)
- Cooper, *Flora of Griffith Park* (2015) — 326 vouchered native taxa
- Mistretta, *Field Guide to the Flora of the San Gabriel Mountains* (CalBG, 2020)
- Sholars, *Lupines of California* (CNPS Press)
- Strong & Chester, *Geographic Distribution of Arctostaphylos Species in the SGM*
- McAuley, *Wildflowers of the Santa Monica Mountains*

**Lichens**
- Tucker & Ryan, *Revised Catalog of Lichens, Lichenicoles, and Allied Fungi in California* (Constancea 84/85, 2006/2013)
- CALS Mini Guide to Southern California Lichens
- Sharnoff, *California Lichens*
- iNat Lichens of Southern California project (Chris Wagner, UCR Herbarium)
- Hasse, *Flora of Southern California Lichens* (1913) — historical baseline

**Mosses**
- Malcolm, Shevock & Norris, *California Mosses* (2009)
- California Moss eFlora (Paul Wilson, ed.)
- CNPS Bryophyte Chapter
- iNat Bryophytes of Southern California project (Chris Wagner, UCR)

**Invasive Species**
- Cal-IPC, *California Invasive Plant Inventory* (2006–2024)

**General Reference**
- Jepson eFlora (ucjeps.berkeley.edu)
- Calflora (calflora.org)
- CNPS Rare Plant Inventory
- Xerces Society California Pollinator Plant List
- Calscape (calscape.org)
- Theodore Payne Foundation Native Plant Database
- Las Pilitas Nursery LA Native Plant Reference
- iNaturalist (inaturalist.org)

## Deployment

The deploy zip contains everything needed for Netlify drag-and-drop deployment:

```
index.html          # Complete self-contained PWA
sw.js               # Service worker for offline caching
manifest.json       # PWA manifest
_headers            # Cache control + security headers
_redirects          # Netlify redirect rules
icons/              # App icons (SVG primary, PNG fallback)
LICENSE             # GPL v3 + disclaimer
README.md           # This file
```

Canonical URL: `https://la-flora.org`

## Species Data Schema

```javascript
{
  id: 'wil_0001',               // Unique identifier
  cn: 'California Poppy',       // Common name
  sn: 'Eschscholzia californica', // Scientific name (iNat-compatible)
  fam: 'Papaveraceae',          // Family — must match familyColors key
  st: 'common',                 // Status: common|uncommon|rare|endangered
  dur: 'annual',                // Duration: annual|biennial|perennial
  end: 'CA',                    // Endemic: CA|SoCal|Channel Islands|CA/Baja
  ipc: 'High',                  // Cal-IPC rating: High|Moderate|Limited
  desc: '...',                  // Description (70–240 chars)
  elev: 'low,foot',             // Elevation: coast|low|foot|mid|high
  mo: [2,3,4,5,6,7],            // Bloom/active months (1–12)
  pk: [3,4,5],                  // Peak months (subset of mo)
  fm: {                         // Field marks (key-value pairs)
    Height: '...',
    Color: '...',
    Habitat: '...',
    Bloom: '...',
    vs: '...',                  // Differentiation from similar species
    Fire: '...',                // Fire ecology
  },
  hp: '...',                    // Ecological associations
  intro: true,                  // Non-native flag (optional)
  ssp: true,                    // Subspecies — excluded from headline counts (optional)
}
```

Species in `INTRO_SET` are displayed with a ✦ marker. Species with Cal-IPC ratings receive color-coded invasive badges.

## Contributing

Species additions, corrections, and field mark improvements are welcome. Priority areas for community contribution:

- **SGM subregional floras** — Mt. Wilson Trail (295 taxa), Placerita Canyon (331 taxa) still have deeper species to extract
- **Moss/lichen verification** — 4 lichens marked unverified; lichenologist/bryologist review welcome
- **Ecological associations** — 78/730 species have `hp` data; could expand to 200+ connecting plants to the companion [LA County Invertebrate Guide](https://labugs.org)
- **Photo fetch accuracy** — large genera (Calochortus, Quercus, Pinus, Salvia) need manual verification of iNat photo results
- **vs field marks** — expand confusable species pairs beyond current 10
- **Fire ecology** — 131/730 species tagged; many more chaparral species need fire response data

### Pre-Publish Audit Checklist

- [ ] 0 duplicate scientific names
- [ ] 0 missing required fields (id, cn, sn, fam, st, desc, mo, elev)
- [ ] 0 missing family colors for any family in species data
- [ ] Peak months (pk) are subset of active months (mo)
- [ ] INTRO_SET consistent with species `intro` flags
- [ ] Even backtick count in JS
- [ ] JS validates via `new Function(script)`
- [ ] Version synced across `<title>`, header `<span>`, and SW cache name
- [ ] Disclaimer present in footer and meta description

## License

GNU General Public License v3.0 — see [LICENSE](LICENSE) for full text and additional disclaimer.

Species data compiled from public sources. Photos loaded dynamically from iNaturalist (CC-licensed by individual photographers). This guide does not store or redistribute photographs.
