import { defineConfig, loadEnv, type ConfigEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig(({ mode }: ConfigEnv) => {
  const env = loadEnv(mode, '.', '')

  const runtimeEnv = (
    globalThis as { process?: { env?: Record<string, string | undefined> } }
  ).process?.env ?? {}

  const bffTarget = runtimeEnv.BFF_URL || env.BFF_URL || 'http://localhost:3001'

  return {
    plugins: [react()],
    server:
      mode === 'development'
        ? {
            port: 5176,
            strictPort: true,
            proxy: {
              '/api/v1': {
                target: bffTarget,
                changeOrigin: true,
              },
            },
          }
        : undefined,
  }
})


