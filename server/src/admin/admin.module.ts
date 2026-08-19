import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersModule } from 'src/users/users.module';
import { SessionModule } from 'src/session/session.module';
import { CustomJwtModule } from 'src/custom-jwt/custom-jwt.module';
import { JWTAuthGuard } from 'src/guards/auth.guard';
import { SessionRevocationGuard } from 'src/guards/session-revocation.guard';
import { RolesGuard } from 'src/guards/roles.guard';

@Module({
  controllers: [AdminController],
  providers: [AdminService, JWTAuthGuard, SessionRevocationGuard, RolesGuard],
  imports: [UsersModule, SessionModule, CustomJwtModule],
})
export class AdminModule {}
