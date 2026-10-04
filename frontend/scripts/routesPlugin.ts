import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

/**
 * GitHub Pages only serves files, so each app route gets a copy of index.html (a real 200
 * response, unlike the 404.html fallback, which still covers any other path).
 */
export function routesPlugin(routes: readonly string[]): Plugin {
  let outDir = 'dist'
  return {
    name: 'routes',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const index = path.join(outDir, 'index.html')
      if (!fs.existsSync(index)) return
      const html = fs.readFileSync(index, 'utf8')
      // Only the schedule page uses the preloaded schedule; other pages would waste it.
      const withoutSchedule = html.replace(/<link rel="preload"[^>]*as="fetch"[^>]*>\s*/, '')
      for (const route of routes) {
        const dir = path.join(outDir, route)
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(path.join(dir, 'index.html'), withoutSchedule)
      }
      fs.writeFileSync(path.join(outDir, '404.html'), html)
    },
  }
}
