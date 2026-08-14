import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import type { Create2FaCodeDto } from './pipes/validate-code/validate-2fa-code';
import { TWO_FA_ERROR_STATUS } from 'src/common/types';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class TwoFaService {
  constructor(
    private userService: UsersService,
    private authService: AuthService,
  ) {}

  private generateOtpSecret(email: string) {
    const secret = authenticator.generateSecret();
    const otpUrl = authenticator.keyuri(email, 'Nest Auth', secret);
    return { secret, otpUrl };
  }

  private async generateQrCodeDataUrl(otpUrl: string) {
    return toDataURL(otpUrl);
  }

  private verifyCode(token: string, secret: string) {
    return authenticator.verify({ token, secret });
  }

  async register(userId: string) {
    // The first steps to make 2Fa are:
    // 1- Generate a secret that will be shared with the authenticator app
    // 2- Add that secret to the user row so that it can later be used for verifying codes on sign in
    // 3- use the secret to generate an otp url that will be send to the authenticator app to extract the secret from it
    // 4- Generate the qr code that will be displayed to the user on the screen
    const { email } = await this.userService.findById(userId);

    const { secret, otpUrl } = this.generateOtpSecret(email);

    await this.userService.setTowFactorSecret(email, secret);

    const qrCode = await this.generateQrCodeDataUrl(otpUrl);

    return qrCode;
  }

  async enableTwoFactorAuth(enableCodeDto: Create2FaCodeDto, userId: string) {
    const { code } = enableCodeDto;
    // extract user info to get the secret
    const user = await this.userService.findById(userId);
    // check if the code send is valid or not
    const isCodeValid = this.verifyCode(code, user.two_factor_secret);
    // if it is not valid, then send an unauthorized error, so that user may try to resend another code.
    if (!isCodeValid) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid authentication code',
        code: TWO_FA_ERROR_STATUS.INVALID,
      });
    }
    //If it is valid, then update the user's row and enable the 2FA for them
    await this.userService.enableTwoFactorAuth(userId);
    // generate the access and refresh token and send them to the user so they're signed in immediately
    const { accessToken, refreshToken } = await this.authService.singIn(user);

    return { accessToken, refreshToken };
  }

  async verifyTwoFactorAuth(enableCodeDto: Create2FaCodeDto, userId: string) {
    const { code } = enableCodeDto;
    // extract user info to get the secret
    const user = await this.userService.findById(userId);
    // check if the code send is valid or not
    const isCodeValid = this.verifyCode(code, user.two_factor_secret);
    // if it is not valid, then send an unauthorized error, so that user may try to resend another code.
    if (!isCodeValid) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid authentication code',
        code: TWO_FA_ERROR_STATUS.INVALID,
      });
    }
    // if it is valid, then generate the access and refresh token and send them to the user
    const { accessToken, refreshToken } = await this.authService.singIn(user);

    return { accessToken, refreshToken };
  }
}
