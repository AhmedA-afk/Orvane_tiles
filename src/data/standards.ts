// SAMPLE DATA. The standards the range is tested to, with what it returns on
// each, and the certificates a manufacturer would show. Illustrative results
// for a demo company: the technology page and the printed technical data
// sheet both read them from here.

export const TESTS: [string, string, string][] = [
  ['ISO 13006 · EN 14411', 'Classification of the body', 'Group BIa, the densest porcelain'],
  ['ISO 10545-3', 'Water absorption', '≤ 0.1% by weight'],
  ['ISO 10545-4', 'Breaking strength', '≥ 40 N/mm², ≥ 50 N/mm² from 12 mm'],
  ['ISO 10545-9', 'Thermal shock', 'Passed'],
  ['ISO 10545-12', 'Frost resistance', 'Passed, 100 cycles'],
  ['ISO 10545-14', 'Stain resistance', 'Class 5'],
  ['DIN 51130', 'Slip, on the ramp', 'R9 to R12, by finish'],
  ['ANSI A326.3', 'Wet slip (DCOF)', '≥ 0.42 on Presa and Grip'],
]

export const CERTS: [string, string][] = [
  ['ISO 9001', 'Quality management'],
  ['ISO 14001', 'Environmental management'],
  ['ISO 45001', 'Health and safety'],
  ['CE', 'EN 14411 conformity'],
  ['IS 15622', 'Bureau of Indian Standards'],
]
