import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

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

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'development' ? [cinemaPathAlias()] : [])],
  base: mode === 'production' ? '/cinema/' : '/',
}))
