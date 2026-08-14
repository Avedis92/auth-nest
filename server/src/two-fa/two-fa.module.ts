import { Module } from '@nestjs/common';
import { TwoFaService } from './two-fa.service';
import { UsersModule } from 'src/users/users.module';
import { TwoFaController } from './two-fa.controller';
import { JWTAuthGuard } from 'src/auth/guards/auth/auth.guard';
import { AuthModule } from 'src/auth/auth.module';
import { CustomJwtModule } from 'src/custom-jwt/custom-jwt.module';

@Module({
  providers: [TwoFaService, JWTAuthGuard],
  imports: [UsersModule, AuthModule, CustomJwtModule],
  controllers: [TwoFaController],
})
export class TwoFaModule {}
