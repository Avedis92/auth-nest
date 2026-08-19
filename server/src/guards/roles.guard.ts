import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { USERROLE, ValidUserRequestType } from 'src/common/types';
import { ROLES_KEY } from 'src/common/reusable_decorator/roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<USERROLE[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles?.length) return true;

    const request: ValidUserRequestType = context.switchToHttp().getRequest();
    if (!requiredRoles.includes(request.userRole)) {
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'You do not have permission to perform this action',
      });
    }
    return true;
  }
}
