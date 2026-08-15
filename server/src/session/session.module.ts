import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionRepository } from './session.repository';
import { CustomJwtModule } from 'src/custom-jwt/custom-jwt.module';

@Module({
  providers: [SessionService, SessionRepository],
  exports: [SessionService],
  imports: [CustomJwtModule],
})
export class SessionModule {}
