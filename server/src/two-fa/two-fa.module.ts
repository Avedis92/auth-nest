import { Module } from '@nestjs/common';
import { TwoFaService } from './two-fa.service';
import { UsersModule } from 'src/users/users.module';
import { TwoFaController } from './two-fa.controller';
import { JWTAuthGuard } from 'src/guards/auth.guard';
import { SessionRevocationGuard } from 'src/guards/session-revocation.guard';
// import { AuthModule } from 'src/auth/auth.module';
import { CustomJwtModule } from 'src/custom-jwt/custom-jwt.module';
import { SessionModule } from 'src/session/session.module';

@Module({
  providers: [TwoFaService, JWTAuthGuard, SessionRevocationGuard],
  imports: [UsersModule, SessionModule, CustomJwtModule],
  controllers: [TwoFaController],
})
export class TwoFaModule {}
