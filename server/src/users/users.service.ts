import {
  Injectable,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { CreateUserInput } from 'src/common/types';
import { UsersRepository } from './users.repository';
import { hashAnElement, verifyAHashedElement } from 'src/common/helpers/hash';
import { USERS_ERROR_STATUS, CreateUserType, Tables } from 'src/common/types';
import { generateUpdateQuery } from 'src/common/queries/update';
import type { CreateUserDto } from './pipes/validate-users/create-user-schema';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async create(userDto: CreateUserInput) {
    const { password } = userDto;
    const hashedPassword = password ? await hashAnElement(password) : null;
    const result = await this.usersRepository.create({
      ...userDto,
      password: hashedPassword,
    });
    return result;
  }

  async deleteById(userId: string) {
    await this.usersRepository.deleteById(userId);
  }

  async findByEmail(email: string) {
    const foundUser = await this.usersRepository.findByEmail(email);
    if (!foundUser) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        message: `The user with email ${email} does not exist.`,
        code: USERS_ERROR_STATUS.NOT_FOUND,
      });
    }
    return foundUser;
  }
  async findById(id: string) {
    const foundUser = await this.usersRepository.findById(id);
    if (!foundUser) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        message: `The user with id ${id} does not exist.`,
        code: USERS_ERROR_STATUS.NOT_FOUND,
      });
    }
    return foundUser;
  }

  async updateUserInfo(
    filters: Partial<CreateUserType>,
    options: Partial<CreateUserType>,
  ) {
    const { queryText, values } = generateUpdateQuery(
      filters,
      options,
      Tables.USERS,
    );
    const foundUser = await this.usersRepository.updateUser(queryText, values);
    if (!foundUser) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        message: `The following user is unable to be updated as it does not exist`,
        code: USERS_ERROR_STATUS.NOT_FOUND,
      });
    }
    return foundUser;
  }

  async validateUserCredentials(userDto: CreateUserDto) {
    const { email, password } = userDto;
    const user = await this.findByEmail(email);
    // OAuth-created accounts have no password — skip straight to the
    // mismatch branch instead of letting bcrypt.compare throw on a null hash.
    const passwordsMatches =
      !!user.password && (await verifyAHashedElement(password, user.password));

    if (!passwordsMatches) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: `The password that is send for the user ${user.id} does not match the password in the database`,
      });
    }
    return user;
  }

  async enableTwoFactorAuth(userId: string) {
    const user = await this.updateUserInfo(
      { id: userId },
      { is_two_factor_enabled: true, updated_at: new Date() },
    );
    return user;
  }
  async setTowFactorSecret(email: string, secret: string) {
    const user = await this.updateUserInfo(
      { email },
      { two_factor_secret: secret },
    );
    return user;
  }
}
