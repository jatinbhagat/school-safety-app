import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';

// Base directory for uploads (relative to backend root)
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '../../uploads');
const BASE_URL = process.env.APP_URL || 'http://localhost:3001';

/**
 * Initialize uploads directory structure
 */
export async function initializeStorage(): Promise<void> {
  const dirs = [
    UPLOADS_DIR,
    path.join(UPLOADS_DIR, 'logos'),
    path.join(UPLOADS_DIR, 'qr-codes'),
  ];

  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      console.error(`Failed to create directory ${dir}:`, error);
    }
  }
}

export interface UploadOptions {
  key: string;
  buffer: Buffer;
  contentType: string;
}

/**
 * Upload file to local storage
 */
export async function uploadToLocal(options: UploadOptions): Promise<string> {
  const filePath = path.join(UPLOADS_DIR, options.key);
  const fileDir = path.dirname(filePath);

  // Ensure directory exists
  await fs.mkdir(fileDir, { recursive: true });

  // Write file to disk
  await fs.writeFile(filePath, options.buffer);

  // Return public URL
  return `${BASE_URL}/uploads/${options.key}`;
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

  return uploadToLocal({
    key,
    buffer: resizedBuffer,
    contentType: 'image/png',
  });
}

/**
 * Upload QR code image
 */
export async function uploadQRCode(institutionId: number, qrBuffer: Buffer, qrType: string = 'kiosk'): Promise<string> {
  const timestamp = Date.now();
  const key = `qr-codes/${institutionId}/${qrType}-qr-${timestamp}.png`;

  return uploadToLocal({
    key,
    buffer: qrBuffer,
    contentType: 'image/png',
  });
}

/**
 * Delete file from local storage
 */
export async function deleteFromLocal(url: string): Promise<void> {
  // Extract key from URL
  const key = url.replace(`${BASE_URL}/uploads/`, '');
  const filePath = path.join(UPLOADS_DIR, key);

  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Failed to delete file ${filePath}:`, error);
    // Don't throw error if file doesn't exist
  }
}
