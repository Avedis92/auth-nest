import {
  Injectable,
  UnauthorizedException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import type { CreateUserDto } from 'src/users/pipes/validate-users/create-user-schema';
import { CustomJwtService } from 'src/custom-jwt/custom-jwt.service';
import { SessionService } from 'src/session/session.service';
import { ConfigService } from '@nestjs/config';
import {
  USERSTATUS,
  JWTPayloadType,
  JWT_TOKEN_ERROR_STATUS,
  CreateUserType,
  SIGN_IN_METHOD,
} from 'src/common/types';
import { REFRESH_TOKEN_MAX_AGE_MS } from 'src/common/constant';
import type {
  CreatePasswordDto,
  ResetPasswordDto,
} from './pipes/validate-password/create-password-schema';
import type { CreateEmailDto } from './pipes/validate-email/create-email-schema';
import {
  verifyAHashedElement,
  hashAnElement,
  hashTokenForLookup,
} from 'src/common/helpers/hash';
import { MailerService } from 'src/mailer/mailer.service';
import { EncryptionService } from 'src/encryption/encryption.service';
import { ResetTokensService } from 'src/reset-tokens/reset-tokens.service';
@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: CustomJwtService,
    private configService: ConfigService,
    private sessionService: SessionService,
    private mailService: MailerService,
    private encryptionService: EncryptionService,
    private resetTokensService: ResetTokensService,
  ) {}

  async signUp(userDto: CreateUserDto) {
    await this.userService.create(userDto);
  }

  async validateUserCredentials(userDto: CreateUserDto) {
    const user = await this.userService.validateUserCredentials(userDto);
    return user;
  }
  generateTwoFAResponse(user: CreateUserType) {
    return {
      twoFactorEnabled: user.is_two_factor_enabled,
      userRegisteredForTwoFactor: user.is_user_registered_for_two_factor,
      tempToken: this.jwtService.generateAccessToken({ uid: user.id }, true),
    };
  }

  async singIn(user: CreateUserType) {
    const { id } = user;

    const { accessToken, refreshToken } =
      await this.sessionService.issueTokenAndSession(id);

    return { accessToken, refreshToken };
  }

  async signOut(refreshToken?: string) {
    // We have 2 scenarios in this situation:
    // If the user has a non expired cookie, then we can extract the refresh token, and then the session id and update the session expiration from there.
    // If the user has an expired cookie, means that no cookie is sent to the server, which mean this specific session is also expired automatically.
    const payload = await this.jwtService.extractTokenInfo(
      'jwt.jwtRefreshTokenSecret',
      refreshToken,
    );

    await this.sessionService.revokeUserSession(payload.sid, payload.uid);
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
    const payload = await this.jwtService.extractTokenInfo(
      'jwt.jwtRefreshTokenSecret',
      refresh_Token,
    );

    const sessionInfo = await this.sessionService.getSessionById(payload.sid);

    const tokensMatch = await verifyAHashedElement(
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
      await this.sessionService.revokeAllSessionsForUser(sessionInfo.user_id);

      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Refresh token reuse detected, please sign in again',
        code: JWT_TOKEN_ERROR_STATUS.TOKEN_REUSE_DETECTED,
      });
    }

    const newPayload: JWTPayloadType = { sid: payload.sid, uid: payload.uid };

    const { accessToken, refreshToken } =
      this.jwtService.generateBothAccessAndRefreshToken(newPayload);

    const expiredAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS);

    const newHashedRefreshToken = await hashAnElement(refreshToken);

    await this.sessionService.updateSession(
      { id: payload.sid },
      {
        expires_at: expiredAt,
        refresh_token: newHashedRefreshToken,
      },
    );

    return { accessToken, refreshToken };
  }

  async changePassword(userId: string, passwordDto: CreatePasswordDto) {
    const foundUser = await this.userService.findById(userId);

    const { oldPassword, password } = passwordDto;

    if (!foundUser.password) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message:
          'This account signed in with oAuth and has no password to change.',
      });
    }

    const oldPasswordMatch = await verifyAHashedElement(
      oldPassword,
      foundUser.password,
    );

    if (!oldPasswordMatch)
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Wrong password',
      });

    const hashedPassword = await hashAnElement(password);

    await this.userService.updateUserInfo(
      { id: userId },
      { password: hashedPassword, updated_at: new Date() },
    );
  }

  async forgotPassword(emailDto: CreateEmailDto) {
    // 1- check if a user with that mail exists.
    // 2- If it doesn't exist throw an error
    // 3- if yes then generate a jwt token
    // 4- encrypt that token
    // 5- Add that token inside the link that will be send as an email to the user
    // 6- Hash the token
    // 7- Add that hashed token to the reset tokens table
    const { email } = emailDto;

    const foundUser = await this.userService.findByEmail(email);

    const token = this.jwtService.generateAccessToken({ uid: foundUser.id });

    const encryptedToken = this.encryptionService.encrypt(token);

    const hashedToken = hashTokenForLookup(encryptedToken);

    await this.resetTokensService.createResetToken(hashedToken);

    const domainUrl = this.configService.get('smtp.frontendUrl') as string;

    const resetLink = `${domainUrl}/reset-password?token=${encryptedToken}`;

    await this.mailService.sendEmail(email, resetLink);
  }

  async resetPassword(resetDto: ResetPasswordDto) {
    // In order to reset password, the following must be done:
    // 1- Extract the encrypted reset token from the reset dto.
    // 2- hash the encrypted reset token and verify if it exists or not
    // 3- If it does not exist, send a bad request error to the user so that they can try again.
    // 4- If it exists, then decrypt the token and try to extract user info.
    // 5- If the jwt token is expired then the user should try to reset again and it should delete that token from the table
    // 6- if the token is still valid, then update the user password and then delete the token afterwards from the records.
    let resetTokenId = '';
    try {
      const { password, resetToken: encryptedToken } = resetDto;

      const encryptedHashedToken = hashTokenForLookup(encryptedToken);

      const tokenInfo =
        await this.resetTokensService.findToken(encryptedHashedToken);

      resetTokenId = tokenInfo.id;

      const decryptedToken = this.encryptionService.decrypt(encryptedToken);

      const jwtPayload = await this.jwtService.extractTokenInfo(
        'jwt.jwtAccessTokenSecret',
        decryptedToken,
      );

      const hashedPassword = await hashAnElement(password);

      await this.userService.updateUserInfo(
        { id: jwtPayload.uid },
        { password: hashedPassword, updated_at: new Date() },
      );

      await this.resetTokensService.deleteTokenById(tokenInfo.id);
    } catch (error) {
      // if the token was expired, delete the token from the table anyways
      // else rethrow
      if (
        error instanceof UnauthorizedException &&
        // @ts-expect-error expired jwt tokens always throw error with code property
        error?.code === JWT_TOKEN_ERROR_STATUS.TOKEN_EXPIRED
      ) {
        await this.resetTokensService.deleteTokenById(resetTokenId);
      }
      throw error;
    }
  }

  async getUserSignInMethod(refreshToken?: string): Promise<SIGN_IN_METHOD> {
    // Check first if the refresh token was send from the browser.
    // If no than throw an unauthorize error.
    // If yes, extract the session id from the refresh token, and used to get the session info
    // and then send only the sign in method to the frontend for consumption
    if (!refreshToken) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Refresh token not found',
        code: JWT_TOKEN_ERROR_STATUS.TOKEN_MISSING,
      });
    }
    const { sid } = await this.jwtService.extractTokenInfo(
      'jwt.jwtRefreshTokenSecret',
      refreshToken,
    );

    const sessionInfo = await this.sessionService.getSessionById(sid);

    return sessionInfo.sign_in_method;
  }
}
