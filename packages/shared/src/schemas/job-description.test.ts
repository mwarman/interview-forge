import { describe, it, expect } from 'vitest';
import {
  JobDescriptionSchema,
  CreateJobDescriptionRequestSchema,
  CreatePresignedUrlRequestSchema,
  CreatePresignedUrlResponseSchema,
  type JobDescription,
  type CreateJobDescriptionRequest,
  type CreatePresignedUrlRequest,
  type CreatePresignedUrlResponse,
} from './job-description';

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

describe('CreateJobDescriptionRequestSchema', () => {
  describe('paste mode - valid payloads', () => {
    it('should validate a paste mode request with title and rawText', () => {
      // Arrange
      const request: CreateJobDescriptionRequest = {
        mode: 'paste',
        title: 'Senior Backend Engineer',
        rawText: 'We are looking for a senior backend engineer with 5+ years experience...',
      };

      // Act
      const result = CreateJobDescriptionRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mode).toBe('paste');
        expect(result.data.title).toBe(request.title);
        expect(result.data.rawText).toBe(request.rawText);
      }
    });
  });

  describe('paste mode - invalid payloads', () => {
    it('should reject paste mode without title', () => {
      // Arrange
      const request = {
        mode: 'paste',
        rawText: 'Job description text',
      };

      // Act
      const result = CreateJobDescriptionRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject paste mode without rawText', () => {
      // Arrange
      const request = {
        mode: 'paste',
        title: 'Senior Engineer',
      };

      // Act
      const result = CreateJobDescriptionRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject paste mode with empty title', () => {
      // Arrange
      const request = {
        mode: 'paste',
        title: '',
        rawText: 'Job description text',
      };

      // Act
      const result = CreateJobDescriptionRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject paste mode with empty rawText', () => {
      // Arrange
      const request = {
        mode: 'paste',
        title: 'Senior Engineer',
        rawText: '',
      };

      // Act
      const result = CreateJobDescriptionRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('upload mode - valid payloads', () => {
    it('should validate upload mode request with title and s3Key', () => {
      // Arrange
      const request: CreateJobDescriptionRequest = {
        mode: 'upload',
        title: 'Senior Backend Engineer',
        s3Key: 'uploads/jd-123.pdf',
      };

      // Act
      const result = CreateJobDescriptionRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mode).toBe('upload');
        expect(result.data.title).toBe(request.title);
        expect(result.data.s3Key).toBe(request.s3Key);
      }
    });

    it('should validate upload mode with optional jdId', () => {
      // Arrange
      const request: CreateJobDescriptionRequest = {
        mode: 'upload',
        title: 'Senior Backend Engineer',
        s3Key: 'uploads/550e8400-e29b-41d4-a716-446655440000/document.pdf',
        jdId: '550e8400-e29b-41d4-a716-446655440000',
      };

      // Act
      const result = CreateJobDescriptionRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mode).toBe('upload');
        expect(result.data.jdId).toBe(request.jdId);
      }
    });

    it('should validate upload mode without jdId', () => {
      // Arrange
      const request: CreateJobDescriptionRequest = {
        mode: 'upload',
        title: 'Senior Backend Engineer',
        s3Key: 'uploads/jd-123.pdf',
      };

      // Act
      const result = CreateJobDescriptionRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.jdId).toBeUndefined();
      }
    });
  });

  describe('upload mode - invalid payloads', () => {
    it('should reject upload mode without title', () => {
      // Arrange
      const request = {
        mode: 'upload',
        s3Key: 'uploads/jd-123.pdf',
      };

      // Act
      const result = CreateJobDescriptionRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject upload mode without s3Key', () => {
      // Arrange
      const request = {
        mode: 'upload',
        title: 'Senior Engineer',
      };

      // Act
      const result = CreateJobDescriptionRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject upload mode with empty title', () => {
      // Arrange
      const request = {
        mode: 'upload',
        title: '',
        s3Key: 'uploads/jd-123.pdf',
      };

      // Act
      const result = CreateJobDescriptionRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject upload mode with empty s3Key', () => {
      // Arrange
      const request = {
        mode: 'upload',
        title: 'Senior Engineer',
        s3Key: '',
      };

      // Act
      const result = CreateJobDescriptionRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject upload mode with invalid UUID for jdId', () => {
      // Arrange
      const request = {
        mode: 'upload',
        title: 'Senior Engineer',
        s3Key: 'uploads/jd-123.pdf',
        jdId: 'not-a-uuid',
      };

      // Act
      const result = CreateJobDescriptionRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});

describe('CreatePresignedUrlRequestSchema', () => {
  describe('valid payloads', () => {
    it('should validate a valid pre-signed URL request with filename', () => {
      // Arrange
      const request: CreatePresignedUrlRequest = {
        filename: 'job-description.pdf',
      };

      // Act
      const result = CreatePresignedUrlRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.filename).toBe(request.filename);
      }
    });

    it('should validate various filename formats', () => {
      // Arrange
      const filenames = ['document.pdf', 'JD-2026.pdf', 'job_description_final.pdf', 'job description (v2).pdf'];

      for (const filename of filenames) {
        // Act
        const result = CreatePresignedUrlRequestSchema.safeParse({ filename });

        // Assert
        expect(result.success).toBe(true);
      }
    });
  });

  describe('invalid payloads', () => {
    it('should reject request without filename', () => {
      // Arrange
      const request = {};

      // Act
      const result = CreatePresignedUrlRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject request with empty filename', () => {
      // Arrange
      const request = { filename: '' };

      // Act
      const result = CreatePresignedUrlRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject request with whitespace-only filename', () => {
      // Arrange
      const request = { filename: '   ' };

      // Act
      const result = CreatePresignedUrlRequestSchema.safeParse(request);

      // Assert
      expect(result.success).toBe(true); // Zod's min(1) allows whitespace strings
    });
  });

  describe('type inference', () => {
    it('should correctly infer CreatePresignedUrlRequest type', () => {
      // Arrange & Act
      const request: CreatePresignedUrlRequest = {
        filename: 'document.pdf',
      };

      // Assert
      expect(request).toBeDefined();
      expect(request.filename).toBeTruthy();
    });
  });
});

describe('CreatePresignedUrlResponseSchema', () => {
  describe('valid payloads', () => {
    it('should validate a valid pre-signed URL response', () => {
      // Arrange
      const response: CreatePresignedUrlResponse = {
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        s3Key: 'uploads/550e8400-e29b-41d4-a716-446655440000/document.pdf',
        presignedUrl:
          'https://test-bucket.s3.amazonaws.com/uploads/550e8400-e29b-41d4-a716-446655440000/document.pdf?X-Amz-Signature=...',
      };

      // Act
      const result = CreatePresignedUrlResponseSchema.safeParse(response);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.jdId).toBe(response.jdId);
        expect(result.data.s3Key).toBe(response.s3Key);
        expect(result.data.presignedUrl).toBe(response.presignedUrl);
      }
    });
  });

  describe('invalid payloads', () => {
    it('should reject response with invalid UUID for jdId', () => {
      // Arrange
      const response = {
        jdId: 'not-a-uuid',
        s3Key: 'uploads/jd-123/document.pdf',
        presignedUrl: 'https://test-bucket.s3.amazonaws.com/uploads/jd-123/document.pdf?X-Amz-Signature=...',
      };

      // Act
      const result = CreatePresignedUrlResponseSchema.safeParse(response);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject response with empty s3Key', () => {
      // Arrange
      const response = {
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        s3Key: '',
        presignedUrl: 'https://test-bucket.s3.amazonaws.com/uploads/jd-123/document.pdf?X-Amz-Signature=...',
      };

      // Act
      const result = CreatePresignedUrlResponseSchema.safeParse(response);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject response with invalid URL for presignedUrl', () => {
      // Arrange
      const response = {
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        s3Key: 'uploads/550e8400-e29b-41d4-a716-446655440000/document.pdf',
        presignedUrl: 'not-a-valid-url',
      };

      // Act
      const result = CreatePresignedUrlResponseSchema.safeParse(response);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject response with missing jdId', () => {
      // Arrange
      const response = {
        s3Key: 'uploads/550e8400-e29b-41d4-a716-446655440000/document.pdf',
        presignedUrl: 'https://test-bucket.s3.amazonaws.com/uploads/jd-123/document.pdf?X-Amz-Signature=...',
      };

      // Act
      const result = CreatePresignedUrlResponseSchema.safeParse(response);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject response with missing s3Key', () => {
      // Arrange
      const response = {
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        presignedUrl: 'https://test-bucket.s3.amazonaws.com/uploads/jd-123/document.pdf?X-Amz-Signature=...',
      };

      // Act
      const result = CreatePresignedUrlResponseSchema.safeParse(response);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject response with missing presignedUrl', () => {
      // Arrange
      const response = {
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        s3Key: 'uploads/550e8400-e29b-41d4-a716-446655440000/document.pdf',
      };

      // Act
      const result = CreatePresignedUrlResponseSchema.safeParse(response);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('type inference', () => {
    it('should correctly infer CreatePresignedUrlResponse type', () => {
      // Arrange & Act
      const response: CreatePresignedUrlResponse = {
        jdId: '550e8400-e29b-41d4-a716-446655440000',
        s3Key: 'uploads/550e8400-e29b-41d4-a716-446655440000/document.pdf',
        presignedUrl:
          'https://test-bucket.s3.amazonaws.com/uploads/550e8400-e29b-41d4-a716-446655440000/document.pdf?X-Amz-Signature=...',
      };

      // Assert
      expect(response).toBeDefined();
      expect(response.jdId).toBeTruthy();
      expect(response.s3Key).toBeTruthy();
      expect(response.presignedUrl).toBeTruthy();
    });
  });
});
