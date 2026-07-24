import {
  Injectable,
  Inject,
  NotFoundException,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PG_POOL } from 'src/database/database.module';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { handleDatabaseError } from 'src/error/helper';
import {
  REFRESH_TOKEN_MAX_AGE_MS,
  RESET_TOKEN_MAX_AGE_MS,
} from 'src/common/constant';
import {
  SessionType,
  USERSTATUS,
  CreateUserType,
  ResetTokenType,
  USERS_ERROR_STATUS,
} from 'src/common/types';
import type {
  CreatePasswordDto,
  ResetPasswordDto,
} from './pipes/validate-password/create-password-schema';
import type { CreateEmailDto } from './pipes/validate-email/create-email-schema';
import { nanoid } from 'nanoid';
import { MailerService } from 'src/mailer/mailer.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthRepository {
  constructor(
    @Inject(PG_POOL) private pool: Pool,
    private mailService: MailerService,
    private config: ConfigService,
  ) {}

  async createSession(
    session_id: string,
    refreshToken: string,
    user_id: string,
  ) {
    try {
      // generate a hashed content of the refresh token
      const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
      const expiredAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS);
      await this.pool.query(
        `INSERT INTO sessions (id,user_id,refresh_token, expires_at) VALUES ($1, $2, $3, $4)`,
        [session_id, user_id, hashedRefreshToken, expiredAt],
      );
    } catch (error) {
      console.error(`Failed to generate session: ${(error as Error).message}`);
      handleDatabaseError(error);
    }
  }
  async updateSession(
    filters: Partial<SessionType>,
    options: Partial<SessionType>,
  ) {
    try {
      // 1. Extract keys and filter out undefined values
      const setKeys = Object.keys(options);
      const filterKeys = Object.keys(filters);

      // 2. Map keys to SET clause syntax: column_name = $1, column_name = $2...
      // We add 1 to index because $1 will be the first variable, $2 the second, etc.
      const setClause = setKeys
        .map((key, index) => `"${key}" = $${index + 1}`)
        .join(', ');

      // 2. Build WHERE clause, continuing the placeholder index from where SET left off
      const whereClause = filterKeys
        .map((key, index) => `"${key}" = $${setKeys.length + index + 1}`)
        .join(' AND ');

      // 3. Gather values in the exact same order as the keys
      const setValues = setKeys.map(
        (key) => options[key as keyof typeof options],
      );
      const filterValues = filterKeys.map(
        (key) => filters[key as keyof typeof filters],
      );
      const values = [...setValues, ...filterValues];

      // 4. Construct the final query string safely
      const queryText = `
      UPDATE sessions
      SET ${setClause}
      WHERE ${whereClause}
      RETURNING *;
    `;

      // 6. Execute the parameterized query
      const result = await this.pool.query(queryText, values);
      return result.rows[0] as SessionType;
    } catch (error) {
      console.error(`Failed to update session: ${(error as Error).message}`);
      handleDatabaseError(error);
    }
  }
  async getBySessionId(sessionId: string) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM sessions WHERE id = $1;',
        [sessionId],
      );
      return result.rows[0] as SessionType;
    } catch (error) {
      console.error(`Failed to get session: ${(error as Error).message}`);
      handleDatabaseError(error);
    }
  }
  async revokeAllSessionsForUser(userId: string) {
    await this.updateSession(
      { user_id: userId, status: USERSTATUS.ACTIVE },
      {
        status: USERSTATUS.LOGGED_OUT,
        refresh_token: '',
        expires_at: new Date(Date.now()),
      },
    );
  }

  async changePassword(userId: string, passwordDto: CreatePasswordDto) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM users WHERE id = $1',
        [userId],
      );
      const user = result.rows[0] as CreateUserType | undefined;
      if (!user)
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'User not found',
          code: USERS_ERROR_STATUS.NOT_FOUND,
        });
      const { oldPassword, password } = passwordDto;
      const oldPasswordMatch = await bcrypt.compare(oldPassword, user.password);
      if (!oldPasswordMatch)
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Wrong password',
        });
      const hashedPassword = await bcrypt.hash(password, 10);
      await this.pool.query(
        `UPDATE users
        SET password=$1,updated_at=$2
        WHERE id=$3`,
        [hashedPassword, new Date(), userId],
      );
    } catch (error) {
      console.error(`Failed to change password: ${(error as Error).message}`);
      handleDatabaseError(error);
    }
  }
  async forgotPassword(emailDto: CreateEmailDto) {
    try {
      const { email } = emailDto;
      const result = await this.pool.query(
        `SELECT * FROM users WHERE email=$1`,
        [email],
      );
      const user = result.rows[0] as CreateUserType | undefined;
      if (!user) {
        throw new NotFoundException({
          statusCode: HttpStatus.NOT_FOUND,
          message: `The user with email ${email} does not exist.`,
          code: USERS_ERROR_STATUS.NOT_FOUND,
        });
      }
      const resetToken = nanoid(64);
      const expiredAt = new Date(Date.now() + RESET_TOKEN_MAX_AGE_MS);
      await this.pool.query(
        `INSERT INTO reset_tokens (token,user_id,expires_at)
          VALUES ($1,$2,$3)`,
        [resetToken, user.id, expiredAt],
      );
      const domainUrl = this.config.get('smtp.frontendUrl') as string;
      const resetLink = `${domainUrl}/reset-password?token=${resetToken}`;
      await this.mailService.sendEmail(email, resetLink);
    } catch (error) {
      console.error(`Failed to extract user: ${(error as Error).message}`);
      handleDatabaseError(error);
    }
  }
  async resetPassword(resetDto: ResetPasswordDto) {
    // In order to reset password, the following must be done:
    // 1- Extract the reset token from the reset dto.
    // 2- Get the reset token info from the reset token table.
    // 3- If the reset token exists and it is not expired, then update the user password.
    // 4- If not, then tell the user that the reset was not successful and they should try to reset that password again.

    try {
      const { password, resetToken } = resetDto;
      const result = await this.pool.query(
        'SELECT * FROM reset_tokens WHERE token=$1',
        [resetToken],
      );
      const tokenInfo = result.rows[0] as ResetTokenType | undefined;
      if (!tokenInfo || tokenInfo.expires_at < new Date()) {
        throw new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid reset token.',
        });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      await this.pool.query(
        `UPDATE users
        SET password=$1,updated_at=$2
        WHERE id=$3`,
        [hashedPassword, new Date(), tokenInfo.user_id],
      );
      await this.pool.query(`DELETE FROM reset_tokens WHERE token=$1`, [
        resetToken,
      ]);
    } catch (error) {
      console.error(`Failed to extract user: ${(error as Error).message}`);
      handleDatabaseError(error);
    }
  }
}
