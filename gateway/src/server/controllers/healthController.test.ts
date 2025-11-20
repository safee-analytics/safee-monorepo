import { describe, it, expect, beforeEach } from "vitest";
import { HealthController } from "./healthController.js";

void describe("HealthController", () => {
  let controller: HealthController;

  beforeEach(() => {
    controller = new HealthController();
  });

  void describe("getHealth", () => {
    void it("should return health status with ok", async () => {
      const result = await controller.getHealth();

      expect(result.status).toBe("ok");
      expect(result.timestamp).toBeDefined();
      expect(typeof result.uptime).toBe("number");
      expect(result.version).toBeDefined();
    });

    void it("should return valid ISO timestamp", async () => {
      const result = await controller.getHealth();
      const timestamp = new Date(result.timestamp);

      expect(timestamp.toISOString()).toBe(result.timestamp);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });

    void it("should return positive uptime", async () => {
      const result = await controller.getHealth();

      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    void it("should return version from env or default", async () => {
      const result = await controller.getHealth();

      expect(result.version).toBeDefined();
      expect(typeof result.version).toBe("string");
      expect(result.version.length).toBeGreaterThan(0);
    });

    void it("should have consistent structure", async () => {
      const result = await controller.getHealth();

      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("timestamp");
      expect(result).toHaveProperty("uptime");
      expect(result).toHaveProperty("version");
    });

    void it("should return fresh timestamp on each call", async () => {
      const result1 = await controller.getHealth();

      await new Promise((resolve) => setTimeout(resolve, 10));

      const result2 = await controller.getHealth();

      expect(result2.timestamp).not.toBe(result1.timestamp);
      expect(new Date(result2.timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(result1.timestamp).getTime(),
      );
    });

    void it("should return increasing uptime on subsequent calls", async () => {
      const result1 = await controller.getHealth();

      await new Promise((resolve) => setTimeout(resolve, 100));

      const result2 = await controller.getHealth();

      expect(result2.uptime).toBeGreaterThan(result1.uptime);
    });
  });
});
