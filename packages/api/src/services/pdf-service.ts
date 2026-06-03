import { GetObjectCommand } from '@aws-sdk/client-s3';
import { extractText } from 'unpdf';

import { config } from '@/utils/config';
import { logger } from '@/utils/logger';
import { s3Client } from '@/utils/s3-client';

/**
 * Service for PDF and text file extraction operations
 * Encapsulates all logic for reading and parsing files from S3
 */
export class PdfService {
  /**
   * Extract text from a file stored in S3
   * Supports .pdf (via unpdf) and .txt (raw read)
   * @param s3Key - The S3 object key
   * @returns The extracted text content
   * @throws Error if extraction fails
   */
  async extractTextFromFile(s3Key: string): Promise<string> {
    logger.info({ s3Key }, '[PdfService.extractTextFromFile] > extractTextFromFile');

    try {
      // Determine file type from extension
      const isPdf = s3Key.toLowerCase().endsWith('.pdf');
      const isTxt = s3Key.toLowerCase().endsWith('.txt');

      if (!isPdf && !isTxt) {
        logger.warn({ s3Key }, '[PdfService.extractTextFromFile] - Unsupported file type');
        throw new Error('File must be a .pdf or .txt file');
      }

      // Get the file from S3
      const getObjectCommand = new GetObjectCommand({
        Bucket: config.JD_BUCKET_NAME,
        Key: s3Key,
      });

      logger.debug({ s3Key }, '[PdfService.extractTextFromFile] - Fetching file from S3');
      const s3Response = await s3Client.send(getObjectCommand);
      const buffer = await s3Response.Body!.transformToByteArray();

      logger.debug({ s3Key, fileSize: buffer.length }, '[PdfService.extractTextFromFile] - File retrieved from S3');

      if (isTxt) {
        // For text files, just decode the bytes
        const text = Buffer.from(buffer).toString('utf-8');
        logger.info({ s3Key, textLength: text.length }, '[PdfService.extractTextFromFile] < Text file extracted');
        return text;
      }

      // For PDFs, use unpdf to extract text
      logger.debug({ s3Key }, '[PdfService.extractTextFromFile] - Extracting text from PDF');
      const result = await extractText(buffer);

      // extractText returns an object with a text property (string or string[])
      let fullText: string;
      if (typeof result.text === 'string') {
        fullText = result.text;
      } else if (Array.isArray(result.text)) {
        fullText = result.text.join(' ');
      } else {
        fullText = '';
      }

      if (!fullText || !fullText.trim()) {
        logger.warn({ s3Key }, '[PdfService.extractTextFromFile] - PDF appears to be empty or scanned/encrypted');
        throw new Error('PDF appears to be scanned or encrypted and could not be parsed');
      }

      logger.info({ s3Key, textLength: fullText.length }, '[PdfService.extractTextFromFile] < PDF text extracted');
      return fullText.trim();
    } catch (error) {
      if (error instanceof Error) {
        logger.error({ error: error.message, s3Key }, '[PdfService.extractTextFromFile] - File extraction failed');
        throw error;
      }

      logger.error({ error, s3Key }, '[PdfService.extractTextFromFile] - Unknown error during extraction');
      throw new Error('Failed to extract text from file', { cause: error });
    }
  }
}

/**
 * Singleton instance of PdfService
 */
export const pdfService = new PdfService();
