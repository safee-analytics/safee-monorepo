import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import type { Storage } from "./storage.js";

export class FileSystemStorage implements Storage {
  private folder: string;
  private rootUrl: string;

  constructor(rootUrl: string, folder: string) {
    this.rootUrl = rootUrl;
    this.folder = folder;
  }

  async saveFile(path: string, data: Buffer): Promise<{ key: string; bucket: string; url: string }> {
    const fullPath = join(this.folder, path);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(join(this.folder, path), data);
    return {
      url: join(this.rootUrl, path),
      bucket: this.folder,
      key: path,
    };
  }
}
