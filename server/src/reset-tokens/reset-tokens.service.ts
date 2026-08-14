import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { ResetTokensRepository } from './reset-tokens.repository';

@Injectable()
export class ResetTokensService {
  constructor(private resetTokenRepository: ResetTokensRepository) {}

  // This will be temporary implementation, that will be updated later
  async createResetToken(token: string) {
    // generate a reset token
    await this.resetTokenRepository.generateResetToken(token);
  }

  async findToken(token: string) {
    const result = await this.resetTokenRepository.findTokenByToken(token);
    if (!result) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        message: `The token ${token} does not exist.`,
      });
    }
    return result;
  }

  async deleteToken(token: string) {
    await this.resetTokenRepository.deleteTokeByToken(token);
  }

  async deleteTokenById(id: string) {
    await this.resetTokenRepository.deleteTokeById(id);
  }
}
