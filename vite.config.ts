import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const apiTarget = env.SIGNALRANK_API_TARGET?.trim()
  const serviceToken = env.SIGNALRANK_SERVICE_TOKEN?.trim()

  return {
    plugins: [react()],
    server: {
      proxy: apiTarget
        ? {
            '/signalrank-api': {
              target: apiTarget,
              changeOrigin: true,
              
              rewrite: (path) => path.replace(/^\/signalrank-api/, ''),
              headers: serviceToken
                ? {
                    'X-SignalRank-Service-Token': serviceToken,
                  }
                : {},
            },
          }
      : undefined,
    },
  }
})