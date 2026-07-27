import { Inject, Injectable } from '@nestjs/common';
import { PG_POOL } from 'src/database/database.module';
import { handleDatabaseError } from 'src/error/helper';
import { Pool } from 'pg';

@Injectable()
export class TwoFaRepository {
  constructor(@Inject(PG_POOL) private pool: Pool) {}

  async enableTwoFactorAuth(userId: string) {
    try {
      await this.pool.query(
        `UPDATE users
         SET is_two_factor_enabled = $1, updated_at=$2
         WHERE id = $3`,
        [true, new Date(), userId],
      );
    } catch (error) {
      console.error(
        `Failed to enable user two factor auth: ${(error as Error).message}`,
      );
      handleDatabaseError(error);
    }
  }
}
