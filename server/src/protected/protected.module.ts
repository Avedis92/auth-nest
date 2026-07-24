import { Module } from '@nestjs/common';
import { ProtectedController } from './protected.controller';
import { JWTAuthGuard } from 'src/auth/guards/auth/auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [ProtectedController],
  providers: [JWTAuthGuard],
  imports: [UsersModule, JwtModule.register({})],
})
export class ProtectedModule {}
