import { Injectable, Inject } from '@nestjs/common';
import { PG_POOL } from 'src/database/database.module';
import { Pool } from 'pg';
import { handleDatabaseError } from 'src/error/helper';
import { USERSTATUS } from 'src/common/types';

@Injectable()
export class RepositoryJobs {
  constructor(@Inject(PG_POOL) private pool: Pool) {}

  async deleteLoggedOutSessions() {
    try {
      const result = await this.pool.query(
        'DELETE FROM sessions WHERE status=$1 RETURNING *',
        [USERSTATUS.LOGGED_OUT],
      );
      console.log(`Successfully deleted ${result.rowCount} rows.`);
      console.log('Deleted Data:', result.rows);
    } catch (error) {
      console.error(
        `Failed to delete logged out sessions: ${(error as Error).message}`,
      );
      handleDatabaseError(error);
    }
  }
}
