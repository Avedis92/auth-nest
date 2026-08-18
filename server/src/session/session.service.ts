import { Injectable, NotFoundException, HttpStatus } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { hashAnElement } from 'src/common/helpers/hash';
import {
  SIGN_IN_METHOD,
  SessionType,
  Tables,
  USERSTATUS,
  JWTPayloadType,
} from 'src/common/types';
import { REFRESH_TOKEN_MAX_AGE_MS } from 'src/common/constant';
import { SessionRepository } from './session.repository';
import { generateUpdateQuery } from 'src/common/queries/update';
import { CustomJwtService } from 'src/custom-jwt/custom-jwt.service';
import * as crypto from 'crypto';

interface UserSessionsEntry {
  sessionIds: Set<string>;
  lastSignInDate: Date;
  lastSignOutDate: Date | null;
}

interface BatchUserInfoType {
  sessionsCount: number;
  signInDate: Date | null;
  signOutDate: Date | null;
}
@Injectable()
export class SessionService {
  // As this is only a demo project, the sessions info for each user is stored in a cache
  // This cache is going to be used for fast retrieval of session info per user
  // For this demo project we are only using a Map instead of redis like in memory DB's.
  // Of course, in real production systems we won't use this approach, we will use redis.
  // userId -> active session ids + rolling last sign-in/sign-out dates
  private sessions = new Map<string, UserSessionsEntry>();

  constructor(
    private sessionRepository: SessionRepository,
    private jwtService: CustomJwtService,
  ) {}

  async createSession(
    session_id: string,
    refreshToken: string,
    user_id: string,
    signInMethod = SIGN_IN_METHOD.EMAIL_AND_PASSWORD,
  ) {
    // generate a hashed content of the refresh token
    const hashedRefreshToken = await hashAnElement(refreshToken);
    const signInDate = Date.now();
    const expiredAt = new Date(signInDate + REFRESH_TOKEN_MAX_AGE_MS);
    await this.sessionRepository.createSession(
      session_id,
      hashedRefreshToken,
      user_id,
      signInMethod,
      expiredAt,
    );
    // if the user is signing in for the first time, create a new entry for them
    // otherwise, add the session to their existing set and bump the last sign-in date
    const existing = this.sessions.get(user_id);
    if (existing) {
      existing.sessionIds.add(session_id);
      existing.lastSignInDate = new Date(signInDate);
    } else {
      this.sessions.set(user_id, {
        sessionIds: new Set([session_id]),
        lastSignInDate: new Date(signInDate),
        lastSignOutDate: null,
      });
    }
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
    client?: PoolClient,
  ) {
    const { queryText, values } = generateUpdateQuery(
      filters,
      options,
      Tables.SESSIONS,
    );
    const sessions = await this.sessionRepository.updateSession(
      queryText,
      values,
      client,
    );
    return sessions;
  }

  async deleteSessionsByStatus(status: USERSTATUS) {
    await this.sessionRepository.deleteSessionsByStatus(status);
  }

  async revokeUserSession(sessionId: string, userId: string) {
    const expiredAt = new Date(Date.now());
    // Use session id to update the session's expiry date
    await this.updateSession(
      { id: sessionId },
      {
        expires_at: expiredAt,
        status: USERSTATUS.LOGGED_OUT,
        refresh_token: '',
      },
    );
    // we should remove the session from the user's active set
    // but we keep the last sign-out date in order to know when it was the last time they have signed out
    const entry = this.sessions.get(userId);
    if (entry) {
      entry.sessionIds.delete(sessionId);
      entry.lastSignOutDate = expiredAt;
    }
  }

  async revokeAllSessionsForUser(userId: string, client?: PoolClient) {
    await this.updateSession(
      { user_id: userId, status: USERSTATUS.ACTIVE },
      {
        status: USERSTATUS.LOGGED_OUT,
        refresh_token: '',
        expires_at: new Date(Date.now()),
      },
      client,
    );
    // clear the active sessions but keep the entry so the last sign-in/sign-out
    // dates remain available for logged-out users
    const entry = this.sessions.get(userId);
    if (entry) {
      entry.sessionIds.clear();
      entry.lastSignOutDate = new Date(Date.now());
    }
  }

  async issueTokenAndSession(userId: string, signInMethod?: SIGN_IN_METHOD) {
    // generate a new session id for the newly signed in user
    const session_id = crypto.randomUUID();

    const payload: JWTPayloadType = { sid: session_id, uid: userId };

    const { accessToken, refreshToken } =
      this.jwtService.generateBothAccessAndRefreshToken(payload);

    await this.createSession(session_id, refreshToken, userId, signInMethod);

    return {
      accessToken,
      refreshToken,
    };
  }

  getActiveSessionsCountPerUser(userId: string) {
    return this.sessions.get(userId)?.sessionIds.size ?? 0;
  }

  isRevoked(userId: string) {
    return !this.getActiveSessionsCountPerUser(userId);
  }

  // this is used to populate users info on admin dashboard, with faster retrieval
  getBatchUsersInfo(userIds: string[]): Map<string, BatchUserInfoType> {
    const result = new Map<string, BatchUserInfoType>();
    for (const id of userIds) {
      const entry = this.sessions.get(id);
      result.set(id, {
        sessionsCount: entry?.sessionIds.size ?? 0,
        signInDate: entry?.lastSignInDate ?? null,
        signOutDate: entry?.lastSignOutDate ?? null,
      });
    }
    return result;
  }
}
