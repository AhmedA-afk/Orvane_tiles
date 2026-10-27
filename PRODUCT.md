# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Primary: owners and export managers of tile factories in Morbi, Gujarat, who are being shown this site as a pitch for what their own website could be. They judge it on whether their buyers would trust it and enquire through it.

The buyers the site is designed for, inside the pitch: overseas importers (Gulf, Africa, Latin America, CIS), domestic dealers, and architects. They browse mostly on phones, often on slow connections. They compare sizes, finishes, body types and packing, and they close deals on WhatsApp.

## Product Purpose
A demonstration website for a Morbi tile manufacturer, branded "Morbi Tiles Market". It shows the features worth selling to a manufacturer: a filterable catalog, spec sheets, a tile visualizer, a container load calculator, export pages and a WhatsApp quote flow. It replaces the usual Morbi site, which is a PDF dump. Success means a manufacturer sees it and wants this site for their own business.

## Positioning
Built around how tile exports actually work: formats in millimetres, body types (GVT, PGVT, double charge, porcelain), boxes per pallet and per container, FOB Mundra or CIF, shade and caliber, quotes on WhatsApp. A generic e-commerce template can't credibly copy that vocabulary.

## Operating Context
Morbi is India's main ceramic tile cluster. Containers ship from Mundra and Pipavav ports. Buyers meet manufacturers at trade fairs such as Cevisa, Coverings and The Big 5. Tiles hit a container's weight limit before its volume limit, so most orders go in 20 ft containers.

## Capabilities and Constraints
- Stack: Vite + React + TypeScript, Motion, GSAP + ScrollTrigger, Lenis (the same motion toolkit as reticulos.com).
- Phase 1 is the landing page plus separate pages for the catalog, visualizer, export and container tools, factory, and quote.
- Not built yet: Arabic, Spanish and Russian pages; dealer login and locator; a photo-upload visualizer; a real factory video.

## Brand Commitments
- The name "Morbi Tiles Market" is a demo brand. It must not imitate a real Morbi company.

## Evidence on Hand
- No real manufacturer data. Every product, packing figure, capacity number, transit time and contact detail is SAMPLE data in `src/data/`, and the code says so.
- Imagery: CC0 photo-scanned surfaces (Poly Haven, ambientCG) for tile faces; Unsplash- or Pexels-licensed interior photos for room scenes. Record credits in `public/images/CREDITS.md`.
- No testimonials, client logos, real factory photos or press. Never fabricate them. Stock factory photos must not be presented as "our factory".

## Product Principles
- Speak the trade's language: mm, m² per box, boxes per pallet, FOB/CIF, shade and caliber.
- Show the tile itself: real surfaces, true scale, true finish.
- Every route ends in a quote on WhatsApp.
- Each page makes one point, so no page feels crowded.
- Honest by construction: sample data is labelled, and unbuilt features are marked as coming.

## Accessibility & Inclusion
WCAG 2.2 AA. Every animation respects prefers-reduced-motion, and no content waits on an animation to run. Mobile-first with fast loads, because buyers browse on phones.
