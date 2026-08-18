import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { JWTAuthGuard } from 'src/guards/auth.guard';
import { SessionRevocationGuard } from 'src/guards/session-revocation.guard';
import { MailerModule } from 'src/mailer/mailer.module';
import { SessionModule } from 'src/session/session.module';
import { CustomJwtModule } from 'src/custom-jwt/custom-jwt.module';
import { EncryptionModule } from 'src/encryption/encryption.module';
import { ResetTokensModule } from 'src/reset-tokens/reset-tokens.module';
import { GoogleModule } from 'src/oAuth/google/google.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JWTAuthGuard, SessionRevocationGuard],
  imports: [
    UsersModule,
    MailerModule,
    CustomJwtModule,
    SessionModule,
    EncryptionModule,
    ResetTokensModule,
    GoogleModule,
  ],
  exports: [AuthService],
})
export class AuthModule {}
