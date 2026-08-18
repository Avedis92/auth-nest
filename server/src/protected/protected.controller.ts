import { Controller, Get, UseGuards } from '@nestjs/common';
import { JWTAuthGuard } from 'src/guards/auth.guard';
import { SessionRevocationGuard } from 'src/guards/session-revocation.guard';

@Controller('api/v1/protected')
export class ProtectedController {
  @Get()
  @UseGuards(JWTAuthGuard, SessionRevocationGuard)
  getProtectedResources() {
    return { text: 'This is only a placeholder text for protected resources' };
  }
}
