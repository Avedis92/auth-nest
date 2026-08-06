import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { RepositoryJobs } from './repository.jobs';

@Module({
  providers: [JobsService, RepositoryJobs],
})
export class JobsModule {}
