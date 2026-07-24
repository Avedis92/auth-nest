import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';

export const Cookie = createParamDecorator(
  (key: string, ctx: ExecutionContext): unknown => {
    const request: Request = ctx.switchToHttp().getRequest();
    const cookies = request.cookies;
    return key ? cookies?.[key] : cookies;
  },
);
