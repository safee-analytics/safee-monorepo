import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

async function isExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function writeToFileAndCreateFoldersIfNeeded(filePath: string, data: string): Promise<void> {
  const dir = dirname(filePath);
  const exists = await isExists(dir);

  if (!exists) {
    await mkdir(dir, { recursive: true });
  }

  await writeFile(filePath, data, "utf8");
}
