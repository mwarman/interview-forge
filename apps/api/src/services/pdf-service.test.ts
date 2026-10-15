import { describe, it, expect, beforeEach, vi } from 'vitest';
import { pdfService } from './pdf-service';
import { s3Service } from './s3-service';

// Mock S3 service and unpdf
vi.mock('./s3-service', () => ({
  s3Service: {
    getObject: vi.fn(),
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
      const textContent = 'This is a job description in text format.';

      vi.mocked(s3Service.getObject).mockResolvedValue(Buffer.from(textContent));

      // Act
      const result = await pdfService.extractTextFromFile(s3Key);

      // Assert
      expect(result).toBe(textContent);
      expect(s3Service.getObject).toHaveBeenCalled();
    });

    it('should extract text from a .pdf file', async () => {
      // Arrange
      const s3Key = 'jd-12345.pdf';
      const pdfContent = Buffer.from('fake pdf bytes');
      const extractedText = 'Extracted PDF text content.';

      vi.mocked(s3Service.getObject).mockResolvedValue(pdfContent);

      vi.mocked(extractText).mockResolvedValue({
        totalPages: 1,
        text: extractedText,
      });

      // Act
      const result = await pdfService.extractTextFromFile(s3Key);

      // Assert
      expect(result).toBe(extractedText);
      expect(extractText).toHaveBeenCalledWith(pdfContent);
    });

    it('should throw error for unsupported file types', async () => {
      // Arrange
      const s3Key = 'jd-12345.docx';

      // Act & Assert
      await expect(pdfService.extractTextFromFile(s3Key)).rejects.toThrow('File must be a .pdf or .txt file');
    });

    it('should throw error when PDF extraction returns empty text (scanned/encrypted)', async () => {
      // Arrange
      const s3Key = 'jd-scanned.pdf';
      const pdfContent = Buffer.from('fake pdf bytes');

      vi.mocked(s3Service.getObject).mockResolvedValue(pdfContent);

      vi.mocked(extractText).mockResolvedValue({
        totalPages: 1,
        text: '   ', // Only whitespace
      });

      // Act & Assert
      await expect(pdfService.extractTextFromFile(s3Key)).rejects.toThrow(
        'PDF appears to be scanned or encrypted and could not be parsed',
      );
    });

    it('should throw error when S3 file not found', async () => {
      // Arrange
      const s3Key = 'nonexistent.txt';

      vi.mocked(s3Service.getObject).mockRejectedValue(new Error('NoSuchKey: The specified key does not exist.'));

      // Act & Assert
      await expect(pdfService.extractTextFromFile(s3Key)).rejects.toThrow(
        'NoSuchKey: The specified key does not exist.',
      );
    });

    it('should handle extraction errors gracefully', async () => {
      // Arrange
      const s3Key = 'jd-corrupted.pdf';
      const pdfContent = Buffer.from('fake pdf bytes');

      vi.mocked(s3Service.getObject).mockResolvedValue(pdfContent);

      vi.mocked(extractText).mockRejectedValue(new Error('PDF extraction failed'));

      // Act & Assert
      await expect(pdfService.extractTextFromFile(s3Key)).rejects.toThrow('PDF extraction failed');
    });
  });
});
