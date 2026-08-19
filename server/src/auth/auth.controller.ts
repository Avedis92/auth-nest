import {
  Controller,
  Post,
  UsePipes,
  Body,
  Res,
  UnauthorizedException,
  Put,
  UseGuards,
  Req,
  Get,
  Query,
} from '@nestjs/common';
import { ValidateUsersPipe } from 'src/users/pipes/validate-users/validate-users.pipe';
import { createUserSchema } from 'src/users/pipes/validate-users/create-user-schema';
import type { CreateUserDto } from 'src/users/pipes/validate-users/create-user-schema';
import { AuthService } from './auth.service';
import type { Response } from 'express';
import { Cookie } from 'src/common/reusable_decorator/cookies';
import { REFRESH_TOKEN_MAX_AGE_MS } from 'src/common/constant';
import type {
  CreatePasswordDto,
  ResetPasswordDto,
} from './pipes/validate-password/create-password-schema';
import {
  createPasswordSchema,
  resetPasswordSchema,
} from './pipes/validate-password/create-password-schema';
import type { ValidUserRequestType } from 'src/common/types';
import { JWTAuthGuard } from 'src/guards/auth.guard';
import { SessionRevocationGuard } from 'src/guards/session-revocation.guard';
import { ValidatePasswordPipe } from './pipes/validate-password/validate-password.pipe';
import { ValidateEmailPipe } from './pipes/validate-email/validate-email.pipe';
import type { CreateEmailDto } from './pipes/validate-email/create-email-schema';
import { createEmailSchema } from './pipes/validate-email/create-email-schema';
import { GoogleService } from 'src/oAuth/google/google.service';
import { ConfigService } from '@nestjs/config';

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private googleService: GoogleService,
    private configService: ConfigService,
  ) {}

  @Post('signup')
  @UsePipes(new ValidateUsersPipe(createUserSchema))
  async signUp(@Body() userDto: CreateUserDto) {
    // To signup a user, the following must be done:
    // 1- Add user's email and hashed password and their choice of use 2FA to the users table
    // 2- If the insertion is successful, then generate an access token, snd then generate a refresh token
    // 3- Hash the new refresh token.
    // 4- Generate new session using the new refresh token, use the new user's id for the user_id column (status by default active)
    // 5- return the access token and the refresh token after successfully creating the user's session.
    // 6- If the user insertion was not successful, send the user an error message without any token.
    await this.authService.signUp(userDto);
    return {
      message: 'User successfully signed up',
      success: true,
    };
  }

  @Post('signin')
  @UsePipes(new ValidateUsersPipe(createUserSchema))
  async signIn(
    @Body() userDto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // To make the sign in process the following must be done:
    // 1- When the user sends the email and password, first verify if the sent content is a valid data.
    // 2- If the email is found in the users table, but the password was wrong, then the user should receive an unauthorized error.
    // 3- If the email was not found from the beginning, then user should receive an email not found error message.
    // 4- If it is a valid data, then verify if the user with that email and password exists or not.
    // 5- If the email or the password or both are not compatible with any of the data inside the user's table, then throw an unauthorized exception
    // 6- If it is valid user, then generate an access token and a refresh token and send it to the user to access to protected resources.
    // 7- Hash the new refresh token.
    // 8- Generate new session using the new refresh token, use the new user's id for the user_id column (status by default active)
    // 9- return the access token and the refresh token after successfully creating the user's session.
    // 10- When sending the tokens also send info if user is registered for 2FA and if their 2FA is already enabled or not.
    // 11- If the user is registered for 2FA but their 2FA is still not enabled, the frontend should send register request,
    // so that the user register the app with the authenticator app.
    const user = await this.authService.validateUserCredentials(userDto);
    if (user.is_user_registered_for_two_factor) {
      return this.authService.generateTwoFAResponse(user);
    }
    const { accessToken, refreshToken } = await this.authService.singIn(user);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: REFRESH_TOKEN_MAX_AGE_MS, // valid for 1 day
    });
    return {
      message: 'User successfully signed in',
      success: true,
      token: accessToken,
    };
  }

  @Post('signout')
  async signOut(
    @Res({ passthrough: true }) res: Response,
    @Cookie('refreshToken') refreshToken?: string,
  ) {
    // To make the sign out process, the following must be done:
    // 1- Extract the session id from the refresh token
    // 2- Update that session in the session table so that the status is logged out and the expiry date is updated to now.
    // 3- If the update was successful, then send a success log out message
    // 4- If it is not successful, then the user will not sign out
    await this.authService.signOut(refreshToken);
    res.clearCookie('refreshToken', { httpOnly: true });
    return { message: 'User successfully signed out', success: true };
  }
  @Post('refresh')
  async refresh(
    @Res({ passthrough: true }) res: Response,
    @Cookie('refreshToken') refresh_Token?: string,
  ) {
    // This endpoint is to generate new access and refresh tokens when user's access token is expired.
    // The following steps needs to be taken into consideration:
    // 1- Check if the refresh exists.
    // 2- If the refresh token doesn't exist, meaning the token is expired, so the user should sign in again.
    // 3- If the refresh token exists, then we need to check the following:
    //   3.1- Extract the session info:
    //     3.1.1- If the session is not expired yet and refresh token is the same as in the sessions table, then for the same session, generate new access token and refresh token, and updated session's refresh token expiration date columns.
    //     3.1.2- If the refresh token is invalid(manipulated), then throw an error and return an invalid token message to user
    //     3.1.2- if the session is valid but the refresh token is different than the one inside the table, logout the user and send a 401 to make them sign in again to protect their resources.
    try {
      const { accessToken, refreshToken } =
        await this.authService.refresh(refresh_Token);
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        maxAge: REFRESH_TOKEN_MAX_AGE_MS, // valid for 1 day
      });
      return {
        message: 'User successfully signed in',
        success: true,
        token: accessToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      return { message: 'Failed to refresh', success: false };
    }
  }

  @Put('change-password')
  @UseGuards(JWTAuthGuard, SessionRevocationGuard)
  @UsePipes(new ValidatePasswordPipe(createPasswordSchema))
  async changePassword(
    @Body() passwordDto: CreatePasswordDto,
    @Req() req: ValidUserRequestType,
  ) {
    await this.authService.changePassword(req.userId, passwordDto);
    return { message: 'Password successfully modified', success: true };
  }

  @Post('forgot-password')
  @UsePipes(new ValidateEmailPipe(createEmailSchema))
  async forgotPassword(@Body() emailDto: CreateEmailDto) {
    await this.authService.forgotPassword(emailDto);
    return {
      message: 'You will receive an email shortly to reset your password',
      success: true,
    };
  }

  @Put('reset-password')
  @UsePipes(new ValidatePasswordPipe(resetPasswordSchema))
  async resetPassword(@Body() resetDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetDto);
    return {
      message: 'Password successfully reset',
      success: true,
    };
  }

  @Get('google')
  startSigningInWithGoogle(@Res() res: Response) {
    const googleAuthZUrl = this.googleService.buildAuthorizationUrl();
    res.redirect(googleAuthZUrl);
  }

  @Get('google/callback')
  async handleGoogleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const frontendUrl = this.configService.get<string>('smtp.frontendUrl');
    try {
      const { refreshToken } = await this.googleService.handleGoogleCallback(
        code,
        state,
        error,
      );
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        maxAge: REFRESH_TOKEN_MAX_AGE_MS, // valid for 1 day
      });
      res.redirect(`${frontendUrl}/oauth/callback`);
    } catch {
      res.redirect(`${frontendUrl}/?oauthError=1`);
    }
  }

  @Get('sign-in-method')
  @UseGuards(JWTAuthGuard, SessionRevocationGuard)
  async getUserSignInMethod(
    @Req() req: ValidUserRequestType,
    @Cookie('refreshToken') refresh_Token?: string,
  ) {
    // After finishing signing in, the user should know what sign in method they used (email and password or oAuth).
    // The reason behind it is that on the navbar, the user's menu options should display the "change password" option
    // only when the user signed in using their email and password.
    // The user's role is also returned here so the frontend can gate the admin
    // nav item/route, since it's not otherwise derivable client-side.
    const signInMethod =
      await this.authService.getUserSignInMethod(refresh_Token);
    return { signInMethod, role: req.userRole };
  }
}
