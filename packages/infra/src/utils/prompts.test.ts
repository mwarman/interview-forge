import { describe, it, expect } from 'vitest';
import { PLAN_GENERATION_SYSTEM_PROMPT } from './prompts';

describe('planGenerationSystemPrompt', () => {
  it('should be a non-empty string', () => {
    // Arrange / Act / Assert
    expect(typeof PLAN_GENERATION_SYSTEM_PROMPT).toBe('string');
    expect(PLAN_GENERATION_SYSTEM_PROMPT.length).toBeGreaterThan(0);
  });

  it('should reference the read-jd-action function name', () => {
    // Arrange / Act / Assert
    expect(PLAN_GENERATION_SYSTEM_PROMPT).toContain('read-jd-action');
  });

  it('should reference the write-plan-action function name', () => {
    // Arrange / Act / Assert
    expect(PLAN_GENERATION_SYSTEM_PROMPT).toContain('write-plan-action');
  });

  it('should reference the interview-forge-read-jd action group name', () => {
    // Arrange / Act / Assert
    expect(PLAN_GENERATION_SYSTEM_PROMPT).toContain('interview-forge-read-jd');
  });

  it('should reference the interview-forge-write-plan action group name', () => {
    // Arrange / Act / Assert
    expect(PLAN_GENERATION_SYSTEM_PROMPT).toContain('interview-forge-write-plan');
  });

  it('should instruct the agent to identify 4-8 competency areas', () => {
    // Arrange / Act / Assert
    expect(PLAN_GENERATION_SYSTEM_PROMPT).toContain('4 and 8');
  });

  it('should instruct the agent to generate 3-5 questions per competency', () => {
    // Arrange / Act / Assert
    expect(PLAN_GENERATION_SYSTEM_PROMPT).toContain('3 and 5');
  });

  it('should include the InterviewPlan JSON schema structure', () => {
    // Arrange / Act / Assert
    expect(PLAN_GENERATION_SYSTEM_PROMPT).toContain('planId');
    expect(PLAN_GENERATION_SYSTEM_PROMPT).toContain('competencies');
    expect(PLAN_GENERATION_SYSTEM_PROMPT).toContain('competencyId');
    expect(PLAN_GENERATION_SYSTEM_PROMPT).toContain('questionId');
    expect(PLAN_GENERATION_SYSTEM_PROMPT).toContain('generatedAt');
  });

  it('should document all three question types (BEHAVIORAL, SITUATIONAL, TECHNICAL)', () => {
    // Arrange / Act / Assert
    expect(PLAN_GENERATION_SYSTEM_PROMPT).toContain('BEHAVIORAL');
    expect(PLAN_GENERATION_SYSTEM_PROMPT).toContain('SITUATIONAL');
    expect(PLAN_GENERATION_SYSTEM_PROMPT).toContain('TECHNICAL');
  });

  it('should include guidance for UUID v4 format', () => {
    // Arrange / Act / Assert
    expect(PLAN_GENERATION_SYSTEM_PROMPT).toContain('UUID');
    expect(PLAN_GENERATION_SYSTEM_PROMPT).toContain('uuid');
  });

  it('should include guidance for ISO 8601 datetime format', () => {
    // Arrange / Act / Assert
    expect(PLAN_GENERATION_SYSTEM_PROMPT).toContain('ISO 8601');
    expect(PLAN_GENERATION_SYSTEM_PROMPT).toContain('datetime');
  });

  it('should include a concrete example InterviewPlan JSON', () => {
    // Arrange / Act / Assert
    expect(PLAN_GENERATION_SYSTEM_PROMPT).toContain('550e8400-e29b-41d4-a716-446655440000');
    expect(PLAN_GENERATION_SYSTEM_PROMPT).toContain('System Design');
    expect(PLAN_GENERATION_SYSTEM_PROMPT).toContain('Leadership');
  });
});
