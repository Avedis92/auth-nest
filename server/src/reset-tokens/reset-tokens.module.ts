import { Module } from '@nestjs/common';
import { ResetTokensService } from './reset-tokens.service';
import { ResetTokensRepository } from './reset-tokens.repository';
import { CustomJwtModule } from 'src/custom-jwt/custom-jwt.module';

@Module({
  providers: [ResetTokensService, ResetTokensRepository],
  exports: [ResetTokensService],
  imports: [CustomJwtModule],
})
export class ResetTokensModule {}
