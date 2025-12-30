"use client";

interface ApiCall {
  method: string;
  endpoint: string;
  status?: number;
  duration?: number;
  timestamp: number;
}

class ApiProfiler {
  private calls: ApiCall[] = [];
  private timings = new Map<string, number>();
  private enabled = process.env.NODE_ENV === "development";

  startRequest(url: string, method: string) {
    if (!this.enabled) return;

    const endpoint = new URL(url).pathname.replace("/api/v1", "");
    this.timings.set(url, performance.now());

    console.log(`%c[API →] ${method} ${endpoint}`, "color: #3b82f6; font-weight: bold");
  }

  endRequest(url: string, status: number) {
    if (!this.enabled) return;

    const endpoint = new URL(url).pathname.replace("/api/v1", "");
    const startTime = this.timings.get(url);
    const duration = startTime ? performance.now() - startTime : 0;
    this.timings.delete(url);

    // Store call data
    this.calls.push({
      method: "",
      endpoint,
      status,
      duration,
      timestamp: Date.now(),
    });

    // Color coding
    const statusColor = status < 400 ? "#10b981" : "#ef4444";
    const durationColor = duration > 1000 ? "#ef4444" : duration > 500 ? "#f59e0b" : "#10b981";

    console.log(
      `%c[API ←] ${status} ${endpoint} %c${duration.toFixed(2)}ms`,
      `color: ${statusColor}; font-weight: bold`,
      `color: ${durationColor}; font-weight: bold`,
    );
  }

  getStats() {
    if (this.calls.length === 0) {
      console.log("No API calls recorded yet");
      return;
    }

    const endpoints = new Map<string, { count: number; totalDuration: number }>();

    this.calls.forEach((call) => {
      const existing = endpoints.get(call.endpoint) || { count: 0, totalDuration: 0 };
      endpoints.set(call.endpoint, {
        count: existing.count + 1,
        totalDuration: existing.totalDuration + (call.duration || 0),
      });
    });

    const sorted = Array.from(endpoints.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        count: stats.count,
        avgDuration: stats.totalDuration / stats.count,
        totalDuration: stats.totalDuration,
      }))
      .sort((a, b) => b.count - a.count);

    console.table(sorted);
  }

  clear() {
    this.calls = [];
    this.timings.clear();
    console.log("API profiler cleared");
  }
}

export const apiProfiler = new ApiProfiler();

// Add to window for easy access in console
if (typeof window !== "undefined") {
  (window as any).apiProfiler = apiProfiler;
}
