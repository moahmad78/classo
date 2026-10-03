export class CreateTimetableDto {
  academicYearId?: string;
  classId?: string;
  sectionId?: string;
  batchId?: string;
  name!: string;
}

export class CreateTimetableSlotDto {
  dayOfWeek!: number; // 1 (Mon) .. 7 (Sun)
  periodNumber!: number;
  startTime!: string; // HH:mm
  endTime!: string; // HH:mm
  subjectId!: string;
  teacherId!: string;
  roomNumber?: string;
}

export class CreateSubstitutionDto {
  timetableSlotId!: string;
  date!: string; // YYYY-MM-DD
  substituteTeacherId!: string;
  reason?: string;
}
