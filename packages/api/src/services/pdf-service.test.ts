import { describe, it, expect, beforeEach, vi } from 'vitest';
import { pdfService } from './pdf-service';
import { s3Client } from '../utils/s3-client';

// Mock S3 and unpdf
vi.mock('../utils/s3-client', () => ({
  s3Client: {
    send: vi.fn(),
  },
}));

vi.mock('unpdf', () => ({
  extractText: vi.fn(),
}));

import { extractText } from 'unpdf';

describe('PdfService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractTextFromFile', () => {
    it('should extract text from a .txt file', async () => {
      // Arrange
      const s3Key = 'jd-12345.txt';
      const bucketName = 'test-bucket';
      const textContent = 'This is a job description in text format.';

      vi.mocked(s3Client.send).mockResolvedValue({
        Body: {
          transformToByteArray: async () => Buffer.from(textContent),
        },
      } as Record<string, unknown>);

      // Act
      const result = await pdfService.extractTextFromFile(s3Key, bucketName);

      // Assert
      expect(result).toBe(textContent);
      expect(s3Client.send).toHaveBeenCalled();
    });

    it('should extract text from a .pdf file', async () => {
      // Arrange
      const s3Key = 'jd-12345.pdf';
      const bucketName = 'test-bucket';
      const pdfContent = Buffer.from('fake pdf bytes');
      const extractedText = 'Extracted PDF text content.';

      vi.mocked(s3Client.send).mockResolvedValue({
        Body: {
          transformToByteArray: async () => pdfContent,
        },
      } as Record<string, unknown>);

      vi.mocked(extractText).mockResolvedValue({
        totalPages: 1,
        text: extractedText,
      });

      // Act
      const result = await pdfService.extractTextFromFile(s3Key, bucketName);

      // Assert
      expect(result).toBe(extractedText);
      expect(extractText).toHaveBeenCalledWith(pdfContent);
    });

    it('should throw error for unsupported file types', async () => {
      // Arrange
      const s3Key = 'jd-12345.docx';
      const bucketName = 'test-bucket';

      // Act & Assert
      await expect(pdfService.extractTextFromFile(s3Key, bucketName)).rejects.toThrow(
        'File must be a .pdf or .txt file',
      );
    });

    it('should throw error when PDF extraction returns empty text (scanned/encrypted)', async () => {
      // Arrange
      const s3Key = 'jd-scanned.pdf';
      const bucketName = 'test-bucket';
      const pdfContent = Buffer.from('fake pdf bytes');

      vi.mocked(s3Client.send).mockResolvedValue({
        Body: {
          transformToByteArray: async () => pdfContent,
        },
      } as Record<string, unknown>);

      vi.mocked(extractText).mockResolvedValue({
        totalPages: 1,
        text: '   ', // Only whitespace
      });

      // Act & Assert
      await expect(pdfService.extractTextFromFile(s3Key, bucketName)).rejects.toThrow(
        'PDF appears to be scanned or encrypted and could not be parsed',
      );
    });

    it('should throw error when S3 file not found', async () => {
      // Arrange
      const s3Key = 'nonexistent.txt';
      const bucketName = 'test-bucket';

      vi.mocked(s3Client.send).mockRejectedValue(new Error('NoSuchKey: The specified key does not exist.'));

      // Act & Assert
      await expect(pdfService.extractTextFromFile(s3Key, bucketName)).rejects.toThrow(
        'NoSuchKey: The specified key does not exist.',
      );
    });

    it('should handle extraction errors gracefully', async () => {
      // Arrange
      const s3Key = 'jd-corrupted.pdf';
      const bucketName = 'test-bucket';
      const pdfContent = Buffer.from('fake pdf bytes');

      vi.mocked(s3Client.send).mockResolvedValue({
        Body: {
          transformToByteArray: async () => pdfContent,
        },
      } as Record<string, unknown>);

      vi.mocked(extractText).mockRejectedValue(new Error('PDF extraction failed'));

      // Act & Assert
      await expect(pdfService.extractTextFromFile(s3Key, bucketName)).rejects.toThrow('PDF extraction failed');
    });
  });
});
