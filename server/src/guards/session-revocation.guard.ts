import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  HttpStatus,
} from '@nestjs/common';
import { JWT_TOKEN_ERROR_STATUS, ValidUserRequestType } from 'src/common/types';
import { SessionService } from 'src/session/session.service';

@Injectable()
export class SessionRevocationGuard implements CanActivate {
  constructor(private sessionService: SessionService) {}

  canActivate(context: ExecutionContext): boolean {
    const request: ValidUserRequestType = context.switchToHttp().getRequest();

    if (this.sessionService.isRevoked(request.userId)) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message:
          'All sessions for this user have been revoked. Please sign in again.',
        code: JWT_TOKEN_ERROR_STATUS.SESSION_REVOKED,
      });
    }

    return true;
  }
}
