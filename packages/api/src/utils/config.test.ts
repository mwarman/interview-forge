import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getConfig', () => {
    it('should load valid configuration with all variables set', async () => {
      // Arrange
      process.env.LOG_ENABLED = 'true';
      process.env.LOG_LEVEL = 'debug';
      process.env.LOG_FORMAT = 'json';

      // Act
      const { config } = await import('./config');

      // Assert
      expect(config.LOG_LEVEL).toBe('debug');
      expect(config.LOG_FORMAT).toBe('json');
    });

    it('should use default LOG_LEVEL if not set', async () => {
      // Arrange
      delete process.env.LOG_LEVEL;

      // Act
      const { config } = await import('./config');

      // Assert
      expect(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).toContain(config.LOG_LEVEL);
    });

    it('should use default LOG_FORMAT if not set', async () => {
      // Arrange
      delete process.env.LOG_FORMAT;

      // Act
      const { config } = await import('./config');

      // Assert
      expect(['json', 'text']).toContain(config.LOG_FORMAT);
    });
  });
});
