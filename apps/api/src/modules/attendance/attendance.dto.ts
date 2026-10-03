export class MarkStudentAttendanceDto {
  classId?: string;
  sectionId?: string;
  batchId?: string;
  date!: string; // YYYY-MM-DD
  records!: Array<{
    studentId: string;
    status: 'present' | 'absent' | 'late' | 'leave' | 'holiday';
    remarks?: string;
  }>;
}

export class QueryStudentAttendanceDto {
  classId?: string;
  sectionId?: string;
  batchId?: string;
  date!: string; // YYYY-MM-DD
}

export class EditStudentAttendanceDto {
  status!: 'present' | 'absent' | 'late' | 'leave' | 'holiday';
  remarks?: string;
}

export class StaffSelfieCheckInDto {
  photoBase64!: string; // live photo capture
  latitude!: number;
  longitude!: number;
  accuracyMeters?: number;
  isMockLocation?: boolean;
  deviceInfo?: string;
}

export class StaffSelfieCheckOutDto {
  photoBase64!: string;
  latitude!: number;
  longitude!: number;
  accuracyMeters?: number;
}

export class ReviewStaffAttendanceDto {
  action!: 'approve' | 'reject';
  rejectionReason?: string;
}

export class AdminOverrideStaffAttendanceDto {
  staffId!: string;
  date!: string; // YYYY-MM-DD
  status!: 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'holiday';
  checkInTime?: string;
  checkOutTime?: string;
  overrideReason!: string;
}

export class RecordConsentDto {
  consentType!: string; // selfie_attendance, terms, privacy
}
