# Orvane Ceramica (demo website)

A showcase website for a fictional porcelain-slab maker in Morbi, India, built to show tile manufacturers what their own site could be. Product truth is in `PRODUCT.md`; the art direction is the comment at the top of `index.html`.

```bash
npm install
npx vite --port 3000      # dev server
npm run build             # static site in dist/ (needs an SPA fallback to index.html on the host)
node scripts/render-stills.mjs [filter]   # re-render the stills in public/renders (dev server on :3000)
```

## Pages

| Route | What it does |
|---|---|
| `/` | A short film about one slab, cut to the scroll. It stands in front of the wordmark, turns edge-on to show how thin it is, turns face-on with its measures, then goes dark: light runs across black marble and a loupe magnifies the veins, with the finish switchable. It changes stone beside the index of the eight lines, lies down to become the floor of a path-traced room that opens in a circle, then the five spaces pass sideways, then Morbi, the sample box and the footer. |
| `/collections` | The range: 69 designs as studio renders, grouped by line, narrowed by six glass menus (line, look, colour, finish, size, thickness); colourway dots switch a card's render. |
| `/collections/:id` | The configurator: colourway, format, thickness and finish, live and in the URL. The stage shows the slab (and its edge), at scale beside a person and a door, bookmatched 2- or 4-way, laid as a floor (straight, offset, herringbone or chevron, the grout matched to the stone), or two finishes side by side, in daylight, evening or showroom light, with raking light. Below: the printed faces, technologies, cut to size, edge profiles, the full spec, a print-to-PDF sheet, and the sample box. |
| `/lines`, `/lines/:id` | The eight lines: an index, and a page per line with its story, formats drawn to scale, thicknesses, finishes, technologies and designs. |
| `/spaces`, `/spaces/:id` | Five spaces (kitchens, bathrooms, living, hotels and bars, outdoors): an index of photographs, and a page per space opening on its room, with its rooms, one working moment (edge profiles and cut to size; a CSS 3D bathroom re-stoned in one tap; the joint counter; bookmatched lobby walls; three ways to lay 20 mm outdoors), its lines and the next space. |
| `/technology` | The three films, the six technologies with links to where each is shown working, the test standards with results, and the certification badges, all labelled as demo. |
| `/technology/scale` | Maestà at 1800 × 3600 mm: the slab standing between the two halves of its size, growing through the formats beside a person and a door, a joint counter for any room, a wall of it, its three thicknesses with weights and crate counts. |
| `/technology/surface-lab` | The DIN 51130 ramp you tilt until a boot slips, a stain spilt, left and wiped on porcelain and marble, a pan off the flame, the Mohs scale, and a gloss meter reading eight finishes in one frame. |
| `/technology/vein` | Four slabs falling from random into sequence, two slabs opening like a book, and a wall to match in six stones: random, in sequence, bookmatched or four-way. |
| `/studio` | Orvane Studio. Seven rooms rendered live (a living room with a terrace, a kitchen, a spa bathroom, a bedroom, a pool terrace, a hotel lobby, and your own room to your measurements), each surface laid at true scale in any design, format, pattern and finish, with the quantity in pieces and boxes. A 24-hour sun dial (and a day played in twenty seconds), lamp moods, cloud and rain; drag to look round, click to walk, a plan view; path-traced photographs; AR on a phone; the whole room in a shareable link. `/visualizer` redirects here. |
| `/studio/upload` | Your own design: a picture of a slab or tile, cropped to the piece it shows, named and given a line, then laid in the Studio and the photo tool at true size. Kept on the device (IndexedDB), never uploaded. |
| `/studio/insights` | What visitors do in the Studio (stones laid, rooms, hours, finishes, and how far they go, from a room to an enquiry), a sample month beside this device's own counts. |
| `/studio/photo` | Any design laid on a photograph of your own floor: four corners mark the plane, the stone runs out to the floor's edges in true perspective and scale with the photograph's light kept, a brush adds floor or keeps furniture, and the result saves as an image. The photograph never leaves the device. |
| `/export` | A container loading itself in 3D for any size and 20 or 40 ft, with the figures; days at sea from Mundra; the papers. |
| `/factory` | The kiln, then the line as a pinned sideways scroll through six stations; numbers, certificates, fairs, a visit. |
| `/quote` | Samples, a container price or a visit: the form writes the WhatsApp message as you go. |

## 3D

`src/home/`: the home film. `Stage` is one fixed, transparent canvas holding the protagonist slab, the loupe (a second camera renders the stone under the pointer into a texture) and the sample fan; `store` holds the pose the scroll timeline writes and the stage eases towards, in screen terms.

The Studio's sales tools (`src/studio/SalesTools.tsx`, `project.ts`, `src/data/trade.ts`): a project built room by room, with every stone's area, pieces, boxes or crates, weight and 20 ft containers, printed as a schedule or sent on WhatsApp; dealer mode, with sample trade prices FOB Mundra, stock and minimum orders, a quotation in the showroom's and client's names, a showroom screen (full screen, the site hidden, a tour that runs itself when left alone) and a QR code that hands the room to the client's phone.

`src/studio/`: the Studio. `rooms.ts` holds the rooms as data (sizes, surfaces, views, lamps), `rooms3d.tsx` their furniture, `Scene.tsx` builds any room and its light from `sun.ts` (the hour, the weather), `Walk.tsx` moves the camera, `Snapshot.tsx` path traces a photograph, `paint.ts` lays a surface without three.js (and maps it in perspective for the photo tool), `ar.ts` hands a patch of stone to AR Quick Look or WebXR. Surfaces are drawn by `src/three/pattern.ts`, which the configurator's floor shares.

`src/three/`: `Slab` (a slab with finish-correct physical materials; `hd` uses a full-resolution face where one exists), `Studio` (a live environment that fades from a pale cyclorama to a black room, with a key softbox the film sweeps round the slab), `SlabViewer`, `Room`, `ContainerScene`, and `Gallery` (the dark scenes for the factory stills). Every 3D view is lazy-loaded; the home page has rendered posters for reduced motion.

`render.html` + `src/render/main.tsx` draw any scene as a still; `scripts/render-stills.mjs [name,name…]` captures them in headless Chrome into `public/renders/`. The room still (`room-day`) is path traced with three-gpu-pathtracer and takes many minutes; the rest take a second each. `render.html` is dev-only and not in the build. The showcase stills (`show/`) that sit on a light field with `mix-blend-mode: multiply` are passed through `python3 scripts/whiten-renders.py <files>`, which turns their studio ground pure white so no box shows behind them; re-run it after re-rendering `show/tower-portoro`, `show/turn-portoro` or the `show/sample-*` copies.

## Motion

The home page is one paused GSAP timeline measured in screens of scroll, played to the scroll position every frame, so it runs the same forwards and back; SplitText for the kinetic type. Elsewhere: ScrollTrigger (the pinned factory line, parallax), Lenis smooth scroll, Motion for UI state (filter menus, segmented controls, the detail sheet), masked line reveals, liquid-glass panes (an SVG displacement map in `backdrop-filter`, Chromium; frosted elsewhere), a labelled cursor, and the tile-curtain page transition. Everything has a reduced-motion state.

## The range

`src/data/range/` is the catalogue the site is moving onto: 8 lines (each a sub-brand with its formats, thicknesses, finishes and technologies), 69 designs and 152 colourways. `designs.json` is the source; `index.ts` gives the options for any design and computes the spec and SKU of any configuration (weight, packing, slip rating, the demo notes it must carry). `docs/range.md` lists it all.

```bash
python3 scripts/build-textures.py [ids…] [--force] [--sheet out.jpg]   # faces, normal maps, colourways, swatches.json
node scripts/check-range.ts                                              # consistency and files on disk
```

Interiors: 45 AI-generated rooms in the demo's fictional houses, each made from one design and colourway (`src/data/range/interiors.json`, art direction in `docs/imagery.md`), shown on product pages ("In a room"), line pages, the lines index and the collection, always labelled as AI-generated.

```bash
node scripts/gen-interiors.mjs [id-filter] [--jobs 4] [--timeout 8]   # Codex CLI, one image per shot
python3 scripts/build-interiors.py [--sheet out.jpg]                   # web versions + interiors-built.json
```

Disclaimers live in `src/data/demo.ts` and show beside what they qualify (`<DemoNote>`); certifications use our own typographic badges (`<CertBadge>`), never official marks. Interior imagery follows `docs/imagery.md`.

## Before showing this to a client

All business data is sample data: `src/data/catalog.ts` and `src/data/site.ts`. Replace `public/tiles/<design>.webp` with the manufacturer's own scans and re-run the render script.
