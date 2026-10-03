// Usage: yarn optimize-background path/to/still.jpg [name]
// Writes public/backgrounds/<name>.avif and .webp, resized to 1600px wide. Backgrounds are
// shown faded behind a wash, so aggressive compression is invisible but saves ~70-85%.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const [source, name = path.parse(source ?? '').name] = process.argv.slice(2)
if (!source) {
  console.error('Usage: yarn optimize-background <image> [name]')
  process.exit(1)
}

const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'backgrounds')
const image = sharp(source).resize({ width: 1600, withoutEnlargement: true })

const outputs = [
  ['avif', image.clone().avif({ quality: 45, effort: 6 })],
  ['webp', image.clone().webp({ quality: 60, effort: 6 })],
]
for (const [ext, pipeline] of outputs) {
  const file = path.join(outDir, `${name}.${ext}`)
  const { size } = await pipeline.toFile(file)
  console.log(`${file} (${Math.round(size / 1024)} KB)`)
}
