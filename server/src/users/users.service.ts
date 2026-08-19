import {
  Injectable,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { CreateUserInput } from 'src/common/types';
import type { PoolClient } from 'pg';
import { UsersRepository } from './users.repository';
import { hashAnElement, verifyAHashedElement } from 'src/common/helpers/hash';
import {
  USERS_ERROR_STATUS,
  CreateUserType,
  Tables,
  USERROLE,
} from 'src/common/types';
import { generateUpdateQuery } from 'src/common/queries/update';
import type { CreateUserDto } from './pipes/validate-users/create-user-schema';

// interface UserCacheType {
//   email: string;
//   signUpDate: Date;
//   role: USERROLE;
// }

// type InfoToUpdate = Partial<
//   Pick<CreateUserType, 'id' | 'email' | 'role' | 'created_at'>
// >;
@Injectable()
export class UsersService {
  // private usersCache = new Map<string, UserCacheType>();
  constructor(private usersRepository: UsersRepository) {}

  // private addInfoToCache(
  //   info: Pick<CreateUserType, 'id' | 'email' | 'role' | 'created_at'>,
  // ) {
  //   const { id, email, role, created_at } = info;
  //   this.usersCache.set(id, { email, role, signUpDate: created_at });
  // }

  // private updateUserCacheInfo(userId: string, updateInfo: InfoToUpdate) {
  //   const user = this.usersCache.get(userId) as UserCacheType;
  //   this.usersCache.set(userId, {
  //     ...user,
  //     ...updateInfo,
  //   });
  // }

  async create(userDto: CreateUserInput) {
    const { password } = userDto;
    const hashedPassword = password ? await hashAnElement(password) : null;
    const result = await this.usersRepository.create({
      ...userDto,
      password: hashedPassword,
    });
    // this.addInfoToCache(result);
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

  async findByIdForUpdate(id: string, client: PoolClient) {
    const foundUser = await this.usersRepository.findByIdForUpdate(id, client);
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
    client?: PoolClient,
  ) {
    const { queryText, values } = generateUpdateQuery(
      filters,
      options,
      Tables.USERS,
    );
    const foundUser = await this.usersRepository.updateUser(
      queryText,
      values,
      client,
    );
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

    if (user.disable) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'This account has been disabled. Contact an administrator.',
        code: USERS_ERROR_STATUS.DISABLED,
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

  async changeUserRole(userId: string, role: USERROLE, client?: PoolClient) {
    const user = await this.updateUserInfo({ id: userId }, { role }, client);
    // this.updateUserCacheInfo(userId, { role });
    return user;
  }

  async disableUser(userId: string, client?: PoolClient) {
    const user = await this.updateUserInfo(
      { id: userId },
      { disable: true },
      client,
    );
    return user;
  }

  async enableUser(userId: string) {
    const user = await this.updateUserInfo({ id: userId }, { disable: false });
    return user;
  }

  async findAllPaginated(params: {
    limit: number;
    offset: number;
    search?: string;
    excludeSuperAdmin: boolean;
  }) {
    return this.usersRepository.findAllPaginated(params);
  }
}
