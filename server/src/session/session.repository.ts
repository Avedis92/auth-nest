import { Inject, Injectable } from '@nestjs/common';
import { PG_POOL } from 'src/database/database.constants';
import { Pool, PoolClient } from 'pg';
import { handleDatabaseError } from 'src/error/helper';
import { SIGN_IN_METHOD } from 'src/common/types';
import { SessionType, USERSTATUS } from 'src/common/types';

@Injectable()
export class SessionRepository {
  constructor(@Inject(PG_POOL) private pool: Pool) {}

  async createSession(
    session_id: string,
    refreshToken: string,
    user_id: string,
    signInMethod: SIGN_IN_METHOD,
    expiredAt: Date,
  ) {
    try {
      await this.pool.query(
        `INSERT INTO sessions (id,user_id,refresh_token, expires_at, sign_in_method) VALUES ($1, $2, $3, $4,$5)`,
        [session_id, user_id, refreshToken, expiredAt, signInMethod],
      );
    } catch (error) {
      console.error(`Failed to generate session: ${(error as Error).message}`);
      handleDatabaseError(error);
    }
  }

  async getBySessionId(sessionId: string): Promise<SessionType | undefined> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM sessions WHERE id = $1;',
        [sessionId],
      );
      return result.rows[0];
    } catch (error) {
      console.error(`Failed to get session: ${(error as Error).message}`);
      handleDatabaseError(error);
    }
  }

  async updateSession(
    queryText: string,
    values: any,
    client?: PoolClient,
  ): Promise<SessionType[]> {
    try {
      const result = await (client ?? this.pool).query(queryText, values);
      return result.rows;
    } catch (error) {
      console.error(`Failed to update session: ${(error as Error).message}`);
      handleDatabaseError(error);
    }
  }

  async deleteSessionsByStatus(status: USERSTATUS) {
    try {
      const result = await this.pool.query(
        'DELETE FROM sessions WHERE status=$1 RETURNING *',
        [status],
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
