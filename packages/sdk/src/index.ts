import {
  InstituteType,
  InstituteRole,
  CompanyRole,
  ApplicationState,
  InstituteStatus,
  AttendanceStatus,
  AssessmentType,
} from '@classo/config';

/**
 * Standard API Error Response (PRD Section 13)
 * { "error": { "code": "...", "message": "...", "details": [...] } }
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

/**
 * Standard Paginated Response (PRD Section 13)
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Institute Public Resolution (PRD USR-01)
 */
export interface InstitutePublicProfile {
  id: string;
  name: string;
  type: InstituteType;
  subdomain: string;
  code: string;
  logoUrl?: string | null;
  brandingColors?: {
    primary?: string;
    accent?: string;
  } | null;
  status: InstituteStatus;
}

/**
 * Authentication DTOs
 */
export interface LoginRequestDto {
  identifier: string; // email, phone, or admission number
  password?: string;
  otp?: string;
  role: InstituteRole;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  user: {
    id: string;
    fullName: string;
    role: InstituteRole;
    instituteId: string;
    permissions: string[];
  };
}

/**
 * Institute Self-Registration DTO (PRD REG-02)
 */
export interface RegisterInstituteDto {
  instituteName: string;
  instituteType: InstituteType;
  state: string;
  city: string;
  pinCode: string;
  address: string;
  officialPhone: string;
  officialEmail: string;
  principalName: string;
  principalPhone: string;
  principalEmail: string;
  affiliationNumber?: string;
  approxStudentCount: number;
  preferredSubdomain: string;
}
