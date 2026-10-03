import { Module } from '@nestjs/common';
import { AdmissionController } from './admission.controller.js';
import { AdmissionService } from './admission.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [AdmissionController],
  providers: [AdmissionService],
  exports: [AdmissionService],
})
export class AdmissionModule {}
