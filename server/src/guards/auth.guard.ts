import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { JWT_TOKEN_ERROR_STATUS, ValidUserRequestType } from 'src/common/types';
import { UsersService } from 'src/users/users.service';
import { CustomJwtService } from 'src/custom-jwt/custom-jwt.service';
import { ALLOW_TEMPORARY_TOKEN_KEY } from 'src/common/reusable_decorator/allow-temporary-token';

@Injectable()
export class JWTAuthGuard implements CanActivate {
  constructor(
    private jwtService: CustomJwtService,
    private userService: UsersService,
    private reflector: Reflector,
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
      const payload = await this.jwtService.extractTokenInfo(
        'jwt.jwtAccessTokenSecret',
        accessToken,
      );
      // we should reject any attempt of using temporary tokens(2FA for example)
      // And prevent malicious users from accessing private resources with these types of tokens,
      // unless the target route explicitly opted in via @AllowTemporaryToken()
      const allowsTemporaryToken = this.reflector.getAllAndOverride<boolean>(
        ALLOW_TEMPORARY_TOKEN_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (payload.temporary && !allowsTemporaryToken) {
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Temporary token is not allowed on this route',
          code: JWT_TOKEN_ERROR_STATUS.TEMPORARY_TOKEN_NOT_ALLOWED,
        });
      }
      const user = await this.userService.findById(payload.uid);
      request.userId = payload.uid;
      request.userRole = user.role;
      return true;
    }
  }
}
