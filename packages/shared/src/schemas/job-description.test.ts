import { describe, it, expect } from 'vitest';
import { JobDescriptionSchema, type JobDescription } from './job-description';

describe('JobDescriptionSchema', () => {
  describe('valid payloads', () => {
    it('should validate a complete JD with all required fields', () => {
      // Arrange
      const validJD = {
        jdId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Senior Engineer',
        rawText: 'We are looking for a senior engineer...',
        createdAt: '2026-06-03T11:00:00Z',
        TTL: 1719014400,
      };

      // Act
      const result = JobDescriptionSchema.safeParse(validJD);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validJD);
      }
    });

    it('should validate a JD with optional s3Key field', () => {
      // Arrange
      const validJD: JobDescription = {
        jdId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Senior Engineer',
        rawText: 'We are looking for a senior engineer...',
        s3Key: 'uploads/jd-123.pdf',
        createdAt: '2026-06-03T11:00:00Z',
        TTL: 1719014400,
      };

      // Act
      const result = JobDescriptionSchema.safeParse(validJD);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.s3Key).toBe('uploads/jd-123.pdf');
      }
    });

    it('should validate a JD without optional s3Key field', () => {
      // Arrange
      const validJD = {
        jdId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Senior Engineer',
        rawText: 'We are looking for a senior engineer...',
        createdAt: '2026-06-03T11:00:00Z',
        TTL: 1719014400,
      };

      // Act
      const result = JobDescriptionSchema.safeParse(validJD);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.s3Key).toBeUndefined();
      }
    });
  });

  describe('missing required fields', () => {
    it('should reject a JD missing jdId', () => {
      // Arrange
      const invalidJD = {
        title: 'Senior Engineer',
        rawText: 'We are looking for a senior engineer...',
        createdAt: '2026-06-03T11:00:00Z',
        TTL: 1719014400,
      };

      // Act
      const result = JobDescriptionSchema.safeParse(invalidJD);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject a JD with empty title', () => {
      // Arrange
      const invalidJD = {
        jdId: '123e4567-e89b-12d3-a456-426614174000',
        title: '',
        rawText: 'We are looking for a senior engineer...',
        createdAt: '2026-06-03T11:00:00Z',
        TTL: 1719014400,
      };

      // Act
      const result = JobDescriptionSchema.safeParse(invalidJD);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject a JD with empty rawText', () => {
      // Arrange
      const invalidJD = {
        jdId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Senior Engineer',
        rawText: '',
        createdAt: '2026-06-03T11:00:00Z',
        TTL: 1719014400,
      };

      // Act
      const result = JobDescriptionSchema.safeParse(invalidJD);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject a JD missing createdAt', () => {
      // Arrange
      const invalidJD = {
        jdId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Senior Engineer',
        rawText: 'We are looking for a senior engineer...',
        TTL: 1719014400,
      };

      // Act
      const result = JobDescriptionSchema.safeParse(invalidJD);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject a JD missing TTL', () => {
      // Arrange
      const invalidJD = {
        jdId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Senior Engineer',
        rawText: 'We are looking for a senior engineer...',
        createdAt: '2026-06-03T11:00:00Z',
      };

      // Act
      const result = JobDescriptionSchema.safeParse(invalidJD);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('invalid field values', () => {
    it('should reject a JD with invalid UUID for jdId', () => {
      // Arrange
      const invalidJD = {
        jdId: 'not-a-uuid',
        title: 'Senior Engineer',
        rawText: 'We are looking for a senior engineer...',
        createdAt: '2026-06-03T11:00:00Z',
        TTL: 1719014400,
      };

      // Act
      const result = JobDescriptionSchema.safeParse(invalidJD);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject a JD with invalid ISO 8601 datetime for createdAt', () => {
      // Arrange
      const invalidJD = {
        jdId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Senior Engineer',
        rawText: 'We are looking for a senior engineer...',
        createdAt: 'not-a-datetime',
        TTL: 1719014400,
      };

      // Act
      const result = JobDescriptionSchema.safeParse(invalidJD);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject a JD with non-positive TTL', () => {
      // Arrange
      const invalidJD = {
        jdId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Senior Engineer',
        rawText: 'We are looking for a senior engineer...',
        createdAt: '2026-06-03T11:00:00Z',
        TTL: 0,
      };

      // Act
      const result = JobDescriptionSchema.safeParse(invalidJD);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject a JD with negative TTL', () => {
      // Arrange
      const invalidJD = {
        jdId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Senior Engineer',
        rawText: 'We are looking for a senior engineer...',
        createdAt: '2026-06-03T11:00:00Z',
        TTL: -1000,
      };

      // Act
      const result = JobDescriptionSchema.safeParse(invalidJD);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject a JD with non-integer TTL', () => {
      // Arrange
      const invalidJD = {
        jdId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Senior Engineer',
        rawText: 'We are looking for a senior engineer...',
        createdAt: '2026-06-03T11:00:00Z',
        TTL: 1719014400.5,
      };

      // Act
      const result = JobDescriptionSchema.safeParse(invalidJD);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('type inference', () => {
    it('should correctly infer JobDescription type', () => {
      // Arrange & Act
      const jd: JobDescription = {
        jdId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Senior Engineer',
        rawText: 'We are looking for a senior engineer...',
        createdAt: '2026-06-03T11:00:00Z',
        TTL: 1719014400,
      };

      // Assert
      expect(jd).toBeDefined();
      expect(jd.jdId).toBeTruthy();
      expect(jd.title).toBeTruthy();
    });
  });
});
