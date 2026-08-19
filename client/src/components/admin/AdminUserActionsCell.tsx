import { useState, type MouseEvent } from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import type { UserRole } from '../../types/auth';
import type { AdminUserListItem } from '../../types/admin';
import { getRowActionKeys, type AdminRowActionKey } from './adminRowPermissions';

const ACTION_LABELS: Record<AdminRowActionKey, string> = {
  promote: 'Promote to admin',
  demote: 'Demote to user',
  enable: 'Enable login',
  disable: 'Disable login',
};

interface AdminUserActionsCellProps {
  row: AdminUserListItem;
  viewerRole: UserRole;
  onAction: (action: AdminRowActionKey, id: string) => void;
}

export const AdminUserActionsCell = ({ row, viewerRole, onAction }: AdminUserActionsCellProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const actionKeys = getRowActionKeys(row, viewerRole);

  const openMenu = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  const handleSelect = (action: AdminRowActionKey) => {
    closeMenu();
    onAction(action, row.id);
  };

  if (actionKeys.length === 0) {
    return (
      <IconButton size="small" disabled aria-label="No actions available">
        <MoreVertIcon fontSize="small" />
      </IconButton>
    );
  }

  return (
    <>
      <IconButton size="small" onClick={openMenu} aria-label="Row actions" aria-haspopup="true">
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        {actionKeys.map((key) => (
          <MenuItem key={key} onClick={() => handleSelect(key)}>
            {ACTION_LABELS[key]}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
