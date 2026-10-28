// Downloads CC0 models from Poly Haven into public/models/<id>/ as 1k glTF.
//   node scripts/fetch-models.mjs modern_ceiling_lamp_01 ceramic_vase_02 ...
// Each model's glTF, its .bin and its textures keep the paths the glTF names.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'

const ids = process.argv.slice(2)
for (const id of ids) {
  const dir = join('public/models', id)
  if (existsSync(join(dir, `${id}.gltf`))) {
    console.log(`${id}: already here`)
    continue
  }
  const files = await (await fetch(`https://api.polyhaven.com/files/${id}`)).json()
  const g = files.gltf?.['1k']?.gltf
  if (!g) {
    console.log(`${id}: no 1k glTF`)
    continue
  }
  const get = async (url, to) => {
    mkdirSync(dirname(to), { recursive: true })
    writeFileSync(to, Buffer.from(await (await fetch(url)).arrayBuffer()))
  }
  await get(g.url, join(dir, `${id}.gltf`))
  for (const [path, f] of Object.entries(g.include ?? {})) await get(f.url, join(dir, path))
  console.log(`${id}: ${1 + Object.keys(g.include ?? {}).length} files`)
}
