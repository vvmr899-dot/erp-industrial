import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setupTests.js'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,jsx,ts,tsx}'],
  },
});
