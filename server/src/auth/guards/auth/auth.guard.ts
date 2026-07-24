import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  JWT_TOKEN_ERROR_STATUS,
  JWTPayloadType,
  ValidUserRequestType,
} from 'src/common/types';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JWTAuthGuard implements CanActivate {
  constructor(
    private config: ConfigService,
    private jwtService: JwtService,
    private userService: UsersService,
  ) {}
  private extractTokenFromHeader(request: Request) {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // In this guard we need to check the following:
    // 1- Extract the request from the context
    // 2- Extract the token from the request headers
    // 3- If the token was not send, then the user has no authorization to proceed with the rest, so throw an UnAuthorized exception and later the frontend can login again
    // 4- If the token exist then we have couple of things to verify:
    //   4.1- If the token is an invalid token(manipulated), then throw a forbidden exception and later the frontend should logout.
    //   4.2- If the token is valid but expired, then first find the user related to that token, send a response to the frontend so that it can send another refresh token request,
    //   before it continues its operation on the protected api.
    //   4.3- If the token is still valid then proceed with the protected api operation
    const request: ValidUserRequestType = context.switchToHttp().getRequest();
    const accessToken = this.extractTokenFromHeader(request);
    if (!accessToken) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Access token not found',
        code: JWT_TOKEN_ERROR_STATUS.TOKEN_MISSING,
      });
    } else {
      try {
        const payload: JWTPayloadType = await this.jwtService.verifyAsync(
          accessToken,
          {
            secret: this.config.get('jwt.jwtAccessTokenSecret'),
          },
        );
        const foundUser = await this.userService.findById(payload.uid);
        if (!foundUser) {
          throw new UnauthorizedException({
            statusCode: HttpStatus.UNAUTHORIZED,
            message: 'User associated with this token no longer exists',
            code: JWT_TOKEN_ERROR_STATUS.TOKEN_INVALID,
          });
        }
        request.userId = payload.uid;
        return true;
      } catch (error) {
        // 1. Check if the error is specifically due to expiration
        if ((error as Error).name === 'TokenExpiredError') {
          throw new UnauthorizedException({
            statusCode: HttpStatus.UNAUTHORIZED,
            message: 'Access token has expired',
            code: JWT_TOKEN_ERROR_STATUS.TOKEN_EXPIRED,
          });
        }

        // 2. Handle tampered, malformed, or invalid signatures
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Token is invalid or tampered',
          code: JWT_TOKEN_ERROR_STATUS.TOKEN_INVALID,
        });
      }
    }
  }
}
