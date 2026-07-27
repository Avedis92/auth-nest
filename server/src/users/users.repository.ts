import {
  Injectable,
  Inject,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { PG_POOL } from 'src/database/database.module';
import { Pool } from 'pg';
import type { CreateUserDto } from './pipes/validate-users/create-user-schema';
import * as bcrypt from 'bcrypt';
import { handleDatabaseError } from 'src/error/helper';
import { CreateUserType, USERS_ERROR_STATUS } from 'src/common/types';

@Injectable()
export class UsersRepository {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async create(
    userDto: CreateUserDto,
  ): Promise<Pick<CreateUserType, 'id' | 'email'>> {
    try {
      const { email, password, isUserRegisteredFor2FA = false } = userDto;
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await this.pool.query(
        `INSERT INTO users (email, password, is_user_registered_for_two_factor)
                VALUES($1, $2, $3) RETURNING id, email`,
        [email, hashedPassword, isUserRegisteredFor2FA],
      );
      return result.rows[0] as CreateUserType;
    } catch (error) {
      console.error(`Failed to create user: ${(error as Error).message}`);
      handleDatabaseError(error);
    }
  }
  async deleteById(userId: string) {
    try {
      await this.pool.query(`DELETE FROM users WHERE id=$1`, [userId]);
    } catch (error) {
      console.error(
        `Failed to delete user with id ${userId}. ${(error as Error).message}`,
      );
      handleDatabaseError(error);
    }
  }

  async findByEmail(email: string): Promise<CreateUserType> {
    // check if the user with that email exists or not.
    // 1- If the user exists, then return the user's data
    // 2- If not, then throw an not found exception
    try {
      const result = await this.pool.query(
        `SELECT * FROM users WHERE email = $1`,
        [email],
      );
      console.log(`FOUND USER: ${result.rows[0]}`);
      if (result.rows[0]) return result.rows[0] as CreateUserType;
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        message: `The user with email ${email} does not exist.`,
        code: USERS_ERROR_STATUS.NOT_FOUND,
      });
    } catch (error) {
      console.error(
        `ERROR WHEN SEARCHING FOR USER WITH EMAIL ${email}. error: ${(error as Error).message}`,
      );
      handleDatabaseError(error);
    }
  }
  async findById(id: string): Promise<CreateUserType> {
    // check if the user with that id exists or not.
    // 1- If the user exists, then return the user's data
    // 2- If not, then throw an not found exception
    try {
      const result = await this.pool.query(
        `SELECT * FROM users WHERE id = $1`,
        [id],
      );
      console.log(`FOUND USER: ${result.rows[0]}`);
      if (result.rows[0]) return result.rows[0] as CreateUserType;
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        message: `The user with id ${id} does not exist.`,
        code: USERS_ERROR_STATUS.NOT_FOUND,
      });
    } catch (error) {
      console.error(
        `ERROR WHEN SEARCHING FOR USER WITH ID ${id}. error: ${(error as Error).message}`,
      );
      handleDatabaseError(error);
    }
  }

  async setTwoFactorSecret(email: string, secret: string) {
    try {
      await this.pool.query(
        `UPDATE users
        SET two_factor_secret = $1
        WHERE email=$2`,
        [secret, email],
      );
    } catch (error) {
      console.error(
        `ERROR WHEN ADDING TWO FACTOR SECRET TO USER WITH EMAIL ${email}. error: ${(error as Error).message}`,
      );
      handleDatabaseError(error);
    }
  }
}
