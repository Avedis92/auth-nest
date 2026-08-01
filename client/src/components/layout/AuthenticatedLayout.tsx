import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import { Navbar } from '../navbar/Navbar';
import type { SignInMethod } from '../../types/auth';

interface AuthenticatedLayoutProps {
  onSignOut: () => void;
  onOpenChangePassword: () => void;
  signInMethod: SignInMethod | null;
}

export const AuthenticatedLayout = ({
  onSignOut,
  onOpenChangePassword,
  signInMethod,
}: AuthenticatedLayoutProps) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar
        onSignOut={onSignOut}
        onOpenChangePassword={onOpenChangePassword}
        signInMethod={signInMethod}
      />
      <Outlet />
    </Box>
  );
};
