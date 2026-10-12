import { describe, it, expect } from 'vitest';
import { z } from 'zod';

import { toolArgsError, toolError } from './tool-result';

describe('tool-result', () => {
  describe('toolError', () => {
    it('should return an error result with the error type and message', () => {
      // Act
      const result = toolError('Not Found', 'Nothing here');

      // Assert
      expect(result).toEqual({ error: 'Not Found', message: 'Nothing here' });
    });
  });

  describe('toolArgsError', () => {
    it('should describe every validation issue with its path', () => {
      // Arrange
      const parsed = z.object({ jdId: z.string().min(1), sessionId: z.string() }).safeParse({ jdId: '' });

      // Act
      const result = toolArgsError(parsed.error as z.ZodError);

      // Assert
      expect(result.error).toBe('Invalid tool arguments');
      expect(result.message).toContain('jdId:');
      expect(result.message).toContain('sessionId:');
    });
  });
});
