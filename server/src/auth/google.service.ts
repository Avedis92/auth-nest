import {
  Injectable,
  BadRequestException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PkceService } from './pkce.service';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
} from './utils/pkce.utils';
import axios from 'axios';
import * as crypto from 'crypto';
import {
  GoogleTokenApiResults,
  GoogleAuthProfile,
  CreateUserType,
  JWTPayloadType,
  SIGN_IN_METHOD,
} from 'src/common/types';
import { GoogleRepository } from './google.repository';
import { UsersService } from 'src/users/users.service';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';

@Injectable()
export class GoogleService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  constructor(
    private configService: ConfigService,
    private pkceService: PkceService,
    private googleRepository: GoogleRepository,
    private userService: UsersService,
    private authService: AuthService,
    private authRepository: AuthRepository,
  ) {
    this.clientId = this.configService.get('google.googleClientId') as string;
    this.redirectUri = this.configService.get(
      'google.googleRedirectUri',
    ) as string;
    this.clientSecret = this.configService.get(
      'google.googleClientSecret',
    ) as string;
  }

  buildAuthorizationUrl() {
    const googleAuthZBaseUrl = this.configService.get(
      'google.googleAuthorizationEndpoint',
    ) as string;

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateState();

    // save the state into the store
    this.pkceService.save(state, codeVerifier);
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
      access_type: 'offline', // needed to get a refresh_token
      prompt: 'consent',
    });

    return `${googleAuthZBaseUrl}?${params.toString()}`;
  }

  private async exchangeCodeWithTokens(code: string, codeVerifier: string) {
    const googleTokenUrl = this.configService.get(
      'google.googleTokenEndpoint',
    ) as string;

    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: this.redirectUri,
    });

    const { data }: { data: GoogleTokenApiResults } = await axios.post(
      googleTokenUrl,
      body.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    );
    return data;
  }

  private async retrieveGoogleProfile(accessToken: string) {
    const googleUserInfoBaseUrl = this.configService.get(
      'google.googleUserInfoEndpoint',
    ) as string;

    const { data: profile } = await axios.get<GoogleAuthProfile>(
      googleUserInfoBaseUrl,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const identity = await this.googleRepository.findGoogleIdentityByProviderId(
      profile.sub,
    );

    // If user already have logged in, then
    if (identity) {
      return this.userService.findById(identity.user_id);
    }

    // 2. No identity yet — does a user with this email already exist
    //    (e.g. they originally signed up with password)?
    let user: Pick<CreateUserType, 'id' | 'email'>;
    try {
      user = await this.userService.findByEmail(profile.email);
    } catch (err) {
      if (!(err instanceof NotFoundException)) {
        throw err;
      }
      // 3. Brand new user
      user = await this.userService.create({
        email: profile.email,
        password: null,
      });
    }

    // Either way, link this Google identity to the user
    await this.googleRepository.createGoogleIdentity({
      user_id: user.id,
      provider: 'google',
      provider_id: profile.sub,
    });

    return user;
  }

  async handleGoogleCallback(code: string, state: string, error: string) {
    if (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: error,
      });
    }

    if (!code || !state) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Missing code or state',
      });
    }

    const codeVerifier = this.pkceService.consume(state);
    if (!codeVerifier) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid or expired state/PKCE session',
      });
    }
    const { access_token } = await this.exchangeCodeWithTokens(
      code,
      codeVerifier,
    );
    const user = await this.retrieveGoogleProfile(access_token);

    const session_id = crypto.randomUUID();
    const payload: JWTPayloadType = { sid: session_id, uid: user.id };
    const { accessToken, refreshToken } =
      this.authService.generateBothAccessAndRefreshToken(payload);
    await this.authRepository.createSession(
      session_id,
      refreshToken,
      user.id,
      SIGN_IN_METHOD.OAUTH,
    );

    return { accessToken, refreshToken };
  }
}
