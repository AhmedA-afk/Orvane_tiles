# Morbi Tiles Market (demo website)

An example B2B and export website for a Morbi tile manufacturer, built as a pitch demo. Product truth is in `PRODUCT.md`, and the design direction is the comment at the top of `index.html`.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/ (needs an SPA fallback to index.html on the host)
```

## Pages

| Route | What it does |
|---|---|
| `/` | Hero slab under moving light (glossy, matt or carving, lit from real normal maps). Pinned scroll that lays book-matched slabs, then tilts the floor into a room. Doorways to each page, then a quote sheet. |
| `/collections` | Catalog filtered by size, finish, body and room. Tiles stand on a rack at true scale. Detail panel with print-to-PDF spec sheet. |
| `/visualizer` | CSS 3D room with plaster walls and a garden view; the floor is relaid at the true tile size. |
| `/export` | Container load calculator (20 or 40 ft), transit days from Mundra, export documents. |
| `/factory` | Animated production line, capacity figures, certifications, trade fairs. |
| `/quote` | Form that builds a WhatsApp message (or an email). |

## Motion (the reticulos.com kit)

- `src/motion/gsap.ts`: GSAP and ScrollTrigger load after first paint. Each section's setup runs in its own task.
- `SmoothScroll.tsx`: Lenis, driven by GSAP's ticker.
- `Split.tsx`: letters rise from their slots using CSS only.
- `Magnetic.tsx`: buttons lean toward the pointer and roll their labels on hover.
- `useWipe.ts`: coloured sections rise as rounded sheets as you scroll.
- `ScrollRail.tsx`: the scrollbar is a hairline rail with the tile mark as its handle.
- `Transition.tsx`: on page change, tiles cover the screen from the point you clicked, then lift.
- Motion (`motion/react`) handles UI state: finish switch, filters, the shared-element detail panel, the quote preview.
- Everything renders in its finished state under `prefers-reduced-motion`.

When a section is pinned with ScrollTrigger, wrap it in an element React owns (see `LayingStory.tsx`). Otherwise route changes crash on GSAP's pin-spacer.

## Images

The tile surfaces are CC0 photo scans from ambientCG; the plaster wall and garden view are CC0 from Poly Haven. See `public/images/CREDITS.md`. To use a real manufacturer's photos, replace `public/tiles/<design>.webp` (portrait files are 1:2, planks 1:6) and the `-sm` versions.

## Before showing this to a client

All business data is **sample data**: `src/data/catalog.ts` (products, packing, specs) and `src/data/site.ts` (WhatsApp number, email, address, capacity, certifications, transit days).

Not built yet: Arabic, Spanish and Russian pages (the language switcher marks them "coming soon"), dealer login and locator, the room-photo visualizer, and a real factory video.
