import { Injectable } from '@nestjs/common';
import type { CreateUserDto } from './pipes/validate-users/create-user-schema';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async create(userDto: CreateUserDto) {
    const result = await this.usersRepository.create(userDto);
    return result;
  }

  async deleteById(userId: string) {
    await this.usersRepository.deleteById(userId);
  }

  async findByEmail(email: string) {
    const foundUser = await this.usersRepository.findByEmail(email);
    return foundUser;
  }
  async findById(id: string) {
    const foundUser = await this.usersRepository.findById(id);
    return foundUser;
  }
  async setTowFactorSecret(email: string, secret: string) {
    await this.usersRepository.setTwoFactorSecret(email, secret);
  }
}
