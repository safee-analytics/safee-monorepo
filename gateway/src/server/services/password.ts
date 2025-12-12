import bcrypt from "bcryptjs";
import { getAuthConfig } from "../../config/index.js";
import { logger } from "../utils/logger.js";
import { PasswordValidationFailed, OperationFailed, NotImplemented } from "../errors.js";

export class PasswordService {
  private readonly config = getAuthConfig();

  constructor() {
    if (this.config.enableAuthentication) {
      logger.info(
        { bcryptRounds: this.config.bcryptRounds },
        "Password Service initialized with bcrypt rounds",
      );
    } else {
      logger.warn("🚨 Password Service initialized with authentication DISABLED - Development mode only!");
    }
  }

  async hashPassword(password: string): Promise<string> {
    if (!this.config.enableAuthentication) {
      logger.debug("Authentication disabled - returning plain text password (UNSAFE!)");
      return `dev-hashed-${password}`;
    }

    if (this.config.enablePasswordValidation && !this.validatePassword(password)) {
      throw new PasswordValidationFailed();
    }

    try {
      const hash = await bcrypt.hash(password, this.config.bcryptRounds);
      logger.debug("Password hashed successfully");
      return hash;
    } catch (err) {
      logger.error({ error: err }, "Failed to hash password");
      throw new OperationFailed("Password hashing");
    }
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!this.config.enableAuthentication) {
      logger.debug("Authentication disabled - allowing any password");
      return hash === `dev-hashed-${password}`;
    }

    try {
      const isValid = await bcrypt.compare(password, hash);
      logger.debug({ isValid }, "Password verification completed");
      return isValid;
    } catch (err) {
      logger.error({ error: err }, "Failed to verify password");
      throw new OperationFailed("Password verification");
    }
  }

  validatePassword(password: string): boolean {
    if (!this.config.enablePasswordValidation) {
      return true;
    }

    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const isValid =
      password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;

    if (!isValid) {
      logger.debug("Password validation failed");
    }

    return isValid;
  }

  getPasswordRequirements(): string[] {
    if (!this.config.enablePasswordValidation) {
      return ["Any password is accepted (development mode)"];
    }

    return [
      "At least 8 characters long",
      "Contains at least one uppercase letter (A-Z)",
      "Contains at least one lowercase letter (a-z)",
      "Contains at least one number (0-9)",
      'Contains at least one special character (!@#$%^&*(),.?":{}|<>)',
    ];
  }

  /**
   * Generate a random password for development/testing
   * Only works when authentication is disabled or password validation is disabled
   */
  generateRandomPassword(): string {
    if (this.config.enableAuthentication && this.config.enablePasswordValidation) {
      throw new NotImplemented("Random password generation in production mode");
    }

    if (this.config.enablePasswordValidation) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
      let password = "";

      password += "A"; // uppercase
      password += "a"; // lowercase
      password += "1"; // number
      password += "!"; // special char

      for (let i = 4; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      return password
        .split("")
        .sort(() => Math.random() - 0.5)
        .join("");
    }
    return "dev-password";
  }

  isAuthEnabled(): boolean {
    return this.config.enableAuthentication;
  }

  isPasswordValidationEnabled(): boolean {
    return this.config.enablePasswordValidation;
  }
}

export const passwordService = new PasswordService();
