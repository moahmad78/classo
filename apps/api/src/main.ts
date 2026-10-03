import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { ApiExceptionFilter } from './common/filters/api-exception.filter.js';
import { logger } from './common/logging/structured-logger.service.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // PRD Section 13: REST, JSON, versioned: /api/v1/...
  app.setGlobalPrefix('api/v1');

  // CORS configured for institute app & control center
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global Exception Filter enforcing PRD 13 error schema
  app.useGlobalFilters(new ApiExceptionFilter());

  // OpenAPI / Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Classo API')
    .setDescription('Classo Multi-Tenant School, College & Coaching Management SaaS API')
    .setVersion('1.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);

  logger.info(`🚀 Classo Core API running at http://localhost:${port}/api/v1`);
  logger.info(`📖 OpenAPI Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  console.error('Fatal API bootstrap error:', err);
  process.exit(1);
});
