import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthRepository } from './auth.repository';
import { JWTAuthGuard } from './guards/auth/auth.guard';
import { MailerModule } from 'src/mailer/mailer.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, JWTAuthGuard],
  imports: [UsersModule, JwtModule.register({}), MailerModule],
})
export class AuthModule {}
