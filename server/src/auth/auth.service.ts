import { Injectable, UnauthorizedException, HttpStatus } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import type { CreateUserDto } from 'src/users/pipes/validate-users/create-user-schema';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { AuthRepository } from './auth.repository';
import * as bcrypt from 'bcrypt';
import {
  USERSTATUS,
  JWTPayloadType,
  JWT_TOKEN_ERROR_STATUS,
  CreateUserType,
} from 'src/common/types';
import { REFRESH_TOKEN_MAX_AGE_MS } from 'src/common/constant';
import type {
  CreatePasswordDto,
  ResetPasswordDto,
} from './pipes/validate-password/create-password-schema';
import type { CreateEmailDto } from './pipes/validate-email/create-email-schema';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private authRepository: AuthRepository,
  ) {}

  generateAccessToken(payload: Partial<JWTPayloadType>, temporary = false) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.jwtAccessTokenSecret'),
      expiresIn: temporary
        ? this.configService.get('jwt.jwtTempAccessTokenExpire')
        : this.configService.get('jwt.jwtAccessTokenExpire'),
    });
  }

  private generateRefreshToken(payload: JWTPayloadType) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.jwtRefreshTokenSecret'),
      expiresIn: this.configService.get('jwt.jwtRefreshTokenExpire'),
    });
  }
  private generateBothAccessAndRefreshToken(payload: JWTPayloadType) {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);
    return { accessToken, refreshToken };
  }

  async validateIfUserExists(userDto: CreateUserDto) {
    const { email, password } = userDto;
    const user = await this.userService.findByEmail(email);
    const passwordsMatches = await bcrypt.compare(password, user.password);
    if (!passwordsMatches) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: `The password that is send for the user ${user.id} does not match the password in the database`,
      });
    }
    return user;
  }

  private async extractRefreshToken(refreshToken?: string) {
    try {
      if (refreshToken) {
        const payload: JWTPayloadType = await this.jwtService.verifyAsync(
          refreshToken,
          {
            secret: this.configService.get('jwt.jwtRefreshTokenSecret'),
          },
        );
        return payload;
      }
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Session is expired. User should login again',
        code: JWT_TOKEN_ERROR_STATUS.TOKEN_MISSING,
      });
    } catch (error) {
      if ((error as Error).name === 'JsonWebTokenError') {
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Token is invalid or tampered',
          code: JWT_TOKEN_ERROR_STATUS.TOKEN_INVALID,
        });
      }
      throw error;
    }
  }

  async signUp(userDto: CreateUserDto) {
    await this.userService.create(userDto);
  }

  async singIn(user: CreateUserType) {
    const { id } = user;
    // generate a new session id for the newly signed in user
    const session_id = crypto.randomUUID();

    const payload: JWTPayloadType = { sid: session_id, uid: id };

    const { accessToken, refreshToken } =
      this.generateBothAccessAndRefreshToken(payload);

    await this.authRepository.createSession(session_id, refreshToken, id);
    return {
      accessToken,
      refreshToken,
    };
  }

  async signOut(refreshToken?: string) {
    // We have 2 scenarios in this situation:
    // If the user has a non expired cookie, then we can extract the refresh token, and then the session id and update the session expiration from there.
    // If the user has an expired cookie, means that no cookie is sent to the server, which mean this specific session is also expired automatically.
    const payload = await this.extractRefreshToken(refreshToken);
    const expiredAt = new Date(Date.now());
    // Use session id to update the session's expiry date
    await this.authRepository.updateSession(
      { id: payload.sid },
      {
        expires_at: expiredAt,
        status: USERSTATUS.LOGGED_OUT,
        refresh_token: '',
      },
    );
  }
  async refresh(refresh_Token?: string) {
    // First check if refresh token exists. If not, then throw an unauthorized error
    // and user should sign in again
    if (!refresh_Token) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Refresh token not found',
        code: JWT_TOKEN_ERROR_STATUS.TOKEN_MISSING,
      });
    }
    // Otherwise, extract session id from refresh token
    // And then get the session info.
    // If the session info is valid and refresh token matches session's token
    // Then generate new access and refresh tokens, update the refresh token and session expiration date with the new values.
    // If the session info is valid but tokens do not match,then make user sign out and force them to sign in again.
    const payload = await this.extractRefreshToken(refresh_Token);
    const sessionInfo = await this.authRepository.getBySessionId(payload.sid);
    const tokensMatch = await bcrypt.compare(
      refresh_Token,
      sessionInfo.refresh_token,
    );
    // 2. Session exists but is already logged out and before a script removes this session from the table.
    const isExpired = sessionInfo.expires_at < new Date();
    if (sessionInfo.status === USERSTATUS.LOGGED_OUT || isExpired) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Session expired or inactive',
        code: JWT_TOKEN_ERROR_STATUS.TOKEN_INVALID,
      });
    }
    // 3. Session is "active" but token doesn't match -> likely reuse of an old/stolen token.
    // Revoke *everything* for this user, not just this one session.
    if (!tokensMatch) {
      await this.authRepository.revokeAllSessionsForUser(sessionInfo.user_id);
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Refresh token reuse detected, please sign in again',
        code: JWT_TOKEN_ERROR_STATUS.TOKEN_REUSE_DETECTED,
      });
    }
    const newPayload: JWTPayloadType = { sid: payload.sid, uid: payload.uid };
    const { accessToken, refreshToken } =
      this.generateBothAccessAndRefreshToken(newPayload);
    const expiredAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS);
    const newHashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.authRepository.updateSession(
      { id: payload.sid },
      {
        expires_at: expiredAt,
        refresh_token: newHashedRefreshToken,
      },
    );
    return { accessToken, refreshToken };
  }
  async changePassword(userId: string, passwordDto: CreatePasswordDto) {
    await this.authRepository.changePassword(userId, passwordDto);
  }

  async forgotPassword(emailDto: CreateEmailDto) {
    await this.authRepository.forgotPassword(emailDto);
  }

  async resetPassword(resetDto: ResetPasswordDto) {
    await this.authRepository.resetPassword(resetDto);
  }
}
