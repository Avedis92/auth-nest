import { Injectable, ConflictException, HttpStatus } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { SessionService } from 'src/session/session.service';
import { DatabaseService } from 'src/database/database.service';
import { ROLE_TRANSITION_ERROR_STATUS, USERROLE } from 'src/common/types';

@Injectable()
export class AdminService {
  constructor(
    private userService: UsersService,
    private sessionService: SessionService,
    private databaseService: DatabaseService,
  ) {}

  async disableUser(userId: string) {
    return this.databaseService.runInTransaction(async (client) => {
      const user = await this.userService.disableUser(userId, client);
      await this.sessionService.revokeAllSessionsForUser(userId, client);
      return user;
    });
  }

  async enableUser(userId: string) {
    return this.userService.enableUser(userId);
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

  async demoteToUser(userId: string) {
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
}
