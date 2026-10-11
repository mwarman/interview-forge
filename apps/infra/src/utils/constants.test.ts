import { describe, expect, it } from 'vitest';

import { CLAUDE_SONNET_4_6_MODEL_ID, CLAUDE_HAIKU_4_5_MODEL_ID } from './constants';

describe('constants', () => {
  it('should have the correct model identifiers', () => {
    // Arrange, Act & Assert
    expect(CLAUDE_SONNET_4_6_MODEL_ID).toBe('anthropic.claude-sonnet-4-6');
    expect(CLAUDE_HAIKU_4_5_MODEL_ID).toBe('anthropic.claude-haiku-4-5-20251001-v1:0');
  });
});
