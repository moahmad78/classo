import { Module } from '@nestjs/common';
import {
  RegistrationController,
  ControlApplicationsController,
} from './registration.controller.js';
import { RegistrationService } from './registration.service.js';

@Module({
  controllers: [RegistrationController, ControlApplicationsController],
  providers: [RegistrationService],
  exports: [RegistrationService],
})
export class RegistrationModule {}
