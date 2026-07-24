// database/postgres-error-codes.enum.ts

/**
 * Postgres error codes (SQLSTATE).
 * Full reference: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export enum PostgresErrorCode {
  // Class 22 — Data Exception
  InvalidTextRepresentation = '22P02', // e.g. malformed UUID/int input

  // Class 23 — Integrity Constraint Violation
  NotNullViolation = '23502',
  ForeignKeyViolation = '23503',
  UniqueViolation = '23505',
  CheckViolation = '23514',

  // Class 42 — Syntax Error or Access Rule Violation
  UndefinedTable = '42P01',
  UndefinedColumn = '42703',
  InsufficientPrivilege = '42501',

  // Class 08 — Connection Exception
  ConnectionException = '08000',
  ConnectionDoesNotExist = '08003',
  ConnectionFailure = '08006',
  SqlClientUnableToEstablishSqlConnection = '08001',
  SqlServerRejectedEstablishmentOfSqlConnection = '08004',

  // Class 40 — Transaction Rollback
  DeadlockDetected = '40P01',
  SerializationFailure = '40001',
}
