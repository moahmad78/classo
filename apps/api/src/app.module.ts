import { Module } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module.js';
import { RegistrationModule } from './modules/registration/registration.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { SetupModule } from './modules/setup/setup.module.js';
import { ControlModule } from './modules/control/control.module.js';

@Module({
  imports: [
    HealthModule,
    RegistrationModule,
    AuthModule,
    SetupModule,
    ControlModule,
  ],
})
export class AppModule {}
