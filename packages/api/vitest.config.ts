import { defineConfig, mergeConfig } from 'vitest/config';
import path from 'path';

import baseConfig from '../../vitest.config';

/**
 * Vitest configuration for the API package.
 * Extends the base configuration with API-specific settings.
 */
export default mergeConfig(
  baseConfig,
  defineConfig({
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    test: {
      setupFiles: './vitest.setup.ts',
    },
  }),
);
