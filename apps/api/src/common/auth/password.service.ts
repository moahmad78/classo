import argon2 from 'argon2';

/**
 * Security: PRD SEC-02
 * Passwords hashed using argon2id with RFC 9106 recommended parameters.
 */
export class PasswordService {
  /**
   * Hashes a plain text password using argon2id
   */
  static async hash(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
    });
  }

  /**
   * Verifies a plain text password against an argon2id hash
   */
  static async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }
}
