export interface StorageProvider {
  /**
   * Uploads a file buffer to storage and returns a unique storage key.
   */
  upload(file: Buffer, filename: string, mimeType: string): Promise<string>;

  /**
   * Retrieves a file from storage by its key.
   */
  download(key: string): Promise<Buffer>;

  /**
   * Returns a URL (or path) to access the file if supported.
   */
  getUrl(key: string): Promise<string>;

  /**
   * Deletes a file from storage.
   */
  delete(key: string): Promise<void>;
}
