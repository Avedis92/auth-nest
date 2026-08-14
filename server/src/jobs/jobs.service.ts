import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SessionService } from 'src/session/session.service';
import { USERSTATUS } from 'src/common/types';

@Injectable()
export class JobsService {
  constructor(private sessionService: SessionService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async deleteLoggedOutSessions() {
    await this.sessionService.deleteSessionsByStatus(USERSTATUS.LOGGED_OUT);
  }
}
