import { Injectable, UnauthorizedException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JWT_TOKEN_ERROR_STATUS, JWTPayloadType } from 'src/common/types';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CustomJwtService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  generateAccessToken(payload: Partial<JWTPayloadType>, temporary = false) {
    const mainPayload = { ...payload, temporary };
    return this.jwtService.sign(mainPayload, {
      secret: this.configService.get('jwt.jwtAccessTokenSecret'),
      expiresIn: temporary
        ? this.configService.get('jwt.jwtTempAccessTokenExpire')
        : this.configService.get('jwt.jwtAccessTokenExpire'),
    });
  }

  generateRefreshToken(payload: Partial<JWTPayloadType>) {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.jwtRefreshTokenSecret'),
      expiresIn: this.configService.get('jwt.jwtRefreshTokenExpire'),
    });
  }
  generateBothAccessAndRefreshToken(payload: Partial<JWTPayloadType>) {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);
    return { accessToken, refreshToken };
  }

  async extractTokenInfo(secret: string, token?: string) {
    try {
      if (token) {
        const payload: JWTPayloadType = await this.jwtService.verifyAsync(
          token,
          {
            secret: this.configService.get(secret),
          },
        );
        return payload;
      }
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Token is missing',
        code: JWT_TOKEN_ERROR_STATUS.TOKEN_MISSING,
      });
    } catch (error) {
      if ((error as Error).name === 'JsonWebTokenError') {
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Token is invalid or tampered',
          code: JWT_TOKEN_ERROR_STATUS.TOKEN_INVALID,
        });
      } else if ((error as Error).name === 'TokenExpiredError') {
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Token expired',
          code: JWT_TOKEN_ERROR_STATUS.TOKEN_EXPIRED,
        });
      }
      throw error;
    }
  }
}
