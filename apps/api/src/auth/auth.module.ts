import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenRevocationService } from './token-revocation.service';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error('JWT_SECRET is required');
        return { secret };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenRevocationService],
  exports: [JwtModule, TokenRevocationService],
})
export class AuthModule {}
