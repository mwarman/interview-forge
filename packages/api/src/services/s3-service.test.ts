import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies BEFORE importing the service
vi.mock('@aws-sdk/s3-request-presigner');
vi.mock('@/utils/s3-client', () => ({
  s3Client: {},
}));

import { s3Service } from './s3-service';
import * as presignerMod from '@aws-sdk/s3-request-presigner';

describe('s3-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPresignedPutUrl', () => {
    it('should generate a pre-signed PUT URL with default 5-minute expiration', async () => {
      // Arrange
      const bucket = 'test-jd-bucket';
      const s3Key = 'uploads/550e8400-e29b-41d4-a716-446655440000/document.pdf';
      const expectedUrl = 'https://test-jd-bucket.s3.amazonaws.com/uploads/...';

      vi.mocked(presignerMod.getSignedUrl).mockResolvedValue(expectedUrl);

      // Act
      const result = await s3Service.getPresignedPutUrl(bucket, s3Key);

      // Assert
      expect(result).toBe(expectedUrl);
      expect(presignerMod.getSignedUrl).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ input: { Bucket: bucket, Key: s3Key } }),
        { expiresIn: 300 },
      );
    });

    it('should generate a pre-signed PUT URL with custom expiration', async () => {
      // Arrange
      const bucket = 'test-jd-bucket';
      const s3Key = 'uploads/550e8400-e29b-41d4-a716-446655440000/document.pdf';
      const expirationSeconds = 600;
      const expectedUrl = 'https://test-jd-bucket.s3.amazonaws.com/uploads/...';

      vi.mocked(presignerMod.getSignedUrl).mockResolvedValue(expectedUrl);

      // Act
      const result = await s3Service.getPresignedPutUrl(bucket, s3Key, expirationSeconds);

      // Assert
      expect(result).toBe(expectedUrl);
      expect(presignerMod.getSignedUrl).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ input: { Bucket: bucket, Key: s3Key } }),
        { expiresIn: expirationSeconds },
      );
    });

    it('should throw an error if pre-signed URL generation fails', async () => {
      // Arrange
      const bucket = 'test-jd-bucket';
      const s3Key = 'uploads/550e8400-e29b-41d4-a716-446655440000/document.pdf';
      const testError = new Error('S3 service unavailable');

      vi.mocked(presignerMod.getSignedUrl).mockRejectedValue(testError);

      // Act & Assert
      await expect(s3Service.getPresignedPutUrl(bucket, s3Key)).rejects.toThrow('S3 service unavailable');
    });
  });
});
