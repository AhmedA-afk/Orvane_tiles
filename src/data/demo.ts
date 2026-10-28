// Every disclaimer on the site, in one place. Orvane Ceramica is a demo: its
// claims, certificates, record sizes and interiors are there to show a
// manufacturer how their own would look. Each note sits beside what it
// qualifies, so nothing reads as a real claim on its own.

export type DemoTopic = 'company' | 'figures' | 'certifications' | 'claims' | 'sizes' | 'technology' | 'imagery' | 'tests'

export const DEMO: Record<DemoTopic, string> = {
  company: 'Orvane Ceramica is a fictional company. This site is a demo, and nothing on it is for sale.',
  figures: 'Sample figures for a demo company.',
  certifications:
    'For illustrative purposes only. Orvane is a demo company and holds no certificates; a manufacturer shows its own here.',
  claims: 'For demo purposes only. Claims show how a manufacturer’s own records would be presented.',
  sizes: 'For demo purposes only. Actual sizes may vary.',
  technology:
    'For demo purposes only. Technologies are illustrative and show how a manufacturer’s own would be presented.',
  imagery: 'Interiors are AI-generated for this demo, with Orvane’s rendered surfaces.',
  tests: 'Illustrative results for a demo company, not test reports.',
}
