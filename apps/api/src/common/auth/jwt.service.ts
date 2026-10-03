import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ACCESS_TOKEN_EXPIRY_MINUTES, REFRESH_TOKEN_EXPIRY_DAYS } from '@classo/config';

export interface TokenPayload {
  sub: string; // user_id
  instituteId: string; // institute_id
  role: string; // active role
  permissions: string[]; // granted permission codes
  tokenType: 'access' | 'refresh';
}

export class JwtAuthService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;

  constructor(secret?: string, refreshSecret?: string) {
    this.jwtSecret = secret || process.env.JWT_SECRET || 'classo_super_secret_jwt_key_2026';
    this.jwtRefreshSecret =
      refreshSecret || process.env.JWT_REFRESH_SECRET || 'classo_super_secret_refresh_key_2026';
  }

  /**
   * Generates a 15-minute access token (PRD SEC-03)
   */
  generateAccessToken(payload: Omit<TokenPayload, 'tokenType'>): string {
    return jwt.sign(
      {
        ...payload,
        tokenType: 'access',
      },
      this.jwtSecret,
      {
        expiresIn: `${ACCESS_TOKEN_EXPIRY_MINUTES}m`,
        algorithm: 'HS256',
      }
    );
  }

  /**
   * Generates a 7-day refresh token with a secure random hash for rotation (PRD SEC-03)
   */
  generateRefreshToken(userId: string, instituteId: string): { token: string; hash: string } {
    const randomBytes = crypto.randomBytes(32).toString('hex');
    const token = jwt.sign(
      {
        sub: userId,
        instituteId,
        tokenType: 'refresh',
        jti: randomBytes,
      },
      this.jwtRefreshSecret,
      {
        expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d`,
        algorithm: 'HS256',
      }
    );

    const hash = crypto.createHash('sha256').update(token).digest('hex');
    return { token, hash };
  }

  /**
   * Verifies an access token
   */
  verifyAccessToken(token: string): TokenPayload {
    const decoded = jwt.verify(token, this.jwtSecret) as TokenPayload;
    if (decoded.tokenType !== 'access') {
      throw new Error('Invalid token type: expected access token');
    }
    return decoded;
  }

  /**
   * Verifies a refresh token
   */
  verifyRefreshToken(token: string): { sub: string; instituteId: string; jti: string } {
    const decoded = jwt.verify(token, this.jwtRefreshSecret) as {
      sub: string;
      instituteId: string;
      tokenType: string;
      jti: string;
    };
    if (decoded.tokenType !== 'refresh') {
      throw new Error('Invalid token type: expected refresh token');
    }
    return decoded;
  }
}
