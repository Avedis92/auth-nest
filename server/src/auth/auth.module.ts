import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthRepository } from './auth.repository';
import { JWTAuthGuard } from './guards/auth/auth.guard';
import { MailerModule } from 'src/mailer/mailer.module';
import { GoogleService } from './google.service';
import { PkceService } from './pkce.service';
import { GoogleRepository } from './google.repository';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    JWTAuthGuard,
    GoogleService,
    PkceService,
    GoogleRepository,
  ],
  imports: [UsersModule, JwtModule.register({}), MailerModule],
  exports: [AuthService, AuthRepository],
})
export class AuthModule {}
