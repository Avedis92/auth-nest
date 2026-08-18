import {
  Injectable,
  BadRequestException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
} from 'src/utils/pkce.utils';
import axios from 'axios';
import {
  GoogleTokenApiResults,
  GoogleAuthProfile,
  CreateUserType,
  SIGN_IN_METHOD,
  USERS_ERROR_STATUS,
} from 'src/common/types';
import { UsersService } from 'src/users/users.service';
import { PkceService } from './pkce.service';
import { CustomJwtService } from 'src/custom-jwt/custom-jwt.service';
import { IdentitiesService } from 'src/identities/identities.service';
import { SessionService } from 'src/session/session.service';

@Injectable()
export class GoogleService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  constructor(
    private configService: ConfigService,
    private userService: UsersService,
    private jwtService: CustomJwtService,
    private identitiesService: IdentitiesService,
    private sessionService: SessionService,
    private pkceService: PkceService,
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

  private hasVerifiedEmail(profile: GoogleAuthProfile) {
    return String(profile.email_verified) === 'true';
  }

  private async retrieveGoogleProfile(accessToken: string) {
    const googleUserInfoBaseUrl = this.configService.get(
      'google.googleUserInfoEndpoint',
    ) as string;

    const { data: profile } = await axios.get<GoogleAuthProfile>(
      googleUserInfoBaseUrl,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const identity =
      await this.identitiesService.findIdentityByProviderAndProviderId(
        profile.sub,
        'google',
      );

    // If user already have logged in, then
    if (identity) {
      return this.userService.findById(identity.user_id);
    }

    // 2. No identity yet — does a user with this email already exist
    //    (e.g. they originally signed up with password)?
    let existingUser: Pick<CreateUserType, 'id' | 'email'> | undefined;
    try {
      existingUser = await this.userService.findByEmail(profile.email);
    } catch (err) {
      if (!(err instanceof NotFoundException)) {
        throw err;
      }
    }

    let user: Pick<CreateUserType, 'id' | 'email'>;
    if (existingUser) {
      // Refuse to link a Google identity to an existing account unless Google
      // has actually verified this email — otherwise an attacker who controls
      // an unverified mailbox could hijack someone else's account by signing
      // in with the victim's email address.
      if (!this.hasVerifiedEmail(profile)) {
        throw new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          message:
            "This Google account's email is not verified, so it can't be linked to an existing account. Verify the email with Google, or sign in with your password instead.",
        });
      }
      user = existingUser;
    } else {
      // 3. Brand new user
      user = await this.userService.create({
        email: profile.email,
        password: null,
      });
    }

    // Either way, link this Google identity to the user
    await this.identitiesService.createIdentity({
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

    const fullUser = await this.userService.findById(user.id);
    if (fullUser.disable) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'This account has been disabled. Contact an administrator.',
        code: USERS_ERROR_STATUS.DISABLED,
      });
    }

    const { accessToken, refreshToken } =
      await this.sessionService.issueTokenAndSession(
        user.id,
        SIGN_IN_METHOD.OAUTH,
      );

    return { accessToken, refreshToken };
  }
}
