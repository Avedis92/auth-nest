import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import { hashAnElement } from 'src/common/helpers/hash';
import {
  SIGN_IN_METHOD,
  SessionType,
  Tables,
  USERSTATUS,
} from 'src/common/types';
import { REFRESH_TOKEN_MAX_AGE_MS } from 'src/common/constant';
import { SessionRepository } from './session.repository';
import { generateUpdateQuery } from 'src/common/queries/update';

@Injectable()
export class SessionService {
  constructor(private sessionRepository: SessionRepository) {}

  async createSession(
    session_id: string,
    refreshToken: string,
    user_id: string,
    signInMethod = SIGN_IN_METHOD.EMAIL_AND_PASSWORD,
  ) {
    // generate a hashed content of the refresh token
    const hashedRefreshToken = await hashAnElement(refreshToken);
    const expiredAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS);
    await this.sessionRepository.createSession(
      session_id,
      hashedRefreshToken,
      user_id,
      signInMethod,
      expiredAt,
    );
  }

  async getSessionById(sessionId: string) {
    const foundSession = await this.sessionRepository.getBySessionId(sessionId);
    if (!foundSession) {
      throw new NotFoundException({
        statusCode: HttpStatus.NOT_FOUND,
        message: `The session with id ${sessionId} does not exist.`,
      });
    }
    return foundSession;
  }

  async updateSession(
    filters: Partial<SessionType>,
    options: Partial<SessionType>,
  ) {
    const { queryText, values } = generateUpdateQuery(
      filters,
      options,
      Tables.SESSIONS,
    );
    const session = await this.sessionRepository.updateSession(
      queryText,
      values,
    );
    return session;
  }

  async deleteSessionsByStatus(status: USERSTATUS) {
    await this.sessionRepository.deleteSessionsByStatus(status);
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
}
