import { Module } from '@nestjs/common';
import { CustomJwtService } from './custom-jwt.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  providers: [CustomJwtService],
  imports: [JwtModule.register({})],
  exports: [CustomJwtService],
})
export class CustomJwtModule {}
