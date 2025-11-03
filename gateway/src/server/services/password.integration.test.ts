import { describe, it, expect } from "vitest";
import { passwordService } from "./password.js";
import { PasswordValidationFailed } from "../errors.js";

describe("Password Service Integration Tests", () => {
  describe("hashPassword", () => {
    it("should hash password successfully", async () => {
      const password = "SecureP@ssw0rd123";
      const hash = await passwordService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it("should generate different hashes for same password", async () => {
      const password = "SecureP@ssw0rd123";
      const hash1 = await passwordService.hashPassword(password);
      const hash2 = await passwordService.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it("should hash complex password with special characters", async () => {
      const password = "C0mpl3x!@#$%^&*()P@ssw0rd";
      const hash = await passwordService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
    });

    it("should reject weak password when validation is enabled", async () => {
      if (!passwordService.isPasswordValidationEnabled()) {
        return; // Skip if validation is disabled
      }

      const weakPassword = "weak";

      await expect(passwordService.hashPassword(weakPassword)).rejects.toThrow(PasswordValidationFailed);
    });

    it("should accept strong password with all requirements", async () => {
      const strongPassword = "StrongP@ssw0rd123!";
      const hash = await passwordService.hashPassword(strongPassword);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(strongPassword);
    });
  });

  describe("verifyPassword", () => {
    it("should verify correct password", async () => {
      const password = "SecureP@ssw0rd123";
      const hash = await passwordService.hashPassword(password);

      const isValid = await passwordService.verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const password = "SecureP@ssw0rd123";
      const wrongPassword = "WrongP@ssw0rd456";
      const hash = await passwordService.hashPassword(password);

      const isValid = await passwordService.verifyPassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    it("should verify password with special characters", async () => {
      const password = "C0mpl3x!@#$%^&*()P@ssw0rd";
      const hash = await passwordService.hashPassword(password);

      const isValid = await passwordService.verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it("should be case sensitive", async () => {
      const password = "SecureP@ssw0rd123";
      const hash = await passwordService.hashPassword(password);

      const isValid = await passwordService.verifyPassword("securep@ssw0rd123", hash);

      expect(isValid).toBe(false);
    });

    it("should reject password with trailing spaces", async () => {
      const password = "SecureP@ssw0rd123";
      const hash = await passwordService.hashPassword(password);

      const isValid = await passwordService.verifyPassword(password + " ", hash);

      expect(isValid).toBe(false);
    });

    it("should reject password with leading spaces", async () => {
      const password = "SecureP@ssw0rd123";
      const hash = await passwordService.hashPassword(password);

      const isValid = await passwordService.verifyPassword(" " + password, hash);

      expect(isValid).toBe(false);
    });

    it("should handle empty password verification", async () => {
      const password = "SecureP@ssw0rd123";
      const hash = await passwordService.hashPassword(password);

      const isValid = await passwordService.verifyPassword("", hash);

      expect(isValid).toBe(false);
    });
  });

  describe("validatePassword", () => {
    it("should validate strong password", () => {
      if (!passwordService.isPasswordValidationEnabled()) {
        return; // Skip if validation is disabled
      }

      const strongPassword = "StrongP@ssw0rd123!";
      const isValid = passwordService.validatePassword(strongPassword);

      expect(isValid).toBe(true);
    });

    it("should reject password without uppercase", () => {
      if (!passwordService.isPasswordValidationEnabled()) {
        return;
      }

      const password = "weakp@ssw0rd123";
      const isValid = passwordService.validatePassword(password);

      expect(isValid).toBe(false);
    });

    it("should reject password without lowercase", () => {
      if (!passwordService.isPasswordValidationEnabled()) {
        return;
      }

      const password = "WEAKP@SSW0RD123";
      const isValid = passwordService.validatePassword(password);

      expect(isValid).toBe(false);
    });

    it("should reject password without numbers", () => {
      if (!passwordService.isPasswordValidationEnabled()) {
        return;
      }

      const password = "WeakP@ssword";
      const isValid = passwordService.validatePassword(password);

      expect(isValid).toBe(false);
    });

    it("should reject password without special characters", () => {
      if (!passwordService.isPasswordValidationEnabled()) {
        return;
      }

      const password = "WeakPassw0rd123";
      const isValid = passwordService.validatePassword(password);

      expect(isValid).toBe(false);
    });

    it("should reject password that is too short", () => {
      if (!passwordService.isPasswordValidationEnabled()) {
        return;
      }

      const password = "Sh0rt!";
      const isValid = passwordService.validatePassword(password);

      expect(isValid).toBe(false);
    });

    it("should accept password with exactly 8 characters", () => {
      if (!passwordService.isPasswordValidationEnabled()) {
        return;
      }

      const password = "Pass@123";
      const isValid = passwordService.validatePassword(password);

      expect(isValid).toBe(true);
    });

    it("should accept long password", () => {
      if (!passwordService.isPasswordValidationEnabled()) {
        return;
      }

      const password = "ThisIsAVeryLongAndSecureP@ssw0rd123WithManyCharacters!";
      const isValid = passwordService.validatePassword(password);

      expect(isValid).toBe(true);
    });
  });

  describe("getPasswordRequirements", () => {
    it("should return password requirements", () => {
      const requirements = passwordService.getPasswordRequirements();

      expect(requirements).toBeDefined();
      expect(Array.isArray(requirements)).toBe(true);
      expect(requirements.length).toBeGreaterThan(0);
    });

    it("should include length requirement", () => {
      if (!passwordService.isPasswordValidationEnabled()) {
        return;
      }

      const requirements = passwordService.getPasswordRequirements();
      const hasLengthReq = requirements.some(
        (req) => req.toLowerCase().includes("8") && req.includes("character"),
      );

      expect(hasLengthReq).toBe(true);
    });

    it("should include uppercase requirement", () => {
      if (!passwordService.isPasswordValidationEnabled()) {
        return;
      }

      const requirements = passwordService.getPasswordRequirements();
      const hasUppercaseReq = requirements.some((req) => req.toLowerCase().includes("uppercase"));

      expect(hasUppercaseReq).toBe(true);
    });

    it("should include lowercase requirement", () => {
      if (!passwordService.isPasswordValidationEnabled()) {
        return;
      }

      const requirements = passwordService.getPasswordRequirements();
      const hasLowercaseReq = requirements.some((req) => req.toLowerCase().includes("lowercase"));

      expect(hasLowercaseReq).toBe(true);
    });

    it("should include number requirement", () => {
      if (!passwordService.isPasswordValidationEnabled()) {
        return;
      }

      const requirements = passwordService.getPasswordRequirements();
      const hasNumberReq = requirements.some((req) => req.toLowerCase().includes("number"));

      expect(hasNumberReq).toBe(true);
    });

    it("should include special character requirement", () => {
      if (!passwordService.isPasswordValidationEnabled()) {
        return;
      }

      const requirements = passwordService.getPasswordRequirements();
      const hasSpecialCharReq = requirements.some((req) => req.toLowerCase().includes("special"));

      expect(hasSpecialCharReq).toBe(true);
    });
  });

  describe("Hash security", () => {
    it("should produce bcrypt-style hash", async () => {
      if (!passwordService.isAuthEnabled()) {
        return; // Skip if auth is disabled (uses dev mode)
      }

      const password = "SecureP@ssw0rd123";
      const hash = await passwordService.hashPassword(password);

      expect(hash).toMatch(/^\$2[aby]\$/);
    });

    it("should include bcrypt rounds in hash", async () => {
      if (!passwordService.isAuthEnabled()) {
        return;
      }

      const password = "SecureP@ssw0rd123";
      const hash = await passwordService.hashPassword(password);

      const parts = hash.split("$");
      expect(parts.length).toBeGreaterThanOrEqual(4);
      expect(parseInt(parts[2])).toBeGreaterThan(0); // rounds should be a positive number
    });

    it("should verify password regardless of hash order", async () => {
      const password = "SecureP@ssw0rd123";
      const hash1 = await passwordService.hashPassword(password);
      const hash2 = await passwordService.hashPassword(password);

      expect(await passwordService.verifyPassword(password, hash1)).toBe(true);
      expect(await passwordService.verifyPassword(password, hash2)).toBe(true);
    });
  });

  describe("Service configuration", () => {
    it("should report auth enabled status", () => {
      const isEnabled = passwordService.isAuthEnabled();

      expect(typeof isEnabled).toBe("boolean");
    });

    it("should report password validation status", () => {
      const isEnabled = passwordService.isPasswordValidationEnabled();

      expect(typeof isEnabled).toBe("boolean");
    });
  });
});
