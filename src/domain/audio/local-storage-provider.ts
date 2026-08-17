import { StorageProvider } from './storage-provider';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor(baseDir?: string) {
    // Default to a folder inside the project for local dev
    this.baseDir = baseDir || path.join(process.cwd(), 'storage', 'audio');
    this.init();
  }

  private async init() {
    try {
      await fs.access(this.baseDir);
    } catch {
      await fs.mkdir(this.baseDir, { recursive: true });
    }
  }

  async upload(file: Buffer, filename: string, mimeType: string): Promise<string> {
    await this.init();
    const ext = path.extname(filename) || this.getExtensionFromMime(mimeType);
    const uniqueId = crypto.randomUUID();
    const key = `${uniqueId}${ext}`;
    const filePath = path.join(this.baseDir, key);
    
    await fs.writeFile(filePath, file);
    return key;
  }

  private getSafePath(key: string): string {
    const resolvedPath = path.resolve(this.baseDir, key);
    if (!resolvedPath.startsWith(path.resolve(this.baseDir))) {
      throw new Error('Path traversal detected');
    }
    return resolvedPath;
  }

  async download(key: string): Promise<Buffer> {
    const filePath = this.getSafePath(key);
    return await fs.readFile(filePath);
  }

  async getUrl(key: string): Promise<string> {
    // In local dev, we could serve this via an API route (e.g. /api/audio/serve?key=...)
    return `/api/audio/serve/${key}`;
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getSafePath(key);
    await fs.unlink(filePath).catch((e) => {
      console.warn(`Failed to delete local file ${key}:`, e.message);
    });
  }

  private getExtensionFromMime(mimeType: string): string {
    const map: Record<string, string> = {
      'audio/mpeg': '.mp3',
      'audio/mp3': '.mp3',
      'audio/wav': '.wav',
      'audio/x-wav': '.wav',
      'audio/mp4': '.m4a',
      'audio/x-m4a': '.m4a',
      'audio/webm': '.webm',
    };
    return map[mimeType] || '.bin';
  }
}

// Singleton instance
export const storageProvider = new LocalStorageProvider();
