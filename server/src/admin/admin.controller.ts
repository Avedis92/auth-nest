import {
  Controller,
  Get,
  Patch,
  UseGuards,
  UsePipes,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { JWTAuthGuard } from 'src/guards/auth.guard';
import { SessionRevocationGuard } from 'src/guards/session-revocation.guard';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/common/reusable_decorator/roles';
import { USERROLE } from 'src/common/types';
import type { ValidUserRequestType } from 'src/common/types';
import { ValidateUsersPipe } from 'src/users/pipes/validate-users/validate-users.pipe';
import { listUsersQuerySchema } from './pipes/list-users-query.schema';
import type { ListUsersQueryDto } from './pipes/list-users-query.schema';
import { AdminService } from './admin.service';

@Controller('api/v1/admin')
@UseGuards(JWTAuthGuard, SessionRevocationGuard, RolesGuard)
@Roles([USERROLE.ADMIN, USERROLE.SUPER_ADMIN])
export class AdminController {
  constructor(private adminsService: AdminService) {}

  @Get('users')
  @UsePipes(new ValidateUsersPipe(listUsersQuerySchema))
  async listUsers(
    @Query() query: ListUsersQueryDto,
    @Req() req: ValidUserRequestType,
  ) {
    return this.adminsService.listUsers(query, req.userRole);
  }

  @Patch('disable/:id')
  async disableUser(@Param('id') id: string) {
    await this.adminsService.disableUser(id);
    return { message: 'User successfully disabled', success: true };
  }

  @Patch('enable/:id')
  async enableUser(@Param('id') id: string) {
    await this.adminsService.enableUser(id);
    return { message: 'User successfully enabled', success: true };
  }

  // Admins AND super admins may promote a regular user to admin.
  // No method-level @Roles override needed: the class-level
  // @Roles([USERROLE.ADMIN, USERROLE.SUPER_ADMIN]) already allows both.
  @Patch('promote/:id')
  async promoteToAdmin(@Param('id') id: string) {
    await this.adminsService.promoteToAdmin(id);
    return { message: 'User successfully promoted to admin', success: true };
  }

  // Only super admins may demote an admin back to a regular user.
  // Method-level @Roles overrides the class-level one (RolesGuard uses
  // reflector.getAllAndOverride, so handler metadata wins over class).
  @Patch('demote/:id')
  @Roles([USERROLE.SUPER_ADMIN])
  async demoteToUser(@Param('id') id: string) {
    await this.adminsService.demoteToUser(id);
    return {
      message: 'User successfully demoted to regular user',
      success: true,
    };
  }
}
