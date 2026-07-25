import fs from 'node:fs'
import path from 'node:path'
import type { Plugin, ViteDevServer } from 'vite'

const IMAGE_EXT = /\.(jpe?g|png|webp|avif)$/i
const SLOT_MS = 60 * 1000

function listBackgroundFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((name) => IMAGE_EXT.test(name) && name !== 'manifest.json')
    .sort((a, b) => a.localeCompare(b))
}

function writeManifest(dir: string): string[] {
  fs.mkdirSync(dir, { recursive: true })
  const files = listBackgroundFiles(dir)
  fs.writeFileSync(
    path.join(dir, 'manifest.json'),
    `${JSON.stringify({ files, rotateEveryMs: SLOT_MS }, null, 2)}\n`,
  )
  return files
}

/** Scans public/backgrounds and writes manifest.json for the rotator. */
export function backgroundsManifestPlugin(backgroundsDir: string): Plugin {
  const refresh = () => writeManifest(backgroundsDir)

  return {
    name: 'backgrounds-manifest',
    buildStart() {
      refresh()
    },
    configureServer(server: ViteDevServer) {
      refresh()
      server.watcher.add(backgroundsDir)
      const onChange = (file: string) => {
        if (!file.startsWith(backgroundsDir)) return
        if (path.basename(file) === 'manifest.json') return
        refresh()
      }
      server.watcher.on('add', onChange)
      server.watcher.on('unlink', onChange)
      server.watcher.on('change', onChange)
    },
  }
}
