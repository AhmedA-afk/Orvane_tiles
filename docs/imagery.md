# Imagery: art direction for Orvane interiors

The site's interiors are AI-generated for the demo and say so (`DEMO.imagery`
in `src/data/demo.ts`). They exist to show each design installed in a room a
buyer would want to live in. Every image starts from one of our own rendered
surfaces, attached as a reference, so the stone in the room is the stone in
the catalogue.

## One shoot, one house style

- **Camera.** Architectural interior photography: full-frame, 24 mm tilt-shift,
  verticals corrected, eye height about 120 cm. Calm, symmetrical or
  one-point compositions. Nothing wide-angle-distorted.
- **Light.** Daylight first. Living spaces at golden hour, baths in soft
  overcast light, exteriors at dusk with warm interior light. One light
  source should dominate; shadows are soft and directional.
- **Styling.** Quiet luxury, editorial (the restraint of a design magazine,
  not a showroom). Natural materials around the stone: linen, bouclé, oak,
  walnut, brushed brass, blackened steel, travertine, clay. Greenery
  sparingly: an olive tree, a palm, a single branch.
- **The surface is the subject.** The tile covers at least a third of the
  frame. Large formats read large: thin 2 mm joints, slabs at true scale,
  veins continuing across a wall where the line has Vena.
- **No** people, text, logos, recognisable designer products, real artworks,
  watermarks, warped tile grids, repeating texture seams or clutter.

## The houses

Recurring fictional places, so the photographs feel like one campaign.

| House | What it is | Used for |
|---|---|---|
| The Cliff House | A penthouse above the Arabian Sea | Maestà, Gemelli: living, dining, bedroom |
| Lake Pavilion | A villa on a lake, stone and water | Terme: baths, spa; Aperto: terrace, pool |
| Desert House | A modernist house in the dunes | Aperto: courtyard, facade, pool |
| Hotel Orvane | A boutique hotel | Tattile, Gemelli: lobby, bar, restaurant, spa |
| The Kitchen Atelier | A chef's kitchen and dining room | Cucina |
| The Workshop House | A converted industrial loft | Legno, Tattile, Velo |

## Formats

- Hero: 16:9, 2560 × 1440 (or the tool's largest landscape size).
- Cards and line pages: 4:5 portrait.
- Close-ups: 1:1, a hand's width of surface with raking light.

## Prompt template

> Architectural interior photograph of [ROOM] in [HOUSE]. [LIGHT]. The
> [SURFACE: floor / walls / island] is clad in large-format porcelain slabs
> ([FORMAT] mm, thin 2 mm joints) with exactly the stone in the attached
> reference image: same colour, same veining, same scale of vein. [FINISH:
> mirror-polished, reflecting the room / honed satin / matt]. Furnished with
> [STYLING]. Shot on a 24 mm tilt-shift lens, verticals corrected, eye
> height 120 cm, quiet luxury editorial styling. No people, text, logos or
> watermarks.

## Making them

```bash
node scripts/gen-interiors.mjs [id-filter] [--jobs 4]   # Codex, one image per shot in interiors.json
python3 scripts/build-interiors.py [--sheet out.jpg]    # web versions + interiors-built.json
```

Codex returns 1672 × 941. For 2K or larger masters (Nano Banana Pro through the
Gemini API, or an upscale), drop the new file into `assets/imagery/raw/` under
the shot's id and run the build again; the site picks it up.

## Files

Pilots, references and raw masters live in `assets/imagery/` (not deployed).
The web versions go to `public/images/interiors/<shot id>.jpg`, with a WebP
and an 800 px WebP beside each, and are credited as AI-generated in
`public/images/CREDITS.md`.
