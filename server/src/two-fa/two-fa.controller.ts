import {
  Controller,
  Post,
  Body,
  UsePipes,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { TwoFaService } from './two-fa.service';
import { ValidateCodePipe } from './pipes/validate-code/validate-code.pipe';
import type { Create2FaCodeDto } from './pipes/validate-code/validate-2fa-code';
import { create2FaCodeSchema } from './pipes/validate-code/validate-2fa-code';
import { JWTAuthGuard } from 'src/guards/auth.guard';
import type { ValidUserRequestType } from 'src/common/types';
import { REFRESH_TOKEN_MAX_AGE_MS } from 'src/common/constant';
import { AllowTemporaryToken } from 'src/common/reusable_decorator/allow-temporary-token';

@Controller('api/v1/two-fa')
@UseGuards(JWTAuthGuard)
@AllowTemporaryToken()
export class TwoFaController {
  constructor(private twoFaService: TwoFaService) {}

  @Post('register')
  async register(@Req() req: ValidUserRequestType) {
    const qrCode = await this.twoFaService.register(req.userId);
    return qrCode;
  }

  @Post('enable')
  @UsePipes(new ValidateCodePipe(create2FaCodeSchema))
  async enableTwoFactorAuth(
    @Body() enableCodeDto: Create2FaCodeDto,
    @Req() req: ValidUserRequestType,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } =
      await this.twoFaService.enableTwoFactorAuth(enableCodeDto, req.userId);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: REFRESH_TOKEN_MAX_AGE_MS, // valid for 1 day
    });
    return {
      message: 'Two-factor authentication successfully enabled',
      success: true,
      token: accessToken,
    };
  }
  @Post('verify')
  @UsePipes(new ValidateCodePipe(create2FaCodeSchema))
  async verifyTwoFactorAuth(
    @Body() enableCodeDto: Create2FaCodeDto,
    @Req() req: ValidUserRequestType,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } =
      await this.twoFaService.verifyTwoFactorAuth(enableCodeDto, req.userId);
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
}
