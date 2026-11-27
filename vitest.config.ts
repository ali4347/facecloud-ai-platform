import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Test runner only; the app's build stays in vite.config.ts (untouched by tests).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
    restoreMocks: true,
  },
})
