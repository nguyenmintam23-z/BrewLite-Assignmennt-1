import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';
import { validateEnvironment } from './env';

async function bootstrap(): Promise<void> {
  validateEnvironment();
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  await app.listen(Number(process.env.PORT || 3001), '0.0.0.0');
}

void bootstrap();
