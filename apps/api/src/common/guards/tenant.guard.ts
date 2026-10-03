import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthService, TokenPayload } from '../auth/jwt.service.js';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
  instituteId?: string;
  headers: Headers & Record<string, string | undefined>;
}

@Injectable()
export class TenantAuthGuard implements CanActivate {
  private jwtService = new JwtAuthService();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Aap logged in nahi hain. Kripya login karein.',
      });
    }

    const token = authHeader.substring(7);
    try {
      const payload = this.jwtService.verifyAccessToken(token);

      // Enforce: Never trust client-provided institute_id in body/query (PRD 4.2)
      request.user = payload;
      request.instituteId = payload.instituteId;

      return true;
    } catch {
      throw new ForbiddenException({
        code: 'INVALID_TOKEN',
        message: 'Aapka session expire ho gaya hai. Dobara login karein.',
      });
    }
  }
}
