import { Module } from '@nestjs/common';
import { TwoFaService } from './two-fa.service';
import { TwoFaRepository } from './two-fa.repository';
import { UsersModule } from 'src/users/users.module';
import { TwoFaController } from './two-fa.controller';
import { JwtModule } from '@nestjs/jwt';
import { JWTAuthGuard } from 'src/auth/guards/auth/auth.guard';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  providers: [TwoFaService, TwoFaRepository, JWTAuthGuard],
  imports: [UsersModule, JwtModule.register({}), AuthModule],
  controllers: [TwoFaController],
})
export class TwoFaModule {}
