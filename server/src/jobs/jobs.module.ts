import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { SessionModule } from 'src/session/session.module';

@Module({
  providers: [JobsService],
  imports: [SessionModule],
})
export class JobsModule {}
