import {
  Injectable,
  ConflictException,
  ForbiddenException,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { SessionService } from 'src/session/session.service';
import { DatabaseService } from 'src/database/database.service';
import {
  ADMIN_ACTION_ERROR_STATUS,
  ROLE_TRANSITION_ERROR_STATUS,
  USERROLE,
} from 'src/common/types';
import type { ListUsersQueryDto } from './pipes/list-users-query.schema';
import type { AdminUserListItem, AdminUserListResponse } from './admin.types';

@Injectable()
export class AdminService {
  constructor(
    private userService: UsersService,
    private sessionService: SessionService,
    private databaseService: DatabaseService,
  ) {}

  async disableUser(
    userId: string,
    requesterId: string,
    requesterRole: USERROLE,
  ) {
    if (userId === requesterId) {
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'You cannot disable your own account',
        code: ADMIN_ACTION_ERROR_STATUS.SELF_ACTION_FORBIDDEN,
      });
    }
    this.assertTargetRoleAllowed(
      await this.userService.findById(userId),
      requesterRole,
      'disable',
    );

    return this.databaseService.runInTransaction(async (client) => {
      const user = await this.userService.disableUser(userId, client);
      await this.sessionService.revokeAllSessionsForUser(userId, client);
      return user;
    });
  }

  async enableUser(userId: string, requesterRole: USERROLE) {
    this.assertTargetRoleAllowed(
      await this.userService.findById(userId),
      requesterRole,
      'enable',
    );
    return this.userService.enableUser(userId);
  }

  // Shared by disable/enable: a super_admin target can never be toggled from
  // this panel, and an admin target requires a super_admin caller.
  private assertTargetRoleAllowed(
    target: { role: USERROLE },
    requesterRole: USERROLE,
    action: 'disable' | 'enable',
  ) {
    if (target.role === USERROLE.SUPER_ADMIN) {
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        message: `Super admin accounts cannot be ${action}d from this panel`,
        code: ADMIN_ACTION_ERROR_STATUS.TARGET_ROLE_FORBIDDEN,
      });
    }
    if (
      target.role === USERROLE.ADMIN &&
      requesterRole !== USERROLE.SUPER_ADMIN
    ) {
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        message: `Only a super admin can ${action} an admin account`,
        code: ADMIN_ACTION_ERROR_STATUS.TARGET_ROLE_FORBIDDEN,
      });
    }
  }

  async promoteToAdmin(userId: string) {
    return this.databaseService.runInTransaction(async (client) => {
      // Lock the row first: blocks until any in-flight promote/demote on
      // this same user commits/rolls back, then reads the committed role.
      const user = await this.userService.findByIdForUpdate(userId, client);

      if (user.role !== USERROLE.USER) {
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          message: `The user with id ${userId} is no longer a regular user and cannot be promoted.`,
          code: ROLE_TRANSITION_ERROR_STATUS.UNEXPECTED_ROLE,
        });
      }

      const updatedUser = await this.userService.changeUserRole(
        userId,
        USERROLE.ADMIN,
        client,
      );
      return updatedUser;
    });
  }

  async demoteToUser(userId: string, requesterId: string) {
    if (userId === requesterId) {
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'You cannot demote your own account',
        code: ADMIN_ACTION_ERROR_STATUS.SELF_ACTION_FORBIDDEN,
      });
    }
    return this.databaseService.runInTransaction(async (client) => {
      // Same locking strategy as promoteToAdmin — see comment there.
      const user = await this.userService.findByIdForUpdate(userId, client);

      if (user.role !== USERROLE.ADMIN) {
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          message: `The user with id ${userId} is not currently an admin and cannot be demoted.`,
          code: ROLE_TRANSITION_ERROR_STATUS.UNEXPECTED_ROLE,
        });
      }

      const updatedUser = await this.userService.changeUserRole(
        userId,
        USERROLE.USER,
        client,
      );
      // Demoting an admin force-logs them out, mirroring disableUser.
      await this.sessionService.revokeAllSessionsForUser(userId, client);
      return updatedUser;
    });
  }

  async listUsers(
    query: ListUsersQueryDto,
    requesterRole: USERROLE,
    requesterId: string,
  ): Promise<AdminUserListResponse> {
    const { limit, offset, search } = query;
    const excludeSuperAdmin = requesterRole !== USERROLE.SUPER_ADMIN;

    const { users, total } = await this.userService.findAllPaginated({
      limit,
      offset,
      search,
      excludeSuperAdmin,
      excludeUserId: requesterId, // never show the viewer their own row
    });

    const sessionInfoByUserId = this.sessionService.getBatchUsersInfo(
      users.map((user) => user.id),
    );

    const data: AdminUserListItem[] = users.map((user) => {
      const sessionInfo = sessionInfoByUserId.get(user.id);
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.disabled ? 'disabled' : 'enabled',
        signUpDate: user.created_at,
        lastSignInDate: sessionInfo?.signInDate ?? null,
        lastSignOutDate: sessionInfo?.signOutDate ?? null,
        activeSessionsCount: sessionInfo?.sessionsCount ?? 0,
      };
    });

    return {
      data,
      pagination: {
        total,
        limit,
        offset,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
