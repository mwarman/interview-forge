import { describe, it, expect } from 'vitest';
import {
  QuestionTypeSchema,
  QuestionSchema,
  CompetencySchema,
  InterviewPlanSchema,
  type Competency,
  type InterviewPlan,
} from './interview-plan';

describe('QuestionTypeSchema', () => {
  describe('valid enum values', () => {
    it('should accept BEHAVIORAL', () => {
      // Arrange & Act
      const result = QuestionTypeSchema.safeParse('BEHAVIORAL');

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept SITUATIONAL', () => {
      // Arrange & Act
      const result = QuestionTypeSchema.safeParse('SITUATIONAL');

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept TECHNICAL', () => {
      // Arrange & Act
      const result = QuestionTypeSchema.safeParse('TECHNICAL');

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('invalid enum values', () => {
    it('should reject invalid question type', () => {
      // Arrange & Act
      const result = QuestionTypeSchema.safeParse('INVALID_TYPE');

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject lowercase question type', () => {
      // Arrange & Act
      const result = QuestionTypeSchema.safeParse('behavioral');

      // Assert
      expect(result.success).toBe(false);
    });
  });
});

describe('QuestionSchema', () => {
  describe('valid payloads', () => {
    it('should validate a complete question with all required fields', () => {
      // Arrange
      const validQuestion = {
        questionId: '123e4567-e89b-12d3-a456-426614174000',
        text: 'Tell me about a time you overcame a challenge',
        type: 'BEHAVIORAL' as const,
        followUpPrompt: 'How did you handle the situation?',
      };

      // Act
      const result = QuestionSchema.safeParse(validQuestion);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validQuestion);
      }
    });

    it('should validate a question without optional followUpPrompt', () => {
      // Arrange
      const validQuestion = {
        questionId: '123e4567-e89b-12d3-a456-426614174000',
        text: 'Explain the concept of polymorphism',
        type: 'TECHNICAL' as const,
      };

      // Act
      const result = QuestionSchema.safeParse(validQuestion);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.followUpPrompt).toBeUndefined();
      }
    });

    it('should accept different question types', () => {
      // Arrange
      const situationalQuestion = {
        questionId: '223e4567-e89b-12d3-a456-426614174000',
        text: 'How would you respond to critical feedback?',
        type: 'SITUATIONAL' as const,
      };

      // Act
      const result = QuestionSchema.safeParse(situationalQuestion);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('invalid payloads', () => {
    it('should reject question with invalid questionId', () => {
      // Arrange
      const invalidQuestion = {
        questionId: '',
        text: 'Valid question text',
        type: 'BEHAVIORAL' as const,
      };

      // Act
      const result = QuestionSchema.safeParse(invalidQuestion);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject question with empty text', () => {
      // Arrange
      const invalidQuestion = {
        questionId: '123e4567-e89b-12d3-a456-426614174000',
        text: '',
        type: 'BEHAVIORAL' as const,
      };

      // Act
      const result = QuestionSchema.safeParse(invalidQuestion);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject question with invalid type enum', () => {
      // Arrange
      const invalidQuestion = {
        questionId: '123e4567-e89b-12d3-a456-426614174000',
        text: 'Valid question',
        type: 'INVALID_TYPE',
      };

      // Act
      const result = QuestionSchema.safeParse(invalidQuestion);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});

describe('CompetencySchema', () => {
  describe('valid payloads', () => {
    it('should validate a complete competency with required fields and questions', () => {
      // Arrange
      const validCompetency: Competency = {
        competencyId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Leadership',
        description: 'Ability to guide and influence teams',
        evaluationCriteria: 'Demonstrates vision, decision-making, and team empowerment',
        questions: [
          {
            questionId: '223e4567-e89b-12d3-a456-426614174000',
            text: 'Describe your leadership philosophy',
            type: 'BEHAVIORAL' as const,
          },
        ],
      };

      // Act
      const result = CompetencySchema.safeParse(validCompetency);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.questions).toHaveLength(1);
      }
    });

    it('should validate competency with multiple questions', () => {
      // Arrange
      const validCompetency: Competency = {
        competencyId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Technical Expertise',
        description: 'Core technical knowledge and problem-solving skills',
        evaluationCriteria: 'Demonstrates mastery of relevant technologies and design patterns',
        questions: [
          {
            questionId: '223e4567-e89b-12d3-a456-426614174001',
            text: 'Explain design patterns you commonly use',
            type: 'TECHNICAL' as const,
          },
          {
            questionId: '323e4567-e89b-12d3-a456-426614174002',
            text: 'How do you stay updated with new technologies?',
            type: 'BEHAVIORAL' as const,
            followUpPrompt: 'Can you provide a specific example?',
          },
        ],
      };

      // Act
      const result = CompetencySchema.safeParse(validCompetency);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.questions).toHaveLength(2);
      }
    });
  });

  describe('invalid payloads', () => {
    it('should reject competency with empty questions array', () => {
      // Arrange
      const invalidCompetency = {
        competencyId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Leadership',
        description: 'Ability to guide and influence teams',
        evaluationCriteria: 'Demonstrates vision and decision-making',
        questions: [],
      };

      // Act
      const result = CompetencySchema.safeParse(invalidCompetency);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject competency with missing name', () => {
      // Arrange
      const invalidCompetency = {
        competencyId: '123e4567-e89b-12d3-a456-426614174000',
        name: '',
        description: 'Ability to guide and influence teams',
        evaluationCriteria: 'Demonstrates vision and decision-making',
        questions: [
          {
            questionId: '223e4567-e89b-12d3-a456-426614174000',
            text: 'Leadership question',
            type: 'BEHAVIORAL' as const,
          },
        ],
      };

      // Act
      const result = CompetencySchema.safeParse(invalidCompetency);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject competency with missing evaluationCriteria', () => {
      // Arrange
      const invalidCompetency = {
        competencyId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Leadership',
        description: 'Ability to guide and influence teams',
        evaluationCriteria: '',
        questions: [
          {
            questionId: '223e4567-e89b-12d3-a456-426614174000',
            text: 'Leadership question',
            type: 'BEHAVIORAL' as const,
          },
        ],
      };

      // Act
      const result = CompetencySchema.safeParse(invalidCompetency);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject competency with invalid question in array', () => {
      // Arrange
      const invalidCompetency = {
        competencyId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Leadership',
        description: 'Ability to guide and influence teams',
        evaluationCriteria: 'Demonstrates vision and decision-making',
        questions: [
          {
            questionId: '',
            text: 'Leadership question',
            type: 'BEHAVIORAL' as const,
          },
        ],
      };

      // Act
      const result = CompetencySchema.safeParse(invalidCompetency);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});

describe('InterviewPlanSchema', () => {
  describe('valid payloads', () => {
    it('should validate a complete interview plan with one competency', () => {
      // Arrange
      const validPlan: InterviewPlan = {
        planId: '123e4567-e89b-12d3-a456-426614174000',
        competencies: [
          {
            competencyId: '223e4567-e89b-12d3-a456-426614174000',
            name: 'Communication',
            description: 'Ability to communicate clearly and effectively',
            evaluationCriteria: 'Demonstrates clarity, listening, and adaptability',
            questions: [
              {
                questionId: '323e4567-e89b-12d3-a456-426614174000',
                text: 'How do you handle difficult conversations?',
                type: 'BEHAVIORAL' as const,
              },
            ],
          },
        ],
        generatedAt: '2026-06-03T11:00:00Z',
      };

      // Act
      const result = InterviewPlanSchema.safeParse(validPlan);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.competencies).toHaveLength(1);
      }
    });

    it('should validate a plan with maximum 8 competencies', () => {
      // Arrange
      const competencies = Array.from({ length: 8 }, (_, i) => ({
        competencyId: `${i}23e4567-e89b-12d3-a456-426614174000`,
        name: `Competency ${i + 1}`,
        description: `Description for competency ${i + 1}`,
        evaluationCriteria: `Criteria ${i + 1}`,
        questions: [
          {
            questionId: `${i}a3e4567-e89b-12d3-a456-426614174000`,
            text: `Question for competency ${i + 1}`,
            type: 'TECHNICAL' as const,
          },
        ],
      }));

      const validPlan: InterviewPlan = {
        planId: '123e4567-e89b-12d3-a456-426614174000',
        competencies,
        generatedAt: '2026-06-03T11:00:00Z',
      };

      // Act
      const result = InterviewPlanSchema.safeParse(validPlan);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.competencies).toHaveLength(8);
      }
    });

    it('should validate a plan with multiple competencies and diverse question types', () => {
      // Arrange
      const validPlan: InterviewPlan = {
        planId: '123e4567-e89b-12d3-a456-426614174000',
        competencies: [
          {
            competencyId: '223e4567-e89b-12d3-a456-426614174000',
            name: 'Leadership',
            description: 'Team guidance and decision-making',
            evaluationCriteria: 'Shows vision and empowerment',
            questions: [
              {
                questionId: '323e4567-e89b-12d3-a456-426614174000',
                text: 'Describe your leadership approach',
                type: 'BEHAVIORAL' as const,
                followUpPrompt: 'Can you provide a specific example?',
              },
            ],
          },
          {
            competencyId: '323e4567-e89b-12d3-a456-426614174001',
            name: 'Problem-Solving',
            description: 'Analytical and critical thinking skills',
            evaluationCriteria: 'Demonstrates structured approach and creativity',
            questions: [
              {
                questionId: '423e4567-e89b-12d3-a456-426614174000',
                text: 'How would you debug a complex issue?',
                type: 'SITUATIONAL' as const,
              },
            ],
          },
        ],
        generatedAt: '2026-06-03T11:00:00Z',
      };

      // Act
      const result = InterviewPlanSchema.safeParse(validPlan);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.competencies).toHaveLength(2);
      }
    });
  });

  describe('invalid payloads', () => {
    it('should reject plan with empty competencies array', () => {
      // Arrange
      const invalidPlan = {
        planId: '123e4567-e89b-12d3-a456-426614174000',
        competencies: [],
        generatedAt: '2026-06-03T11:00:00Z',
      };

      // Act
      const result = InterviewPlanSchema.safeParse(invalidPlan);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject plan with more than 8 competencies', () => {
      // Arrange
      const competencies = Array.from({ length: 9 }, (_, i) => ({
        competencyId: `${i}23e4567-e89b-12d3-a456-426614174000`,
        name: `Competency ${i + 1}`,
        description: `Description for competency ${i + 1}`,
        evaluationCriteria: `Criteria ${i + 1}`,
        questions: [
          {
            questionId: `${i}a3e4567-e89b-12d3-a456-426614174000`,
            text: `Question for competency ${i + 1}`,
            type: 'TECHNICAL' as const,
          },
        ],
      }));

      const invalidPlan = {
        planId: '123e4567-e89b-12d3-a456-426614174000',
        competencies,
        generatedAt: '2026-06-03T11:00:00Z',
      };

      // Act
      const result = InterviewPlanSchema.safeParse(invalidPlan);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject plan with invalid planId', () => {
      // Arrange
      const invalidPlan = {
        planId: '',
        competencies: [
          {
            competencyId: '223e4567-e89b-12d3-a456-426614174000',
            name: 'Leadership',
            description: 'Team guidance',
            evaluationCriteria: 'Shows vision',
            questions: [
              {
                questionId: '323e4567-e89b-12d3-a456-426614174000',
                text: 'Leadership question',
                type: 'BEHAVIORAL' as const,
              },
            ],
          },
        ],
        generatedAt: '2026-06-03T11:00:00Z',
      };

      // Act
      const result = InterviewPlanSchema.safeParse(invalidPlan);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject plan with invalid ISO datetime', () => {
      // Arrange
      const invalidPlan = {
        planId: '123e4567-e89b-12d3-a456-426614174000',
        competencies: [
          {
            competencyId: '223e4567-e89b-12d3-a456-426614174000',
            name: 'Leadership',
            description: 'Team guidance',
            evaluationCriteria: 'Shows vision',
            questions: [
              {
                questionId: '323e4567-e89b-12d3-a456-426614174000',
                text: 'Leadership question',
                type: 'BEHAVIORAL' as const,
              },
            ],
          },
        ],
        generatedAt: '2026-06-03',
      };

      // Act
      const result = InterviewPlanSchema.safeParse(invalidPlan);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject plan with invalid competency in array', () => {
      // Arrange
      const invalidPlan = {
        planId: '123e4567-e89b-12d3-a456-426614174000',
        competencies: [
          {
            competencyId: '223e4567-e89b-12d3-a456-426614174000',
            name: 'Leadership',
            description: 'Team guidance',
            evaluationCriteria: 'Shows vision',
            questions: [],
          },
        ],
        generatedAt: '2026-06-03T11:00:00Z',
      };

      // Act
      const result = InterviewPlanSchema.safeParse(invalidPlan);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});
