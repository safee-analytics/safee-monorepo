export function extractDeviceName(userAgent: string): string {
  // Simple device name extraction
  if (userAgent.includes("Mobile")) return "Mobile Device";
  if (userAgent.includes("iPad")) return "iPad";
  if (userAgent.includes("iPhone")) return "iPhone";
  if (userAgent.includes("Android")) return "Android Device";
  if (userAgent.includes("Windows")) return "Windows PC";
  if (userAgent.includes("Macintosh")) return "Mac";
  if (userAgent.includes("Linux")) return "Linux PC";
  return "Unknown Device";
}
