import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv, type HtmlTagDescriptor, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { backgroundsPlugin } from './scripts/backgroundsPlugin'
import { resolveApiOrigin, scheduleUrl } from './src/config/api'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

// Fonts needed for the first screen; the rest load on demand.
const CRITICAL_FONTS = /(caveat-title|dm-sans-latin-opsz-normal)-[\w-]+\.woff2$/

const cinemaPathAlias = (): Plugin => ({
  name: 'cinema-path-alias',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const url = (req as { url?: string }).url ?? '/'
      if (url === '/cinema' || url.startsWith('/cinema/')) {
        (req as { url?: string }).url = url.replace(/^\/cinema\/?/, '/') || '/'
      }
      next()
    })
  },
})

/**
 * Starts the schedule request and critical font downloads straight from the HTML, in
 * parallel with the JS bundle instead of after it.
 */
const preloadsPlugin = (scheduleHref: string): Plugin => {
  let base = '/'
  return {
    name: 'preloads',
    configResolved(config) {
      base = config.base
    },
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const tags: HtmlTagDescriptor[] = [
          { tag: 'link', attrs: { rel: 'preload', href: scheduleHref, as: 'fetch', crossorigin: 'anonymous' }, injectTo: 'head' },
        ]
        for (const file of Object.keys(ctx.bundle ?? {})) {
          if (!CRITICAL_FONTS.test(file)) continue
          tags.push({
            tag: 'link',
            attrs: { rel: 'preload', href: `${base}${file}`, as: 'font', type: 'font/woff2', crossorigin: 'anonymous' },
            injectTo: 'head',
          })
        }
        return tags
      },
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir)
  const apiOrigin = resolveApiOrigin(env.VITE_API_URL, mode)

  return {
    plugins: [
      react(),
      backgroundsPlugin(path.join(rootDir, 'public', 'backgrounds')),
      preloadsPlugin(scheduleUrl(apiOrigin)),
      ...(mode === 'development' ? [cinemaPathAlias()] : []),
    ],
    base: mode === 'production' ? '/cinema/' : '/',
  }
})
