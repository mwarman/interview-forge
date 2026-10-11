import { defineConfig, mergeConfig } from 'vitest/config';
import path from 'path';

import baseConfig from '../../vitest.config.ts';

/**
 * Vitest configuration for the API package.
 * Extends the base configuration with API-specific settings.
 */
export default mergeConfig(
  baseConfig,
  defineConfig({
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    test: {
      setupFiles: './vitest.setup.ts',
    },
  }),
);
