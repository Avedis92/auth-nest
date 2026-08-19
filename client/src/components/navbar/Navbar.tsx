import { useState, type MouseEvent } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Button,
  Stack,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { SIGN_IN_METHOD, USER_ROLE, type SignInMethod, type UserRole } from '../../types/auth';

interface NavbarProps {
  onSignOut: () => void;
  onOpenChangePassword: () => void;
  signInMethod: SignInMethod | null;
  role: UserRole | null;
}

export const Navbar = ({ onSignOut, onOpenChangePassword, signInMethod, role }: NavbarProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const menuOpen = Boolean(anchorEl);
  const isAdmin = role === USER_ROLE.ADMIN || role === USER_ROLE.SUPER_ADMIN;

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
        <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
          <Typography variant="h6" component="div">
            Auth Nest
          </Typography>
          {isAdmin && (
            <Button component={Link} to="/admin" color="inherit">
              Admin
            </Button>
          )}
        </Stack>
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
          {signInMethod === SIGN_IN_METHOD.EMAIL_AND_PASSWORD && (
            <MenuItem onClick={handleOpenChangePassword}>Change password</MenuItem>
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};
