import { Module } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module.js';
import { RegistrationModule } from './modules/registration/registration.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { SetupModule } from './modules/setup/setup.module.js';
import { ControlModule } from './modules/control/control.module.js';
import { StructureModule } from './modules/structure/structure.module.js';
import { StudentModule } from './modules/students/student.module.js';
import { StaffModule } from './modules/staff/staff.module.js';
import { AdmissionModule } from './modules/admissions/admission.module.js';
import { AttendanceModule } from './modules/attendance/attendance.module.js';
import { TimetableModule } from './modules/timetable/timetable.module.js';
import { CommunicationModule } from './modules/communication/communication.module.js';
import { FeesModule } from './modules/fees/fees.module.js';

@Module({
  imports: [
    HealthModule,
    RegistrationModule,
    AuthModule,
    SetupModule,
    ControlModule,
    StructureModule,
    StudentModule,
    StaffModule,
    AdmissionModule,
    AttendanceModule,
    TimetableModule,
    CommunicationModule,
    FeesModule,
  ],
})
export class AppModule {}


