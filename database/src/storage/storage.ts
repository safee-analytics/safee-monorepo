export interface Storage {
  saveFile(path: string, data: Buffer): Promise<{ key: string; bucket: string; url: string }>;
}
