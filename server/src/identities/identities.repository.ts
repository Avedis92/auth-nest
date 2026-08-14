import { Inject, Injectable } from '@nestjs/common';
import { PG_POOL } from 'src/database/database.module';
import { Pool } from 'pg';
import { handleDatabaseError } from 'src/error/helper';
import { IdentityResult, IdentityInput } from 'src/common/types';

@Injectable()
export class IdentitiesRepository {
  constructor(@Inject(PG_POOL) private pool: Pool) {}

  async findIdentityByProviderAndProviderId(
    providerUserId: string,
    provider: string,
  ): Promise<IdentityResult | undefined> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM identities WHERE provider=$1 AND provider_id=$2`,
        [provider, providerUserId],
      );
      return result.rows[0];
    } catch (error) {
      console.error(`Failed to get identity: ${(error as Error).message}`);
      handleDatabaseError(error);
    }
  }
  async createIdentity(Identity: IdentityInput) {
    try {
      const { user_id, provider, provider_id } = Identity;
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
