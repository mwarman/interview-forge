import { JSX, useRef, useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { CloudUpload } from 'lucide-react';

import { cn } from '@/common/utils/css';
import { Button } from '@/common/components/shadcn/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from '@/common/components/shadcn/field';
import { Input } from '@/common/components/shadcn/input';
import { Progress } from '@/common/components/shadcn/progress';
import { Alert, AlertDescription } from '@/common/components/shadcn/alert';
import { useCreatePresignedUrl } from '@/pages/jd/create/api/useCreatePresignedUrl';
import { useCreateJobDescription } from '@/pages/jd/create/api/useCreateJobDescription';

const ALLOWED_FILE_TYPES = ['application/pdf', 'text/plain'];
const ALLOWED_EXTENSIONS = ['.pdf', '.txt'];

interface UploadModeProps {
  onSuccess?: () => void;
}

/**
 * UploadMode component - Form for uploading a job description file.
 * Accepts only .pdf and .txt files.
 * Workflow: Get presigned URL → Upload to S3 → Create JD record
 *
 * @param onSuccess - Callback function when job description is successfully created
 * @returns {JSX.Element} The UploadMode form component
 */
export const UploadMode = ({ onSuccess }: UploadModeProps): JSX.Element => {
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const presignedUrlMutation = useCreatePresignedUrl();
  const createJdMutation = useCreateJobDescription();

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setFileError(`Invalid file type. Only PDF and TXT files are allowed. Got: ${file.type || 'unknown'}`);
      return false;
    }

    // Check file extension
    const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExtension) {
      setFileError(`Invalid file extension. Only ${ALLOWED_EXTENSIONS.join(', ')} are allowed.`);
      return false;
    }

    setFileError('');
    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    // Validate title
    if (!title.trim()) {
      setValidationErrors({ title: 'Title is required' });
      return;
    }

    if (title.length > 200) {
      setValidationErrors({ title: 'Title must be 200 characters or less' });
      return;
    }

    // Validate file
    if (!selectedFile) {
      setFileError('Please select a file to upload');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Step 1: Get presigned URL
      const presignedUrlData = await presignedUrlMutation.mutateAsync({
        filename: selectedFile.name,
      });

      // Step 2: Upload file to S3 with progress tracking
      await axios.put(presignedUrlData.presignedUrl, selectedFile, {
        headers: {
          'Content-Type': selectedFile.type || 'application/octet-stream',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable) {
            // if length is computable, both loaded and total are available to calculate progress
            // however for type safety, we guard against total being zero or undefined
            const total = progressEvent.total || 1; // prevent division by zero
            const progress = Math.round((progressEvent.loaded / total) * 100);
            setUploadProgress(progress);
          }
        },
      });

      // Step 3: Create job description record
      await createJdMutation.mutateAsync({
        mode: 'upload',
        title,
        s3Key: presignedUrlData.s3Key,
        jdId: presignedUrlData.jdId,
      });

      // On success, call the callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during file upload';

      // Check if it's a file rejection or S3 error
      if (errorMessage.includes('Invalid file') || errorMessage.includes('file type')) {
        setFileError(errorMessage);
      } else {
        toast.error(errorMessage, {
          action: {
            label: 'Retry',
            onClick: () => handleSubmit({ preventDefault: () => {} } as React.FormEvent),
          },
        });
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const isLoading = isUploading || presignedUrlMutation.isPending || createJdMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FieldSet>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="upload-title">Title</FieldLabel>
            <Input
              id="upload-title"
              type="text"
              placeholder="e.g., Senior Software Engineer"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value.slice(0, 200));
                setValidationErrors((prev) => ({ ...prev, title: '' }));
              }}
              maxLength={200}
              disabled={isLoading}
              data-testid="upload-title-input"
              className={validationErrors.title ? 'border-red-500' : ''}
            />
            <FieldDescription className="flex items-center justify-between">
              <span>The title of the job description (max 200 characters).</span>
              <span className="text-xs">{title.length}/200</span>
            </FieldDescription>
            <FieldError>{validationErrors.title}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="file-upload">File Upload</FieldLabel>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                'relative h-60 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
                { 'border-primary bg-primary/5': isDragging },
                { 'border-muted-foreground/25 bg-muted/50': !isDragging },
                { 'cursor-not-allowed opacity-50': isLoading },
                { 'cursor-pointer hover:border-gray-400': !isLoading },
              )}
              data-testid="file-dropzone"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileInputChange}
                disabled={isLoading}
                data-testid="file-input"
                className="hidden"
              />

              {!selectedFile && (
                <div className="flex flex-col items-center gap-3">
                  <CloudUpload className="text-muted-foreground size-12" />
                  <div>
                    <h3 className="font-semibold">Drag and drop your file here</h3>
                    <p className="text-muted-foreground text-sm">or</p>
                  </div>
                  <Button
                    variant="default"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    data-testid={`file-browse-button`}
                  >
                    Browse Files
                  </Button>
                  <p className="text-muted-foreground text-xs">Supported formats: PDF, TXT • Maximum file size: 10MB</p>
                </div>
              )}

              {selectedFile && (
                <div className="flex flex-col items-center gap-3">
                  <CloudUpload className="text-muted-foreground size-12" />
                  <div>
                    <h3 className="font-semibold">Selected file:</h3>
                    <p className="text-muted-foreground text-sm">{selectedFile.name}</p>
                  </div>
                  <Button
                    variant="default"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    disabled={isLoading}
                    data-testid={`file-remove-button`}
                  >
                    Remove File
                  </Button>
                  <p className="text-muted-foreground text-xs">Supported formats: PDF, TXT • Maximum file size: 10MB</p>
                </div>
              )}
            </div>
            <FieldError>{fileError}</FieldError>
          </Field>

          <Field>
            <Button
              type="submit"
              disabled={isLoading || !selectedFile}
              data-testid="upload-submit-button"
              className="w-full"
            >
              {isLoading ? 'Uploading...' : 'Create Job Description'}
            </Button>
          </Field>
        </FieldGroup>
      </FieldSet>

      {isUploading && uploadProgress > 0 && (
        <Alert data-testid="upload-progress-alert">
          <AlertDescription>
            <div className="space-y-2">
              <p className="text-sm">Uploading file...</p>
              <Progress value={uploadProgress} data-testid="upload-progress" />
              <p className="text-xs text-gray-500">{uploadProgress}% complete</p>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
};
