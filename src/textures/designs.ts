// Tile surfaces are CC0 photo scans from ambientCG (see public/images/CREDITS.md),
// cropped to each format's proportions. `base` is the scan's average colour,
// shown while the image loads.

export interface Design {
  id: string
  name: string
  /** width / height of the image file */
  aspect: number
  base: string
  /** has a normal map, for the carving finish */
  normal?: boolean
}

const d = (id: string, name: string, aspect: number, base: string, normal = false): Design => ({
  id,
  name,
  aspect,
  base,
  normal,
})

export const DESIGNS: Record<string, Design> = Object.fromEntries(
  [
    d('statuario', 'Statuario Bianco', 0.5, 'rgb(243 243 244)', true),
    d('calacatta', 'Calacatta Oro', 0.5, 'rgb(209 197 178)', true),
    d('nero', 'Nero Marquina', 0.5, 'rgb(63 61 66)', true),
    d('armani', 'Armani Grigio', 0.5, 'rgb(141 132 124)'),
    d('onice', 'Onice Verde', 0.5, 'rgb(160 168 110)'),
    d('bardiglio', 'Bardiglio Nuvolato', 0.5, 'rgb(175 173 181)'),
    d('crema', 'Crema Marfil', 1, 'rgb(187 182 177)'),
    d('travertino', 'Travertino Classico', 0.5, 'rgb(163 149 135)', true),
    d('pietra', 'Pietra Grey', 0.5, 'rgb(92 84 94)', true),
    d('rovere', 'Rovere Natural', 1 / 6, 'rgb(160 121 92)'),
    d('teak', 'Teak Antico', 1 / 6, 'rgb(88 51 20)', true),
    d('cemento', 'Cemento Grigio', 1, 'rgb(131 128 124)'),
    d('terrazzo', 'Terrazzo Venezia', 1, 'rgb(200 193 185)'),
    d('pepper', 'Salt & Pepper', 1, 'rgb(205 205 204)'),
    d('ivory', 'Ivory Nano', 1, 'rgb(175 164 139)'),
  ].map((x) => [x.id, x]),
)

export const tileSrc = (id: string, size: 'lg' | 'sm' = 'lg') => `/tiles/${id}${size === 'sm' ? '-sm' : ''}.webp`
export const normalSrc = (id: string) => `/tiles/${id}-n.webp`
