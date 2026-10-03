import { describe, it, expect } from 'vitest';
import { PasswordService } from './password.service.js';
import { JwtAuthService } from './jwt.service.js';
import { scrubSensitiveData } from '../logging/structured-logger.service.js';

describe('Phase 0 Auth & Security Services', () => {
  it('SEC-02: PasswordService hashes and verifies passwords using argon2id', async () => {
    const plainPassword = 'CorrectHorseBatteryStaple!2026';
    const hash = await PasswordService.hash(plainPassword);

    expect(hash).toContain('$argon2id$');

    const isValid = await PasswordService.verify(hash, plainPassword);
    expect(isValid).toBe(true);

    const isInvalid = await PasswordService.verify(hash, 'WrongPassword');
    expect(isInvalid).toBe(false);
  });

  it('SEC-03: JwtAuthService issues 15-minute access tokens and rotating refresh tokens', () => {
    const jwtService = new JwtAuthService('test_access_secret', 'test_refresh_secret');

    const payload = {
      sub: 'user-uuid-1234',
      instituteId: 'inst-uuid-5678',
      role: 'teacher',
      permissions: ['attendance.mark', 'homework.create'],
    };

    const accessToken = jwtService.generateAccessToken(payload);
    expect(typeof accessToken).toBe('string');

    const decoded = jwtService.verifyAccessToken(accessToken);
    expect(decoded.sub).toBe('user-uuid-1234');
    expect(decoded.instituteId).toBe('inst-uuid-5678');
    expect(decoded.role).toBe('teacher');
    expect(decoded.permissions).toEqual(['attendance.mark', 'homework.create']);
    expect(decoded.tokenType).toBe('access');

    // Refresh token with hash
    const { token: refreshToken, hash } = jwtService.generateRefreshToken(
      'user-uuid-1234',
      'inst-uuid-5678'
    );
    expect(typeof refreshToken).toBe('string');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBe(64); // SHA-256 hex string

    const decodedRefresh = jwtService.verifyRefreshToken(refreshToken);
    expect(decodedRefresh.sub).toBe('user-uuid-1234');
    expect(decodedRefresh.instituteId).toBe('inst-uuid-5678');
  });

  it('ISO-05: StructuredLogger scrubs sensitive credentials, tokens, and PII', () => {
    const sensitivePayload = {
      email: 'user@example.com',
      password: 'SuperSecretPassword',
      token: 'eyJhbGciOi...',
      passwordHash: '$argon2id$v=19$m=65536...',
      nested: {
        twoFactorSecret: 'JBSWY3DPEHPK3PXP',
        bankAccount: '1234567890',
        safeKey: 'SafeValue',
      },
    };

    const cleaned = scrubSensitiveData(sensitivePayload) as Record<string, unknown>;

    expect(cleaned.password).toBe('[REDACTED]');
    expect(cleaned.token).toBe('[REDACTED]');
    expect(cleaned.passwordHash).toBe('[REDACTED]');
    expect((cleaned.nested as Record<string, unknown>).twoFactorSecret).toBe('[REDACTED]');
    expect((cleaned.nested as Record<string, unknown>).bankAccount).toBe('[REDACTED]');
    expect((cleaned.nested as Record<string, unknown>).safeKey).toBe('SafeValue');
  });
});
