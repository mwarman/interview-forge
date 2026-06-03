import { describe, it, expect, beforeEach, vi } from 'vitest';

import { jobDescriptionService } from '@/services/job-description-service';
import { pdfService } from '@/services/pdf-service';
import { jobDescriptionRepository } from '@/repositories/job-description-repository';

// Mock dependencies
vi.mock('@/services/pdf-service', () => ({
  pdfService: {
    extractTextFromFile: vi.fn(),
  },
}));

vi.mock('@/repositories/job-description-repository', () => ({
  jobDescriptionRepository: {
    put: vi.fn(),
    queryAll: vi.fn(),
    toJobDescription: vi.fn((item) => {
      const { PK: _pk, SK: _sk, GSI1PK: _gsi1pk, GSI1SK: _gsi1sk, ...jobDescription } = item;
      return jobDescription;
    }),
  },
}));

vi.mock('crypto', () => ({
  randomUUID: () => '550e8400-e29b-41d4-a716-446655440000',
}));

describe('JobDescriptionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createFromPaste', () => {
    it('should create a job description from pasted text', async () => {
      // Arrange
      const title = 'Senior Backend Engineer';
      const rawText = 'This is a job description for a senior backend engineer.';

      vi.mocked(jobDescriptionRepository.put).mockResolvedValue(undefined);

      // Act
      const result = await jobDescriptionService.createFromPaste(title, rawText);

      // Assert
      expect(result).toHaveProperty('jdId');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('TTL');
      expect(result.jdId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.title).toBe(title);
      expect(result.rawText).toBe(rawText);

      // Verify repository was called with correct structure
      expect(jobDescriptionRepository.put).toHaveBeenCalledWith(
        expect.objectContaining({
          jdId: '550e8400-e29b-41d4-a716-446655440000',
          title,
          rawText,
          PK: 'JD#550e8400-e29b-41d4-a716-446655440000',
          SK: 'METADATA',
          GSI1PK: 'JDS',
        }),
      );
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const title = 'Test Job';
      const rawText = 'Test text';

      vi.mocked(jobDescriptionRepository.put).mockRejectedValue(new Error('DynamoDB error'));

      // Act & Assert
      await expect(jobDescriptionService.createFromPaste(title, rawText)).rejects.toThrow('DynamoDB error');
    });
  });

  describe('createFromUpload', () => {
    it('should create a job description from uploaded file', async () => {
      // Arrange
      const title = 'Senior Backend Engineer';
      const s3Key = 'jd-12345.pdf';
      const extractedText = 'Extracted job description text.';

      vi.mocked(pdfService.extractTextFromFile).mockResolvedValue(extractedText);
      vi.mocked(jobDescriptionRepository.put).mockResolvedValue(undefined);

      // Act
      const result = await jobDescriptionService.createFromUpload(title, s3Key);

      // Assert
      expect(result).toHaveProperty('jdId');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('TTL');
      expect(result.jdId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(result.title).toBe(title);
      expect(result.rawText).toBe(extractedText);
      expect(result.s3Key).toBe(s3Key);

      // Verify pdf service was called
      expect(pdfService.extractTextFromFile).toHaveBeenCalledWith(s3Key);

      // Verify repository was called with s3Key included
      expect(jobDescriptionRepository.put).toHaveBeenCalledWith(
        expect.objectContaining({
          jdId: '550e8400-e29b-41d4-a716-446655440000',
          title,
          rawText: extractedText,
          s3Key,
          PK: 'JD#550e8400-e29b-41d4-a716-446655440000',
          SK: 'METADATA',
          GSI1PK: 'JDS',
        }),
      );
    });

    it('should throw error when PDF extraction fails', async () => {
      // Arrange
      const title = 'Test Job';
      const s3Key = 'jd-corrupted.pdf';

      vi.mocked(pdfService.extractTextFromFile).mockRejectedValue(
        new Error('PDF appears to be scanned or encrypted and could not be parsed'),
      );

      // Act & Assert
      await expect(jobDescriptionService.createFromUpload(title, s3Key)).rejects.toThrow(
        'PDF appears to be scanned or encrypted and could not be parsed',
      );
    });

    it('should throw error when repository fails', async () => {
      // Arrange
      const title = 'Test Job';
      const s3Key = 'jd-12345.txt';
      const extractedText = 'Job text';

      vi.mocked(pdfService.extractTextFromFile).mockResolvedValue(extractedText);
      vi.mocked(jobDescriptionRepository.put).mockRejectedValue(new Error('DynamoDB error'));

      // Act & Assert
      await expect(jobDescriptionService.createFromUpload(title, s3Key)).rejects.toThrow('DynamoDB error');
    });
  });

  describe('TTL calculation', () => {
    it('should include valid TTL in response', async () => {
      // Arrange
      const title = 'Test Job';
      const rawText = 'Test text';

      vi.mocked(jobDescriptionRepository.put).mockResolvedValue(undefined);

      // Act
      const result = await jobDescriptionService.createFromPaste(title, rawText);

      // Assert
      expect(result.TTL).toBeGreaterThan(Math.floor(Date.now() / 1000));
      expect(result.TTL).toBeLessThan(Math.floor(Date.now() / 1000) + 72 * 3600 + 1000); // Allow 1 second buffer
    });
  });

  describe('listAll', () => {
    it('should return all job descriptions from repository', async () => {
      // Arrange
      const mockJobDescriptions = [
        {
          jdId: '550e8400-e29b-41d4-a716-446655440001',
          title: 'Senior Backend Engineer',
          rawText: 'Job description 1',
          createdAt: '2026-06-03T13:00:00.000Z',
          TTL: 1234567890,
        },
        {
          jdId: '550e8400-e29b-41d4-a716-446655440002',
          title: 'Frontend Engineer',
          rawText: 'Job description 2',
          createdAt: '2026-06-03T12:00:00.000Z',
          TTL: 1234567890,
        },
      ];

      vi.mocked(jobDescriptionRepository.queryAll).mockResolvedValue(mockJobDescriptions);

      // Act
      const result = await jobDescriptionService.listAll();

      // Assert
      expect(result).toEqual(mockJobDescriptions);
      expect(result).toHaveLength(2);
      expect(jobDescriptionRepository.queryAll).toHaveBeenCalledOnce();
    });

    it('should return empty array when no job descriptions exist', async () => {
      // Arrange
      vi.mocked(jobDescriptionRepository.queryAll).mockResolvedValue([]);

      // Act
      const result = await jobDescriptionService.listAll();

      // Assert
      expect(result).toEqual([]);
      expect(jobDescriptionRepository.queryAll).toHaveBeenCalledOnce();
    });

    it('should throw error when repository query fails', async () => {
      // Arrange
      const error = new Error('Query failed');
      vi.mocked(jobDescriptionRepository.queryAll).mockRejectedValue(error);

      // Act & Assert
      await expect(jobDescriptionService.listAll()).rejects.toThrow('Query failed');
      expect(jobDescriptionRepository.queryAll).toHaveBeenCalledOnce();
    });
  });
});
