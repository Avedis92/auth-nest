import { Injectable, Inject } from '@nestjs/common';
import { PG_POOL } from 'src/database/database.module';
import { Pool } from 'pg';
import { GoogleIdentityResult, GoogleIdentityInput } from 'src/common/types';
import { handleDatabaseError } from 'src/error/helper';

@Injectable()
export class GoogleRepository {
  constructor(@Inject(PG_POOL) private pool: Pool) {}

  async findGoogleIdentityByProviderId(
    providerUserId: string,
  ): Promise<GoogleIdentityResult | undefined> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM identities WHERE provider=$1 AND provider_id=$2`,
        ['google', providerUserId],
      );
      return result.rows[0];
    } catch (error) {
      console.error(`Failed to get identity: ${(error as Error).message}`);
      handleDatabaseError(error);
    }
  }
  async createGoogleIdentity(googleIdentity: GoogleIdentityInput) {
    try {
      const { user_id, provider, provider_id } = googleIdentity;
      await this.pool.query(
        `INSERT INTO identities (user_id,provider,provider_id)
            VALUES ($1,$2,$3)`,
        [user_id, provider, provider_id],
      );
    } catch (error) {
      console.error(`Failed to create identity: ${(error as Error).message}`);
      handleDatabaseError(error);
    }
  }
}
