// SAMPLE DATA. Orvane Ceramica is a fictional company made for this demo;
// every detail here is a placeholder to swap for a real manufacturer's own.

export const BRAND = 'Orvane Ceramica'
export const BRAND_SHORT = 'Orvane'

/**
 * International format, digits only, as wa.me expects. A deliberately invalid
 * placeholder (no Indian mobile starts with 0), so a demo enquiry can never
 * reach a real person. Put the presenter's own number here for live demos.
 */
export const WHATSAPP_NUMBER = '910000000000'
export const EMAIL = 'studio@orvane.example'
/** Fictional, and kept vague on purpose so it matches no real company's premises. */
export const ADDRESS = ['Orvane Works, Plot 00, Ceramic Cluster', 'Morbi, Gujarat, India']

export const FACTS = [
  { value: 32000, unit: 'm²', label: 'pressed, fired and polished every day' },
  { value: 4, unit: 'kilns', label: 'running at up to 1,210 °C' },
  { value: 48, unit: 'countries', label: 'received our containers last year' },
]

export const CERTIFICATIONS = [
  { name: 'CE', note: 'EN 14411 declaration of performance' },
  { name: 'ISO 13006', note: 'Tested to group BIa' },
  { name: 'ISO 9001', note: 'Quality management' },
  { name: 'ISO 14001', note: 'Environmental management' },
]

export const FAIRS = [
  { name: 'Cevisa', place: 'Valencia' },
  { name: 'Coverings', place: 'Orlando' },
  { name: 'The Big 5', place: 'Dubai' },
]

/** Indicative sea transit from Mundra, in days. */
export const ROUTES = [
  { port: 'Sohar', country: 'Oman', days: 4 },
  { port: 'Jebel Ali', country: 'UAE', days: 5 },
  { port: 'Dammam', country: 'Saudi Arabia', days: 7 },
  { port: 'Mombasa', country: 'Kenya', days: 12 },
  { port: 'Novorossiysk', country: 'Russia', days: 24 },
  { port: 'Houston', country: 'United States', days: 34 },
  { port: 'Santos', country: 'Brazil', days: 36 },
  { port: 'Manzanillo', country: 'Mexico', days: 38 },
]

export const PORTS = [
  'Jebel Ali, UAE',
  'Dammam, Saudi Arabia',
  'Jeddah, Saudi Arabia',
  'Sohar, Oman',
  'Hamad, Qatar',
  'Shuwaikh, Kuwait',
  'Mombasa, Kenya',
  'Lagos (Apapa), Nigeria',
  'Novorossiysk, Russia',
  'Manzanillo, Mexico',
  'Santos, Brazil',
  'Callao, Peru',
  'Houston, United States',
  'Colombo, Sri Lanka',
]

export const LANGUAGES = [
  { code: 'en', label: 'English', ready: true },
  { code: 'ar', label: 'العربية', ready: false },
  { code: 'es', label: 'Español', ready: false },
  { code: 'ru', label: 'Русский', ready: false },
]
