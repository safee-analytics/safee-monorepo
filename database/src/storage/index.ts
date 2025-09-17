import { GoogleCloudStorage } from "./googleCloudStorage.js";
import { FileSystemStorage } from "./fileSystemStorage.js";
import { Storage } from "./storage.js";
import { IS_LOCAL } from "../env.js";

export function getStorage(bucket: string): Storage {
  if (IS_LOCAL) {
    return new FileSystemStorage("public", bucket);
  }
  return new GoogleCloudStorage(bucket);
}
