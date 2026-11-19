import { ValidationPipe } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { NextFunction, Request, Response } from 'express';

export function configureApp(app: INestApplication): void {
  const allowedOrigin = new URL(
    process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  ).origin;

  app.use(cookieParser());
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const origin = req.header('origin');
      if (origin) {
        let requestOrigin: string;
        try {
          requestOrigin = new URL(origin).origin;
        } catch {
          res.status(403).json({ statusCode: 403, message: 'Origin không được phép' });
          return;
        }
        if (requestOrigin !== allowedOrigin) {
          res.status(403).json({ statusCode: 403, message: 'Origin không được phép' });
          return;
        }
      }
    }
    next();
  });
  app.enableCors({
    origin: allowedOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Idempotency-Key'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
}
