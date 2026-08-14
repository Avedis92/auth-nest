import { Module } from '@nestjs/common';
import { GoogleService } from './google.service';
import { IdentitiesModule } from 'src/identities/identities.module';
import { CustomJwtModule } from 'src/custom-jwt/custom-jwt.module';
import { PkceService } from './pkce.service';
import { SessionModule } from 'src/session/session.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  providers: [GoogleService, PkceService],
  exports: [GoogleService],
  imports: [IdentitiesModule, CustomJwtModule, SessionModule, UsersModule],
})
export class GoogleModule {}
