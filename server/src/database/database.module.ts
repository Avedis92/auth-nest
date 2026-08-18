import { Global, Module } from '@nestjs/common';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { Pool } from 'pg';
import { DatabaseService } from './database.service';

export const PG_POOL = 'PG_POOL';
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      inject: [ConfigService],
      provide: PG_POOL,
      useFactory: (configService: ConfigService) => {
        return new Pool({
          host: configService.get('database.host'),
          port: configService.get('database.port'),
          user: configService.get('database.user'),
          password: configService.get('database.password'),
          database: configService.get('database.name'),
          max: 20, // max connections in pool
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        });
      },
    },
    DatabaseService,
  ],
  exports: [PG_POOL, DatabaseService],
})
export class DatabaseModule {}
