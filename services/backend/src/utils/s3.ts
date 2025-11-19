import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const S3_BUCKET = process.env.S3_BUCKET || 'safelynotify-assets';
const CDN_URL = process.env.CDN_URL || `https://${S3_BUCKET}.s3.amazonaws.com`;

export interface UploadOptions {
  key: string;
  buffer: Buffer;
  contentType: string;
  acl?: 'public-read' | 'private';
}

/**
 * Upload file to S3
 */
export async function uploadToS3(options: UploadOptions): Promise<string> {
  await s3Client.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: options.key,
    Body: options.buffer,
    ContentType: options.contentType,
    ACL: options.acl || 'public-read',
  }));

  return `${CDN_URL}/${options.key}`;
}

/**
 * Upload logo with automatic resizing
 * Resizes to 200x200 maintaining aspect ratio
 */
export async function uploadLogo(institutionId: number, fileBuffer: Buffer, mimeType: string): Promise<string> {
  // Resize to 200x200
  const resizedBuffer = await sharp(fileBuffer)
    .resize(200, 200, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();

  const timestamp = Date.now();
  const key = `logos/${institutionId}/logo-${timestamp}.png`;

  return uploadToS3({
    key,
    buffer: resizedBuffer,
    contentType: 'image/png',
    acl: 'public-read',
  });
}

/**
 * Upload QR code image
 */
export async function uploadQRCode(institutionId: number, qrBuffer: Buffer, qrType: string = 'kiosk'): Promise<string> {
  const timestamp = Date.now();
  const key = `qr-codes/${institutionId}/${qrType}-qr-${timestamp}.png`;

  return uploadToS3({
    key,
    buffer: qrBuffer,
    contentType: 'image/png',
    acl: 'public-read',
  });
}

/**
 * Delete file from S3
 */
export async function deleteFromS3(url: string): Promise<void> {
  // Extract key from URL
  const key = url.replace(`${CDN_URL}/`, '');

  await s3Client.send(new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  }));
}
