import { describe, it, expect } from 'vitest';
import { PLAN_GENERATION_SYSTEM_PROMPT, RECONCILIATION_SYSTEM_PROMPT } from './prompts';

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

describe('reconciliationSystemPrompt', () => {
  it('should be a non-empty string', () => {
    // Arrange / Act / Assert
    expect(typeof RECONCILIATION_SYSTEM_PROMPT).toBe('string');
    expect(RECONCILIATION_SYSTEM_PROMPT.length).toBeGreaterThan(0);
  });

  it('should reference the read-plan-action function name', () => {
    // Arrange / Act / Assert
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('read-plan-action');
  });

  it('should reference the read-scorecard-action function name', () => {
    // Arrange / Act / Assert
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('read-scorecard-action');
  });

  it('should reference the write-assessment-action function name', () => {
    // Arrange / Act / Assert
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('write-assessment-action');
  });

  it('should reference the interview-forge-read-plan action group name', () => {
    // Arrange / Act / Assert
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('interview-forge-read-plan');
  });

  it('should reference the interview-forge-read-scorecard action group name', () => {
    // Arrange / Act / Assert
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('interview-forge-read-scorecard');
  });

  it('should reference the interview-forge-write-assessment action group name', () => {
    // Arrange / Act / Assert
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('interview-forge-write-assessment');
  });

  it('should include explicit conflict detection rules', () => {
    // Arrange / Act / Assert
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('Conflict Detection Rules');
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('conflict');
  });

  it('should include guidance for conflict detection with ratings 4-5 and concerns', () => {
    // Arrange / Act / Assert
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('4 or 5');
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('concerns');
  });

  it('should include guidance for conflict detection with ratings 1-2 and strengths', () => {
    // Arrange / Act / Assert
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('1 or 2');
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('strengths');
  });

  it('should include the Assessment JSON schema structure', () => {
    // Arrange / Act / Assert
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('assessmentId');
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('recommendation');
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('confidence');
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('reasoning');
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('competencyAssessments');
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('generatedAt');
  });

  it('should document all four recommendation types', () => {
    // Arrange / Act / Assert
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('STRONG_HIRE');
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('HIRE');
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('NO_HIRE');
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('STRONG_NO_HIRE');
  });

  it('should document all three confidence levels', () => {
    // Arrange / Act / Assert
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('HIGH');
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('MEDIUM');
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('LOW');
  });

  it('should include guidance for UUID v4 format', () => {
    // Arrange / Act / Assert
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('UUID');
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('uuid');
  });

  it('should include guidance for ISO 8601 datetime format', () => {
    // Arrange / Act / Assert
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('ISO 8601');
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('datetime');
  });

  it('should include a minimum reasoning requirement (100 characters)', () => {
    // Arrange / Act / Assert
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('100 characters');
  });

  it('should include a concrete example Assessment JSON', () => {
    // Arrange / Act / Assert
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('123e4567-e89b-12d3-a456-426614174001');
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('System Design');
    expect(RECONCILIATION_SYSTEM_PROMPT).toContain('Conflict');
  });
});
