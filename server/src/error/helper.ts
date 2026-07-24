// database/database-exception.helper.ts
import {
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DatabaseError } from 'pg';
import { PostgresErrorCode } from './enums';

export function handleDatabaseError(error: unknown): never {
  if (!(error instanceof DatabaseError)) {
    throw error;
  }

  switch (error.code) {
    case PostgresErrorCode.UniqueViolation:
      throw new ConflictException(formatUniqueViolation(error));

    case PostgresErrorCode.ForeignKeyViolation:
      throw new BadRequestException('Referenced record does not exist');

    case PostgresErrorCode.NotNullViolation:
      throw new BadRequestException(`Missing required field: ${error.column}`);

    case PostgresErrorCode.CheckViolation:
      throw new BadRequestException('Value violates a database constraint');

    case PostgresErrorCode.InvalidTextRepresentation:
      throw new BadRequestException('Invalid input format');

    case PostgresErrorCode.DeadlockDetected:
    case PostgresErrorCode.SerializationFailure:
      // These are usually safe to retry at a higher layer
      throw new ConflictException('Operation could not complete, please retry');

    case PostgresErrorCode.ConnectionException:
    case PostgresErrorCode.ConnectionDoesNotExist:
    case PostgresErrorCode.ConnectionFailure:
    case PostgresErrorCode.SqlClientUnableToEstablishSqlConnection:
    case PostgresErrorCode.SqlServerRejectedEstablishmentOfSqlConnection:
      throw new ServiceUnavailableException('Database unavailable');

    case PostgresErrorCode.UndefinedTable:
    case PostgresErrorCode.UndefinedColumn:
    case PostgresErrorCode.InsufficientPrivilege:
      // These indicate a schema/config bug, not a client-caused error —
      // worth alerting on differently in logs, but still a safe 500 to the client
      throw new InternalServerErrorException('Database operation failed');

    default:
      throw new InternalServerErrorException('Database operation failed');
  }
}

function formatUniqueViolation(error: DatabaseError): string {
  if (error.detail) {
    const match = error.detail.match(/Key \(([^)]+)\)=/);
    if (match) {
      return `${match[1]} already exists`;
    }
  }
  return 'Duplicate entry';
}
