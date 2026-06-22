import { describe, it, expect } from 'vitest';
import {
  RecommendationSchema,
  ConfidenceSchema,
  CompetencyAssessmentSchema,
  AssessmentSchema,
  type CompetencyAssessment,
  type Assessment,
} from './assessment';

describe('RecommendationSchema', () => {
  describe('valid enum values', () => {
    it('should accept HIRE', () => {
      // Arrange & Act
      const result = RecommendationSchema.safeParse('HIRE');

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept NO_HIRE', () => {
      // Arrange & Act
      const result = RecommendationSchema.safeParse('NO_HIRE');

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept STRONG_HIRE', () => {
      // Arrange & Act
      const result = RecommendationSchema.safeParse('STRONG_HIRE');

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept STRONG_NO_HIRE', () => {
      // Arrange & Act
      const result = RecommendationSchema.safeParse('STRONG_NO_HIRE');

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('invalid enum values', () => {
    it('should reject invalid recommendation type', () => {
      // Arrange & Act
      const result = RecommendationSchema.safeParse('INVALID_RECOMMENDATION');

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject lowercase recommendation', () => {
      // Arrange & Act
      const result = RecommendationSchema.safeParse('hire');

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject null value', () => {
      // Arrange & Act
      const result = RecommendationSchema.safeParse(null);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});

describe('ConfidenceSchema', () => {
  describe('valid enum values', () => {
    it('should accept HIGH', () => {
      // Arrange & Act
      const result = ConfidenceSchema.safeParse('HIGH');

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept MEDIUM', () => {
      // Arrange & Act
      const result = ConfidenceSchema.safeParse('MEDIUM');

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept LOW', () => {
      // Arrange & Act
      const result = ConfidenceSchema.safeParse('LOW');

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('invalid enum values', () => {
    it('should reject invalid confidence type', () => {
      // Arrange & Act
      const result = ConfidenceSchema.safeParse('INVALID_CONFIDENCE');

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject lowercase confidence', () => {
      // Arrange & Act
      const result = ConfidenceSchema.safeParse('high');

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject numeric value', () => {
      // Arrange & Act
      const result = ConfidenceSchema.safeParse(5);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});

describe('CompetencyAssessmentSchema', () => {
  describe('valid payloads', () => {
    it('should accept valid competency assessment', () => {
      // Arrange
      const validAssessment: CompetencyAssessment = {
        competencyId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'System Design',
        strengths: 'Excellent understanding of scalability patterns and microservices architecture',
        concerns: 'Limited experience with real-time systems and distributed consensus',
        conflictsIdentified: [],
      };

      // Act
      const result = CompetencyAssessmentSchema.safeParse(validAssessment);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept competency assessment with conflicts identified', () => {
      // Arrange
      const assessmentWithConflicts: CompetencyAssessment = {
        competencyId: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Communication',
        strengths: 'Clear and articulate in presenting technical concepts',
        concerns: 'Occasional difficulty in handling difficult feedback',
        conflictsIdentified: [
          'Some interviewers noted minimal engagement',
          'Other interviewers noted strong engagement',
        ],
      };

      // Act
      const result = CompetencyAssessmentSchema.safeParse(assessmentWithConflicts);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('invalid payloads', () => {
    it('should reject assessment with empty competencyId', () => {
      // Arrange
      const invalidAssessment = {
        competencyId: '',
        name: 'System Design',
        strengths: 'Excellent understanding',
        concerns: 'Limited experience',
        conflictsIdentified: [],
      };

      // Act
      const result = CompetencyAssessmentSchema.safeParse(invalidAssessment);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject assessment with missing name', () => {
      // Arrange
      const invalidAssessment = {
        competencyId: '123e4567-e89b-12d3-a456-426614174000',
        strengths: 'Excellent understanding',
        concerns: 'Limited experience',
        conflictsIdentified: [],
      };

      // Act
      const result = CompetencyAssessmentSchema.safeParse(invalidAssessment);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject assessment with empty strengths', () => {
      // Arrange
      const invalidAssessment = {
        competencyId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'System Design',
        strengths: '',
        concerns: 'Limited experience',
        conflictsIdentified: [],
      };

      // Act
      const result = CompetencyAssessmentSchema.safeParse(invalidAssessment);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject assessment with empty concerns', () => {
      // Arrange
      const invalidAssessment = {
        competencyId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'System Design',
        strengths: 'Excellent understanding',
        concerns: '',
        conflictsIdentified: [],
      };

      // Act
      const result = CompetencyAssessmentSchema.safeParse(invalidAssessment);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject assessment with empty conflict description', () => {
      // Arrange
      const invalidAssessment = {
        competencyId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'System Design',
        strengths: 'Excellent understanding',
        concerns: 'Limited experience',
        conflictsIdentified: ['Valid conflict', ''],
      };

      // Act
      const result = CompetencyAssessmentSchema.safeParse(invalidAssessment);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});

describe('AssessmentSchema', () => {
  describe('valid payloads', () => {
    it('should accept valid assessment with HIRE recommendation', () => {
      // Arrange
      const validAssessment: Assessment = {
        assessmentId: '223e4567-e89b-12d3-a456-426614174000',
        recommendation: 'HIRE',
        confidence: 'HIGH',
        reasoning:
          'The candidate demonstrated strong technical fundamentals across all evaluated competencies. System design knowledge was particularly impressive with clear understanding of scalability patterns. Communication skills were evident during technical discussions. Minor gaps in distributed systems were noted but are addressable with continued experience.',
        competencyAssessments: [
          {
            competencyId: '123e4567-e89b-12d3-a456-426614174000',
            name: 'System Design',
            strengths: 'Excellent understanding of scalability patterns',
            concerns: 'Limited experience with distributed consensus',
            conflictsIdentified: [],
          },
          {
            competencyId: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Communication',
            strengths: 'Clear and articulate',
            concerns: 'Minimal engagement at times',
            conflictsIdentified: ['Interviewer A noted strong engagement', 'Interviewer B noted minimal engagement'],
          },
        ],
        generatedAt: '2026-06-22T10:30:00Z',
      };

      // Act
      const result = AssessmentSchema.safeParse(validAssessment);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept valid assessment with NO_HIRE recommendation', () => {
      // Arrange
      const validAssessment: Assessment = {
        assessmentId: '223e4567-e89b-12d3-a456-426614174001',
        recommendation: 'NO_HIRE',
        confidence: 'MEDIUM',
        reasoning:
          'While the candidate showed competence in several areas, significant gaps were identified in problem-solving approach and system design thinking. The candidate struggled with architectural decisions and had difficulty articulating trade-offs. Though foundational knowledge exists, the gaps suggest a misalignment with the role requirements at this time.',
        competencyAssessments: [
          {
            competencyId: '123e4567-e89b-12d3-a456-426614174000',
            name: 'System Design',
            strengths: 'Basic understanding of design patterns',
            concerns: 'Struggled with scalability considerations and trade-off analysis',
            conflictsIdentified: [],
          },
        ],
        generatedAt: '2026-06-22T10:30:00Z',
      };

      // Act
      const result = AssessmentSchema.safeParse(validAssessment);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept valid assessment with STRONG_HIRE recommendation', () => {
      // Arrange
      const validAssessment: Assessment = {
        assessmentId: '223e4567-e89b-12d3-a456-426614174002',
        recommendation: 'STRONG_HIRE',
        confidence: 'HIGH',
        reasoning:
          'Exceptional candidate who exceeded expectations across all evaluated competencies. Demonstrated mastery of system design with deep understanding of distributed systems, scalability, and performance optimization. Communication was clear and engaging. Problem-solving approach was methodical and insightful. Cultural fit and growth potential are excellent. Strong recommendation to proceed immediately.',
        competencyAssessments: [
          {
            competencyId: '123e4567-e89b-12d3-a456-426614174000',
            name: 'System Design',
            strengths:
              'Exceptional understanding of distributed systems, scalability patterns, and performance optimization techniques',
            concerns: 'None identified',
            conflictsIdentified: [],
          },
        ],
        generatedAt: '2026-06-22T10:30:00Z',
      };

      // Act
      const result = AssessmentSchema.safeParse(validAssessment);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept valid assessment with STRONG_NO_HIRE recommendation', () => {
      // Arrange
      const validAssessment: Assessment = {
        assessmentId: '223e4567-e89b-12d3-a456-426614174003',
        recommendation: 'STRONG_NO_HIRE',
        confidence: 'HIGH',
        reasoning:
          'Candidate demonstrated significant gaps across multiple evaluated competencies. Performance coding exercise revealed fundamental misunderstandings of algorithmic thinking. System design discussion exposed lack of architectural knowledge. Communication during interviews was unclear and often contradictory. Cultural fit concerns also emerged. Strong recommendation to decline and keep in network for future roles requiring different skill sets.',
        competencyAssessments: [
          {
            competencyId: '123e4567-e89b-12d3-a456-426614174000',
            name: 'System Design',
            strengths: 'Shows eagerness to learn',
            concerns: 'Significant gaps in fundamental architectural concepts and system thinking',
            conflictsIdentified: [],
          },
        ],
        generatedAt: '2026-06-22T10:30:00Z',
      };

      // Act
      const result = AssessmentSchema.safeParse(validAssessment);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept valid assessment with LOW confidence', () => {
      // Arrange
      const validAssessment: Assessment = {
        assessmentId: '223e4567-e89b-12d3-a456-426614174004',
        recommendation: 'HIRE',
        confidence: 'LOW',
        reasoning:
          'The candidate demonstrated some positive signals but significant uncertainties remain. Performance varied widely across different problem types. Some interviewers saw strong potential while others had concerns. More comprehensive evaluation or trial period might help clarify fit. Recommendation to hire with close mentoring and structured feedback during onboarding.',
        competencyAssessments: [
          {
            competencyId: '123e4567-e89b-12d3-a456-426614174000',
            name: 'System Design',
            strengths: 'Good grasp of fundamental concepts',
            concerns: 'Inconsistent performance on advanced topics',
            conflictsIdentified: ['Interviewer A saw strong potential', 'Interviewer B had concerns about depth'],
          },
        ],
        generatedAt: '2026-06-22T10:30:00Z',
      };

      // Act
      const result = AssessmentSchema.safeParse(validAssessment);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('invalid reasoning length', () => {
    it('should reject assessment with reasoning below 100 characters', () => {
      // Arrange
      const invalidAssessment = {
        assessmentId: '223e4567-e89b-12d3-a456-426614174000',
        recommendation: 'HIRE',
        confidence: 'HIGH',
        reasoning: 'Short reasoning text that is clearly below 100 characters in length.',
        competencyAssessments: [
          {
            competencyId: '123e4567-e89b-12d3-a456-426614174000',
            name: 'System Design',
            strengths: 'Good understanding',
            concerns: 'Limited experience',
            conflictsIdentified: [],
          },
        ],
        generatedAt: '2026-06-22T10:30:00Z',
      };

      // Act
      const result = AssessmentSchema.safeParse(invalidAssessment);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject assessment with exactly 99 character reasoning', () => {
      // Arrange
      const ninetyNineCharReasoning =
        'This is a test reasoning string that is exactly ninety nine characters long to test minimum length validation';
      const invalidAssessment = {
        assessmentId: '223e4567-e89b-12d3-a456-426614174000',
        recommendation: 'HIRE',
        confidence: 'HIGH',
        reasoning: ninetyNineCharReasoning.substring(0, 99),
        competencyAssessments: [
          {
            competencyId: '123e4567-e89b-12d3-a456-426614174000',
            name: 'System Design',
            strengths: 'Good understanding',
            concerns: 'Limited experience',
            conflictsIdentified: [],
          },
        ],
        generatedAt: '2026-06-22T10:30:00Z',
      };

      // Act
      const result = AssessmentSchema.safeParse(invalidAssessment);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should accept assessment with exactly 100 character reasoning', () => {
      // Arrange
      const oneHundredCharReasoning = 'a'.repeat(100);
      const validAssessment = {
        assessmentId: '223e4567-e89b-12d3-a456-426614174000',
        recommendation: 'HIRE',
        confidence: 'HIGH',
        reasoning: oneHundredCharReasoning,
        competencyAssessments: [
          {
            competencyId: '123e4567-e89b-12d3-a456-426614174000',
            name: 'System Design',
            strengths: 'Good understanding',
            concerns: 'Limited experience',
            conflictsIdentified: [],
          },
        ],
        generatedAt: '2026-06-22T10:30:00Z',
      };

      // Act
      const result = AssessmentSchema.safeParse(validAssessment);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('invalid enum values', () => {
    it('should reject assessment with invalid recommendation', () => {
      // Arrange
      const invalidAssessment = {
        assessmentId: '223e4567-e89b-12d3-a456-426614174000',
        recommendation: 'MAYBE_HIRE',
        confidence: 'HIGH',
        reasoning:
          'The candidate demonstrated strong technical fundamentals across all evaluated competencies. System design knowledge was particularly impressive with clear understanding of scalability patterns. Communication skills were evident during technical discussions.',
        competencyAssessments: [
          {
            competencyId: '123e4567-e89b-12d3-a456-426614174000',
            name: 'System Design',
            strengths: 'Good understanding',
            concerns: 'Limited experience',
            conflictsIdentified: [],
          },
        ],
        generatedAt: '2026-06-22T10:30:00Z',
      };

      // Act
      const result = AssessmentSchema.safeParse(invalidAssessment);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject assessment with invalid confidence', () => {
      // Arrange
      const invalidAssessment = {
        assessmentId: '223e4567-e89b-12d3-a456-426614174000',
        recommendation: 'HIRE',
        confidence: 'UNCERTAIN',
        reasoning:
          'The candidate demonstrated strong technical fundamentals across all evaluated competencies. System design knowledge was particularly impressive with clear understanding of scalability patterns. Communication skills were evident during technical discussions.',
        competencyAssessments: [
          {
            competencyId: '123e4567-e89b-12d3-a456-426614174000',
            name: 'System Design',
            strengths: 'Good understanding',
            concerns: 'Limited experience',
            conflictsIdentified: [],
          },
        ],
        generatedAt: '2026-06-22T10:30:00Z',
      };

      // Act
      const result = AssessmentSchema.safeParse(invalidAssessment);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('missing required fields', () => {
    it('should reject assessment with missing assessmentId', () => {
      // Arrange
      const invalidAssessment = {
        recommendation: 'HIRE',
        confidence: 'HIGH',
        reasoning:
          'The candidate demonstrated strong technical fundamentals across all evaluated competencies. System design knowledge was particularly impressive with clear understanding of scalability patterns.',
        competencyAssessments: [
          {
            competencyId: '123e4567-e89b-12d3-a456-426614174000',
            name: 'System Design',
            strengths: 'Good understanding',
            concerns: 'Limited experience',
            conflictsIdentified: [],
          },
        ],
        generatedAt: '2026-06-22T10:30:00Z',
      };

      // Act
      const result = AssessmentSchema.safeParse(invalidAssessment);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject assessment with missing competencyAssessments', () => {
      // Arrange
      const invalidAssessment = {
        assessmentId: '223e4567-e89b-12d3-a456-426614174000',
        recommendation: 'HIRE',
        confidence: 'HIGH',
        reasoning:
          'The candidate demonstrated strong technical fundamentals across all evaluated competencies. System design knowledge was particularly impressive with clear understanding of scalability patterns.',
        generatedAt: '2026-06-22T10:30:00Z',
      };

      // Act
      const result = AssessmentSchema.safeParse(invalidAssessment);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject assessment with empty competencyAssessments array', () => {
      // Arrange
      const invalidAssessment = {
        assessmentId: '223e4567-e89b-12d3-a456-426614174000',
        recommendation: 'HIRE',
        confidence: 'HIGH',
        reasoning:
          'The candidate demonstrated strong technical fundamentals across all evaluated competencies. System design knowledge was particularly impressive with clear understanding of scalability patterns.',
        competencyAssessments: [],
        generatedAt: '2026-06-22T10:30:00Z',
      };

      // Act
      const result = AssessmentSchema.safeParse(invalidAssessment);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject assessment with missing generatedAt', () => {
      // Arrange
      const invalidAssessment = {
        assessmentId: '223e4567-e89b-12d3-a456-426614174000',
        recommendation: 'HIRE',
        confidence: 'HIGH',
        reasoning:
          'The candidate demonstrated strong technical fundamentals across all evaluated competencies. System design knowledge was particularly impressive with clear understanding of scalability patterns.',
        competencyAssessments: [
          {
            competencyId: '123e4567-e89b-12d3-a456-426614174000',
            name: 'System Design',
            strengths: 'Good understanding',
            concerns: 'Limited experience',
            conflictsIdentified: [],
          },
        ],
      };

      // Act
      const result = AssessmentSchema.safeParse(invalidAssessment);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should accept assessment with single competency assessment', () => {
      // Arrange
      const validAssessment: Assessment = {
        assessmentId: '223e4567-e89b-12d3-a456-426614174000',
        recommendation: 'HIRE',
        confidence: 'HIGH',
        reasoning:
          'The candidate demonstrated strong technical fundamentals across all evaluated competencies. System design knowledge was particularly impressive with clear understanding of scalability patterns. Communication skills were evident.',
        competencyAssessments: [
          {
            competencyId: '123e4567-e89b-12d3-a456-426614174000',
            name: 'System Design',
            strengths: 'Excellent understanding of scalability patterns',
            concerns: 'Limited experience with distributed consensus',
            conflictsIdentified: [],
          },
        ],
        generatedAt: '2026-06-22T10:30:00Z',
      };

      // Act
      const result = AssessmentSchema.safeParse(validAssessment);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept assessment with multiple competency assessments', () => {
      // Arrange
      const validAssessment: Assessment = {
        assessmentId: '223e4567-e89b-12d3-a456-426614174000',
        recommendation: 'HIRE',
        confidence: 'HIGH',
        reasoning:
          'The candidate demonstrated strong technical fundamentals across all evaluated competencies. System design knowledge was particularly impressive with clear understanding of scalability patterns. Communication skills were evident throughout the interview process.',
        competencyAssessments: [
          {
            competencyId: '123e4567-e89b-12d3-a456-426614174000',
            name: 'System Design',
            strengths: 'Excellent understanding of scalability patterns',
            concerns: 'Limited experience with distributed consensus',
            conflictsIdentified: [],
          },
          {
            competencyId: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Communication',
            strengths: 'Clear and articulate',
            concerns: 'Minimal engagement at times',
            conflictsIdentified: [],
          },
          {
            competencyId: '123e4567-e89b-12d3-a456-426614174002',
            name: 'Problem Solving',
            strengths: 'Methodical approach to complex problems',
            concerns: 'Occasionally rushes to solutions',
            conflictsIdentified: [
              'Interviewer A praised problem solving approach',
              'Interviewer B noted rushing tendency',
            ],
          },
        ],
        generatedAt: '2026-06-22T10:30:00Z',
      };

      // Act
      const result = AssessmentSchema.safeParse(validAssessment);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should accept assessment with ISO string timestamp', () => {
      // Arrange
      const validAssessment = {
        assessmentId: '223e4567-e89b-12d3-a456-426614174000',
        recommendation: 'HIRE',
        confidence: 'HIGH',
        reasoning:
          'The candidate demonstrated strong technical fundamentals across all evaluated competencies. System design knowledge was particularly impressive with clear understanding of scalability patterns. Communication skills were evident.',
        competencyAssessments: [
          {
            competencyId: '123e4567-e89b-12d3-a456-426614174000',
            name: 'System Design',
            strengths: 'Good understanding',
            concerns: 'Limited experience',
            conflictsIdentified: [],
          },
        ],
        generatedAt: '2026-06-22T10:30:00Z',
      };

      // Act
      const result = AssessmentSchema.safeParse(validAssessment);

      // Assert
      expect(result.success).toBe(true);
    });
  });
});
