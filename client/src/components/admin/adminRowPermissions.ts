import { USER_ROLE, type UserRole } from '../../types/auth';
import type { AdminUserListItem } from '../../types/admin';

export type AdminRowActionKey = 'promote' | 'demote' | 'enable' | 'disable';

// Mirrors the server-side rules in admin.service.ts. No self-row handling is
// needed here — the signed-in viewer's own row is excluded server-side
// before it ever reaches the client.
export const getRowActionKeys = (
  target: AdminUserListItem,
  viewerRole: UserRole,
): AdminRowActionKey[] => {
  if (target.role === USER_ROLE.SUPER_ADMIN) return [];

  const actions: AdminRowActionKey[] = [];

  if (target.role === USER_ROLE.USER) {
    actions.push('promote');
  } else if (target.role === USER_ROLE.ADMIN && viewerRole === USER_ROLE.SUPER_ADMIN) {
    actions.push('demote');
  }

  const canToggleStatus =
    target.role === USER_ROLE.USER ||
    (target.role === USER_ROLE.ADMIN && viewerRole === USER_ROLE.SUPER_ADMIN);

  if (canToggleStatus) {
    actions.push(target.status === 'enabled' ? 'disable' : 'enable');
  }

  return actions;
};
