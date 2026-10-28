// node scripts/gen-interiors.mjs [id-filter] [--jobs 4] [--timeout 8]
// Generates the interiors in src/data/range/interiors.json with the Codex CLI,
// one image per shot, each with its colourway's face texture attached as the
// reference for the stone. Shots that already have a file in
// assets/imagery/raw/ are skipped, so it can be run again after a failure.
// Art direction: docs/imagery.md.
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const RAW = join(ROOT, 'assets/imagery/raw')
const REFS = join(ROOT, 'assets/imagery/refs')
mkdirSync(RAW, { recursive: true })
mkdirSync(REFS, { recursive: true })

const args = process.argv.slice(2)
const jobs = Number(args[args.indexOf('--jobs') + 1]) || 4
const minutes = Number(args[args.indexOf('--timeout') + 1]) || 8
const only = args.find((a) => !a.startsWith('--') && !/^\d+$/.test(a))
const { shots } = JSON.parse(readFileSync(join(ROOT, 'src/data/range/interiors.json'), 'utf8'))
const swatches = JSON.parse(readFileSync(join(ROOT, 'src/data/range/swatches.json'), 'utf8'))

const done = (id) => ['png', 'jpg', 'jpeg', 'webp'].some((x) => existsSync(join(RAW, `${id}.${x}`)))
const todo = shots.filter((s) => !s.scene.startsWith('(') && !done(s.id) && (!only || s.id.includes(only)))

// the reference: the colourway's face texture, as a JPEG
function ref(s) {
  const cw = swatches[s.design].colourways.find((c) => c.slug === s.colourway) ?? swatches[s.design].colourways[0]
  const out = join(REFS, `${s.design}--${cw.slug}.jpg`)
  if (!existsSync(out)) {
    const r = spawnSync('python3', ['-c', `from PIL import Image; Image.open(${JSON.stringify(join(ROOT, 'public/tiles', cw.file))}).convert('RGB').save(${JSON.stringify(out)}, quality=92)`])
    if (r.status) throw new Error(`ref for ${s.id}: ${r.stderr}`)
  }
  return out
}

const prompt = (s) => `Generate one image with your image generation tool and save it in the current directory as ${s.id}.png (landscape, 16:9, as large as the tool allows).

The image: an architectural interior photograph of ${s.scene}. The porcelain shows exactly the stone in the attached reference image: ${s.stone}, the same colour and the same scale of vein or pattern. Shot on a 24 mm tilt-shift lens, verticals corrected, eye height 120 cm, natural light dominant, quiet luxury editorial styling as in a design magazine. Large formats read large, with thin joints. No people, no text, no logos, no watermarks, no recognisable designer products, no warped lines.

Do nothing else: no code, no other files.`

function run(s) {
  return new Promise((resolve) => {
    const t0 = Date.now()
    const p = spawn('codex', ['exec', '--skip-git-repo-check', '--ephemeral', '-s', 'workspace-write', '-C', RAW, '-i', ref(s), '-o', '/dev/null', prompt(s)], { stdio: 'ignore' })
    const kill = setTimeout(() => p.kill('SIGTERM'), minutes * 60_000)
    p.on('exit', () => {
      clearTimeout(kill)
      console.log(`${done(s.id) ? 'ok  ' : 'FAIL'} ${s.id}  ${((Date.now() - t0) / 1000).toFixed(0)}s`)
      resolve()
    })
  })
}

console.log(`${todo.length} to generate, ${jobs} at a time`)
const queue = [...todo]
await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, async () => {
  while (queue.length) await run(queue.shift())
}))
console.log(`done: ${shots.filter((s) => done(s.id)).length} of ${shots.length} have an image`)
