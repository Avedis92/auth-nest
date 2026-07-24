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

@Module({
  imports: [
    UsersModule,
    DatabaseModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, smtpConfig],
      validationSchema,
      envFilePath: '.env',
    }),
    ProtectedModule,
    MailerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
