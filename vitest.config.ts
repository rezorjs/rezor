import type { ViteUserConfig } from 'vitest/config'
import { defineConfig } from 'vitest/config'

const config: ViteUserConfig = defineConfig({
  define: {
    __DEV__: true,
  },
  test: {
    watch: false,
    setupFiles: 'vitest.setup.ts',
    include: ['packages/**/__tests__/**/*.spec.ts'],
    sequence: {
      hooks: 'list',
    },
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html', 'json'],
      include: ['packages/*/src/**/*.ts', '!packages/*/src/index.ts'],
    },
  },
})

export default config
