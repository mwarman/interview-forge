import { describe, it, expect } from 'vitest';
import {
  QuestionRatingSchema,
  CompetencyNotesSchema,
  ScorecardSchema,
  type QuestionRating,
  type CompetencyNotes,
  type Scorecard,
} from './scorecard';

describe('QuestionRatingSchema', () => {
  describe('valid payloads', () => {
    it('should validate a complete question rating with all fields', () => {
      // Arrange
      const validRating: QuestionRating = {
        questionId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 4,
        notes: 'Candidate showed strong understanding',
      };

      // Act
      const result = QuestionRatingSchema.safeParse(validRating);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validRating);
      }
    });

    it('should validate a question rating without optional notes', () => {
      // Arrange
      const validRating: QuestionRating = {
        questionId: '223e4567-e89b-12d3-a456-426614174000',
        rating: 3,
      };

      // Act
      const result = QuestionRatingSchema.safeParse(validRating);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notes).toBeUndefined();
      }
    });

    it('should accept all valid Likert scale ratings (1-5)', () => {
      // Arrange & Act & Assert
      for (let rating = 1; rating <= 5; rating++) {
        const validRating = {
          questionId: '123e4567-e89b-12d3-a456-426614174000',
          rating,
        };
        const result = QuestionRatingSchema.safeParse(validRating);
        expect(result.success).toBe(true);
      }
    });

    it('should validate notes at maximum allowed length (1000 chars)', () => {
      // Arrange
      const longNotes = 'a'.repeat(1000);
      const validRating = {
        questionId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 5,
        notes: longNotes,
      };

      // Act
      const result = QuestionRatingSchema.safeParse(validRating);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notes).toHaveLength(1000);
      }
    });
  });

  describe('invalid payloads - rating out of range', () => {
    it('should reject rating of 0', () => {
      // Arrange
      const invalidRating = {
        questionId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 0,
      };

      // Act
      const result = QuestionRatingSchema.safeParse(invalidRating);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject rating of 6', () => {
      // Arrange
      const invalidRating = {
        questionId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 6,
      };

      // Act
      const result = QuestionRatingSchema.safeParse(invalidRating);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject negative rating', () => {
      // Arrange
      const invalidRating = {
        questionId: '123e4567-e89b-12d3-a456-426614174000',
        rating: -1,
      };

      // Act
      const result = QuestionRatingSchema.safeParse(invalidRating);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject floating point rating', () => {
      // Arrange
      const invalidRating = {
        questionId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 3.5,
      };

      // Act
      const result = QuestionRatingSchema.safeParse(invalidRating);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('invalid payloads - missing or invalid fields', () => {
    it('should reject rating with empty questionId', () => {
      // Arrange
      const invalidRating = {
        questionId: '',
        rating: 3,
      };

      // Act
      const result = QuestionRatingSchema.safeParse(invalidRating);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject rating with missing questionId', () => {
      // Arrange
      const invalidRating = {
        rating: 3,
      };

      // Act
      const result = QuestionRatingSchema.safeParse(invalidRating);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject rating with missing rating field', () => {
      // Arrange
      const invalidRating = {
        questionId: '123e4567-e89b-12d3-a456-426614174000',
      };

      // Act
      const result = QuestionRatingSchema.safeParse(invalidRating);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject notes exceeding maximum length (1000 chars)', () => {
      // Arrange
      const longNotes = 'a'.repeat(1001);
      const invalidRating = {
        questionId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 5,
        notes: longNotes,
      };

      // Act
      const result = QuestionRatingSchema.safeParse(invalidRating);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});

describe('CompetencyNotesSchema', () => {
  describe('valid payloads', () => {
    it('should validate a complete competency notes with all fields', () => {
      // Arrange
      const validCompetencyNotes: CompetencyNotes = {
        competencyId: '123e4567-e89b-12d3-a456-426614174000',
        overallNotes: 'Strong technical foundation with good communication',
        questionRatings: [
          {
            questionId: '223e4567-e89b-12d3-a456-426614174000',
            rating: 4,
            notes: 'Good answer',
          },
        ],
      };

      // Act
      const result = CompetencyNotesSchema.safeParse(validCompetencyNotes);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validCompetencyNotes);
      }
    });

    it('should validate competency notes without optional overallNotes', () => {
      // Arrange
      const validCompetencyNotes: CompetencyNotes = {
        competencyId: '123e4567-e89b-12d3-a456-426614174000',
        questionRatings: [
          {
            questionId: '223e4567-e89b-12d3-a456-426614174000',
            rating: 3,
          },
        ],
      };

      // Act
      const result = CompetencyNotesSchema.safeParse(validCompetencyNotes);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.overallNotes).toBeUndefined();
      }
    });

    it('should validate competency notes with multiple question ratings', () => {
      // Arrange
      const validCompetencyNotes: CompetencyNotes = {
        competencyId: '123e4567-e89b-12d3-a456-426614174000',
        overallNotes: 'Overall assessment',
        questionRatings: [
          {
            questionId: '223e4567-e89b-12d3-a456-426614174000',
            rating: 4,
          },
          {
            questionId: '323e4567-e89b-12d3-a456-426614174001',
            rating: 3,
            notes: 'Could improve',
          },
          {
            questionId: '423e4567-e89b-12d3-a456-426614174002',
            rating: 5,
          },
        ],
      };

      // Act
      const result = CompetencyNotesSchema.safeParse(validCompetencyNotes);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.questionRatings).toHaveLength(3);
      }
    });

    it('should validate overallNotes at maximum allowed length (2000 chars)', () => {
      // Arrange
      const longNotes = 'a'.repeat(2000);
      const validCompetencyNotes = {
        competencyId: '123e4567-e89b-12d3-a456-426614174000',
        overallNotes: longNotes,
        questionRatings: [
          {
            questionId: '223e4567-e89b-12d3-a456-426614174000',
            rating: 4,
          },
        ],
      };

      // Act
      const result = CompetencyNotesSchema.safeParse(validCompetencyNotes);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.overallNotes).toHaveLength(2000);
      }
    });
  });

  describe('invalid payloads - missing questionRatings', () => {
    it('should reject competency notes with empty questionRatings array', () => {
      // Arrange
      const invalidCompetencyNotes = {
        competencyId: '123e4567-e89b-12d3-a456-426614174000',
        questionRatings: [],
      };

      // Act
      const result = CompetencyNotesSchema.safeParse(invalidCompetencyNotes);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject competency notes with missing questionRatings field', () => {
      // Arrange
      const invalidCompetencyNotes = {
        competencyId: '123e4567-e89b-12d3-a456-426614174000',
        overallNotes: 'Some notes',
      };

      // Act
      const result = CompetencyNotesSchema.safeParse(invalidCompetencyNotes);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('invalid payloads - invalid fields', () => {
    it('should reject competency notes with empty competencyId', () => {
      // Arrange
      const invalidCompetencyNotes = {
        competencyId: '',
        questionRatings: [
          {
            questionId: '223e4567-e89b-12d3-a456-426614174000',
            rating: 3,
          },
        ],
      };

      // Act
      const result = CompetencyNotesSchema.safeParse(invalidCompetencyNotes);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject competency notes with overallNotes exceeding maximum length (2000 chars)', () => {
      // Arrange
      const longNotes = 'a'.repeat(2001);
      const invalidCompetencyNotes = {
        competencyId: '123e4567-e89b-12d3-a456-426614174000',
        overallNotes: longNotes,
        questionRatings: [
          {
            questionId: '223e4567-e89b-12d3-a456-426614174000',
            rating: 4,
          },
        ],
      };

      // Act
      const result = CompetencyNotesSchema.safeParse(invalidCompetencyNotes);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject competency notes with invalid question rating', () => {
      // Arrange
      const invalidCompetencyNotes = {
        competencyId: '123e4567-e89b-12d3-a456-426614174000',
        questionRatings: [
          {
            questionId: '223e4567-e89b-12d3-a456-426614174000',
            rating: 6, // Invalid: out of range
          },
        ],
      };

      // Act
      const result = CompetencyNotesSchema.safeParse(invalidCompetencyNotes);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});

describe('ScorecardSchema', () => {
  describe('valid payloads', () => {
    it('should validate a complete scorecard with all required fields', () => {
      // Arrange
      const validScorecard: Scorecard = {
        scorecardId: '123e4567-e89b-12d3-a456-426614174000',
        completedAt: '2026-06-15T10:30:00Z',
        competencyScores: [
          {
            competencyId: '223e4567-e89b-12d3-a456-426614174000',
            overallNotes: 'Excellent leadership skills',
            questionRatings: [
              {
                questionId: '323e4567-e89b-12d3-a456-426614174000',
                rating: 5,
                notes: 'Outstanding',
              },
            ],
          },
        ],
      };

      // Act
      const result = ScorecardSchema.safeParse(validScorecard);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validScorecard);
      }
    });

    it('should validate a scorecard with multiple competency scores', () => {
      // Arrange
      const validScorecard: Scorecard = {
        scorecardId: '123e4567-e89b-12d3-a456-426614174000',
        completedAt: '2026-06-15T15:45:30Z',
        competencyScores: [
          {
            competencyId: '223e4567-e89b-12d3-a456-426614174000',
            questionRatings: [
              {
                questionId: '323e4567-e89b-12d3-a456-426614174000',
                rating: 4,
              },
            ],
          },
          {
            competencyId: '323e4567-e89b-12d3-a456-426614174001',
            overallNotes: 'Technical depth noted',
            questionRatings: [
              {
                questionId: '423e4567-e89b-12d3-a456-426614174001',
                rating: 5,
                notes: 'Excellent',
              },
              {
                questionId: '523e4567-e89b-12d3-a456-426614174002',
                rating: 3,
              },
            ],
          },
        ],
      };

      // Act
      const result = ScorecardSchema.safeParse(validScorecard);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.competencyScores).toHaveLength(2);
      }
    });

    it('should validate ISO 8601 timestamp format', () => {
      // Arrange
      const validScorecard: Scorecard = {
        scorecardId: '123e4567-e89b-12d3-a456-426614174000',
        completedAt: '2026-06-15T14:30:00Z',
        competencyScores: [
          {
            competencyId: '223e4567-e89b-12d3-a456-426614174000',
            questionRatings: [
              {
                questionId: '323e4567-e89b-12d3-a456-426614174000',
                rating: 4,
              },
            ],
          },
        ],
      };

      // Act
      const result = ScorecardSchema.safeParse(validScorecard);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.completedAt).toBe('2026-06-15T14:30:00Z');
      }
    });
  });

  describe('invalid payloads - missing competencyScores', () => {
    it('should reject scorecard with empty competencyScores array', () => {
      // Arrange
      const invalidScorecard = {
        scorecardId: '123e4567-e89b-12d3-a456-426614174000',
        completedAt: '2026-06-15T10:30:00Z',
        competencyScores: [],
      };

      // Act
      const result = ScorecardSchema.safeParse(invalidScorecard);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject scorecard with missing competencyScores field', () => {
      // Arrange
      const invalidScorecard = {
        scorecardId: '123e4567-e89b-12d3-a456-426614174000',
        completedAt: '2026-06-15T10:30:00Z',
      };

      // Act
      const result = ScorecardSchema.safeParse(invalidScorecard);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('invalid payloads - invalid fields', () => {
    it('should reject scorecard with empty scorecardId', () => {
      // Arrange
      const invalidScorecard = {
        scorecardId: '',
        completedAt: '2026-06-15T10:30:00Z',
        competencyScores: [
          {
            competencyId: '223e4567-e89b-12d3-a456-426614174000',
            questionRatings: [
              {
                questionId: '323e4567-e89b-12d3-a456-426614174000',
                rating: 4,
              },
            ],
          },
        ],
      };

      // Act
      const result = ScorecardSchema.safeParse(invalidScorecard);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject scorecard with missing scorecardId', () => {
      // Arrange
      const invalidScorecard = {
        completedAt: '2026-06-15T10:30:00Z',
        competencyScores: [
          {
            competencyId: '223e4567-e89b-12d3-a456-426614174000',
            questionRatings: [
              {
                questionId: '323e4567-e89b-12d3-a456-426614174000',
                rating: 4,
              },
            ],
          },
        ],
      };

      // Act
      const result = ScorecardSchema.safeParse(invalidScorecard);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject scorecard with invalid ISO timestamp', () => {
      // Arrange
      const invalidScorecard = {
        scorecardId: '123e4567-e89b-12d3-a456-426614174000',
        completedAt: 'not-a-timestamp',
        competencyScores: [
          {
            competencyId: '223e4567-e89b-12d3-a456-426614174000',
            questionRatings: [
              {
                questionId: '323e4567-e89b-12d3-a456-426614174000',
                rating: 4,
              },
            ],
          },
        ],
      };

      // Act
      const result = ScorecardSchema.safeParse(invalidScorecard);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject scorecard with missing completedAt', () => {
      // Arrange
      const invalidScorecard = {
        scorecardId: '123e4567-e89b-12d3-a456-426614174000',
        competencyScores: [
          {
            competencyId: '223e4567-e89b-12d3-a456-426614174000',
            questionRatings: [
              {
                questionId: '323e4567-e89b-12d3-a456-426614174000',
                rating: 4,
              },
            ],
          },
        ],
      };

      // Act
      const result = ScorecardSchema.safeParse(invalidScorecard);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject scorecard with invalid competency score', () => {
      // Arrange
      const invalidScorecard = {
        scorecardId: '123e4567-e89b-12d3-a456-426614174000',
        completedAt: '2026-06-15T10:30:00Z',
        competencyScores: [
          {
            competencyId: '223e4567-e89b-12d3-a456-426614174000',
            questionRatings: [], // Invalid: empty array
          },
        ],
      };

      // Act
      const result = ScorecardSchema.safeParse(invalidScorecard);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});
