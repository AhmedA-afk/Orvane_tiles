import type { LineId } from './lines.ts'
import shots from './interiors.json' with { type: 'json' }
import built from './interiors-built.json' with { type: 'json' }

// SAMPLE IMAGERY. The interiors: rooms in the demo's fictional houses, each
// made from one design in one colourway (docs/imagery.md), AI-generated and
// labelled as such. Only shots that scripts/build-interiors.py has prepared
// are listed.

export interface Interior {
  id: string
  line: LineId
  design: string
  colourway: string
  room: string
  /** the fictional house it belongs to */
  house: string
  alt: string
  w: number
  h: number
}

const B = built as Record<string, { w: number; h: number }>

export const INTERIORS: Interior[] = shots.shots
  .filter((s) => B[s.id])
  .map((s) => ({
    id: s.id,
    line: s.line as LineId,
    design: s.design,
    colourway: s.colourway,
    room: s.room,
    house: s.title,
    alt: s.alt,
    ...B[s.id],
  }))

export const interiorsFor = (design: string) => INTERIORS.filter((i) => i.design === design)
export const interiorsIn = (line: LineId) => INTERIORS.filter((i) => i.line === line)
