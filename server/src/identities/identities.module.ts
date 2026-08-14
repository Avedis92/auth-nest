import { Module } from '@nestjs/common';
import { IdentitiesService } from './identities.service';
import { IdentitiesRepository } from './identities.repository';

@Module({
  providers: [IdentitiesService, IdentitiesRepository],
  exports: [IdentitiesService],
})
export class IdentitiesModule {}
