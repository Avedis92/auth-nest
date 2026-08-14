import { Inject, Injectable } from '@nestjs/common';
import { PG_POOL } from 'src/database/database.module';
import { Pool } from 'pg';
import { handleDatabaseError } from 'src/error/helper';
import { ResetTokenType } from 'src/common/types';

@Injectable()
export class ResetTokensRepository {
  constructor(@Inject(PG_POOL) private pool: Pool) {}

  async generateResetToken(resetToken: string): Promise<ResetTokenType> {
    try {
      const result = await this.pool.query(
        `INSERT INTO reset_tokens (token)
          VALUES ($1) RETURNING *`,
        [resetToken],
      );
      return result.rows[0];
    } catch (error) {
      console.error(
        `Failed to generate reset tokens: ${(error as Error).message}`,
      );
      handleDatabaseError(error);
    }
  }

  async findTokenByToken(
    resetToken: string,
  ): Promise<ResetTokenType | undefined> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM reset_tokens WHERE token=$1',
        [resetToken],
      );
      return result.rows[0];
    } catch (error) {
      console.error(`Failed to get reset token: ${(error as Error).message}`);
      handleDatabaseError(error);
    }
  }

  async deleteTokeByToken(resetToken: string) {
    try {
      await this.pool.query(`DELETE FROM reset_tokens WHERE token=$1`, [
        resetToken,
      ]);
    } catch (error) {
      console.error(
        `Failed to delete reset token: ${(error as Error).message}`,
      );
      handleDatabaseError(error);
    }
  }
  async deleteTokeById(id: string) {
    try {
      await this.pool.query(`DELETE FROM reset_tokens WHERE id=$1`, [id]);
    } catch (error) {
      console.error(
        `Failed to delete reset token: ${(error as Error).message}`,
      );
      handleDatabaseError(error);
    }
  }
}
