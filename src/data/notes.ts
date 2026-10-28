import type { Finish } from './catalog'

// One line on each design: the stone it was scanned after, or the look it takes.

export const NOTES: Record<string, string> = {
  statuario: 'After the white marble of Carrara',
  calacatta: 'After the gold-veined Calacatta of the Apuan Alps',
  onice: 'After green onyx, cut across its layers',
  nero: 'After the black limestone of Markina, Basque Country',
  armani: 'A soft grey stone with quiet veins',
  travertino: 'After the travertine of Tivoli, near Rome',
  crema: 'After the cream marble of Alicante',
  ivory: 'A plain ivory, nano-polished',
  pepper: 'A speckled granite look, pressed in two layers',
  cemento: 'The look of poured concrete',
  terrazzo: 'After Venetian terrazzo',
  rovere: 'Oak, in porcelain planks',
  teak: 'Aged teak, in porcelain planks',
  pietra: 'A dark grey limestone look',
  bardiglio: 'After the clouded grey marble of the Apuan Alps',
}

export const FINISH_NOTE: Record<Finish, string> = {
  Glossy: 'Polished to a mirror. Slip rating R9.',
  Matt: 'A soft bloom of light. Slip rating R10.',
  Carving: 'A low relief you can feel. Slip rating R11.',
}
