import { Outlet } from 'react-router-dom';
import { Box, Dialog } from '@mui/material';
import { Navbar } from '../navbar/Navbar';
import { ChangePasswordForm } from '../dashboard/ChangePasswordForm';
import type { SignInMethod, UserRole } from '../../types/auth';

interface AuthenticatedLayoutProps {
  onSignOut: () => void;
  onOpenChangePassword: () => void;
  signInMethod: SignInMethod | null;
  role: UserRole | null;
  accessToken: string | null;
  showChangePasswordForm: boolean;
  onCloseChangePassword: () => void;
  onTokenRefreshed: (token: string) => void;
  onChangePasswordSuccess: () => void;
  onChangePasswordError: () => void;
}

export const AuthenticatedLayout = ({
  onSignOut,
  onOpenChangePassword,
  signInMethod,
  role,
  accessToken,
  showChangePasswordForm,
  onCloseChangePassword,
  onTokenRefreshed,
  onChangePasswordSuccess,
  onChangePasswordError,
}: AuthenticatedLayoutProps) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar
        onSignOut={onSignOut}
        onOpenChangePassword={onOpenChangePassword}
        signInMethod={signInMethod}
        role={role}
      />
      <Outlet />
      <Dialog open={showChangePasswordForm} onClose={onCloseChangePassword}>
        <ChangePasswordForm
          accessToken={accessToken}
          onClose={onCloseChangePassword}
          onTokenRefreshed={onTokenRefreshed}
          onSuccess={onChangePasswordSuccess}
          onError={onChangePasswordError}
        />
      </Dialog>
    </Box>
  );
};
