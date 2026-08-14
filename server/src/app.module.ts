import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { validationSchema } from './config/configuration.validation';
import { ConfigModule } from '@nestjs/config';
import { ProtectedModule } from './protected/protected.module';
import { MailerModule } from './mailer/mailer.module';
import { smtpConfig } from './config/smtp.config';
import { TwoFaModule } from './two-fa/two-fa.module';
import { googleOAuthConfig } from './config/googleOAuth.config';
import { JobsModule } from './jobs/jobs.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SessionModule } from './session/session.module';
import { ResetTokensModule } from './reset-tokens/reset-tokens.module';
import { CustomJwtModule } from './custom-jwt/custom-jwt.module';
import { EncryptionModule } from './encryption/encryption.module';
import { encryptionConfig } from './config/encryption.config';
import { IdentitiesModule } from './identities/identities.module';

@Module({
  imports: [
    UsersModule,
    DatabaseModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        jwtConfig,
        smtpConfig,
        googleOAuthConfig,
        encryptionConfig,
      ],
      validationSchema,
      envFilePath: '.env',
    }),
    ProtectedModule,
    MailerModule,
    TwoFaModule,
    JobsModule,
    ScheduleModule.forRoot(),
    SessionModule,
    ResetTokensModule,
    CustomJwtModule,
    EncryptionModule,
    IdentitiesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
