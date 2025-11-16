import { Request, Response } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

// Initialize S3 client with environment variables
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT, // For MinIO compatibility
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true', // Required for MinIO
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'school-safety-attachments';
const PRESIGN_EXPIRES_IN = parseInt(process.env.PRESIGN_EXPIRES_IN || '3600', 10); // Default 1 hour

// Allowed content types for security
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'audio/mpeg',
  'audio/wav',
  'application/pdf',
];

// Max file size (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

interface GetUploadUrlBody {
  filename?: string;
  contentType?: string;
  fileSize?: number;
}

export async function getUploadUrl(req: Request, res: Response): Promise<void> {
  const requestId = randomUUID();

  try {
    const { filename, contentType, fileSize }: GetUploadUrlBody = req.body;

    // Validate required fields
    if (!filename || typeof filename !== 'string' || filename.trim() === '') {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Field "filename" is required and must be a non-empty string',
        request_id: requestId,
      });
      return;
    }

    if (!contentType || typeof contentType !== 'string' || contentType.trim() === '') {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Field "contentType" is required and must be a non-empty string',
        request_id: requestId,
      });
      return;
    }

    // Validate content type
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      res.status(400).json({
        error: 'Validation failed',
        message: `Content type "${contentType}" is not allowed. Allowed types: ${ALLOWED_CONTENT_TYPES.join(', ')}`,
        request_id: requestId,
      });
      return;
    }

    // Validate file size if provided
    if (fileSize && (typeof fileSize !== 'number' || fileSize > MAX_FILE_SIZE)) {
      res.status(400).json({
        error: 'Validation failed',
        message: `File size must not exceed ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        request_id: requestId,
      });
      return;
    }

    // Generate unique key for the file
    const fileExtension = filename.split('.').pop() || '';
    const uniqueKey = `uploads/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${randomUUID()}.${fileExtension}`;

    // Create the PutObject command
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueKey,
      ContentType: contentType,
    });

    // Generate presigned URL
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGN_EXPIRES_IN,
    });

    res.status(200).json({
      uploadUrl: presignedUrl,
      key: uniqueKey,
      expiresIn: PRESIGN_EXPIRES_IN,
      request_id: requestId,
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate upload URL',
      request_id: requestId,
    });
  }
}
