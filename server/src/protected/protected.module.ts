import { Module } from '@nestjs/common';
import { ProtectedController } from './protected.controller';
import { JWTAuthGuard } from 'src/auth/guards/auth/auth.guard';
import { UsersModule } from 'src/users/users.module';
import { CustomJwtModule } from 'src/custom-jwt/custom-jwt.module';

@Module({
  controllers: [ProtectedController],
  providers: [JWTAuthGuard],
  imports: [UsersModule, CustomJwtModule],
})
export class ProtectedModule {}
