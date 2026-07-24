import { Controller, Get, UseGuards } from '@nestjs/common';
import { JWTAuthGuard } from 'src/auth/guards/auth/auth.guard';

@Controller('api/v1/protected')
export class ProtectedController {
  @Get()
  @UseGuards(JWTAuthGuard)
  getProtectedResources() {
    return { text: 'This is only a placeholder text for protected resources' };
  }
}
