import { Bucket, Storage } from "@google-cloud/storage";
import type { Storage as StorageInterface } from "./storage.js";

export class GoogleCloudStorage implements StorageInterface {
  private static storage: Storage | null = null;

  private bucket: Bucket;
  private bucketName: string;

  constructor(bucket: string) {
    GoogleCloudStorage.storage ??= new Storage();
    this.bucketName = bucket;
    this.bucket = GoogleCloudStorage.storage.bucket(bucket);
  }

  async saveFile(path: string, data: Buffer): Promise<{ key: string; bucket: string; url: string }> {
    const file = this.bucket.file(path);
    await file.save(data);
    return {
      url: file.publicUrl(),
      bucket: this.bucketName,
      key: path,
    };
  }
}
