import { Module } from '@nestjs/common';
import { ProtectedController } from './protected.controller';
import { JWTAuthGuard } from 'src/guards/auth.guard';
import { SessionRevocationGuard } from 'src/guards/session-revocation.guard';
import { UsersModule } from 'src/users/users.module';
import { CustomJwtModule } from 'src/custom-jwt/custom-jwt.module';
import { SessionModule } from 'src/session/session.module';

@Module({
  controllers: [ProtectedController],
  providers: [JWTAuthGuard, SessionRevocationGuard],
  imports: [UsersModule, CustomJwtModule, SessionModule],
})
export class ProtectedModule {}
