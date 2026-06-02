import { defineConfig } from 'vitest/config';

/**
 * Base Vitest configuration for the Interview Forge project.
 * This configuration is extended by individual package configurations.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules', 'dist', '**/__fixtures__/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['node_modules', 'dist', '**/__fixtures__/**'],
    },
  },
});
