import { useState, type MouseEvent } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem } from '@mui/material';

interface NavbarProps {
  onSignOut: () => void;
  onOpenChangePassword: () => void;
}

export const Navbar = ({ onSignOut, onOpenChangePassword }: NavbarProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const menuOpen = Boolean(anchorEl);

  const openMenu = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  const handleSignOut = () => {
    closeMenu();
    onSignOut();
  };

  const handleOpenChangePassword = () => {
    closeMenu();
    onOpenChangePassword();
  };

  return (
    <AppBar position="static">
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div">
          Auth Nest
        </Typography>
        <IconButton
          onClick={openMenu}
          size="small"
          aria-label="account menu"
          aria-controls={menuOpen ? 'account-menu' : undefined}
          aria-haspopup="true"
        >
          <Avatar sx={{ width: 32, height: 32 }} />
        </IconButton>
        <Menu
          id="account-menu"
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={closeMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={handleSignOut}>Sign out</MenuItem>
          <MenuItem onClick={handleOpenChangePassword}>Change password</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};
