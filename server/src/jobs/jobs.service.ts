import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RepositoryJobs } from './repository.jobs';

@Injectable()
export class JobsService {
  constructor(private jobsRepository: RepositoryJobs) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async deleteLoggedOutSessions() {
    await this.jobsRepository.deleteLoggedOutSessions();
  }
}
