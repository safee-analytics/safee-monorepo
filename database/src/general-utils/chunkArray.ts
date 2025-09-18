export function chunkArray<T>(data: T[], size: number): T[][] {
  if (!Number.isInteger(size) || size <= 0) throw new Error("Chunk size must be a positive integer.");
  if (data.length === 0) return [];

  const chunkedArr: T[][] = [];
  for (let index = 0; index < data.length; index += size) {
    chunkedArr.push(data.slice(index, index + size));
  }
  return chunkedArr;
}
