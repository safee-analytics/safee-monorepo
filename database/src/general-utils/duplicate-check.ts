export function findDuplicates<T>(arr: T[]): T[] | undefined {
  const uniqueElements = new Set(arr);
  if (uniqueElements.size === arr.length) return undefined; // no duplicates

  const frequencyMap = new Map<T, number>();
  for (const item of arr) {
    frequencyMap.set(item, (frequencyMap.get(item) ?? 0) + 1);
  }

  return [...frequencyMap].filter(([_, count]) => count > 1).map(([item]) => item);
}
