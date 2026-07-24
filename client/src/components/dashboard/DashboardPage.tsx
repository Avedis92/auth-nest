import { Box, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ChangePasswordForm } from './ChangePasswordForm';

interface DashboardPageProps {
  accessToken: string | null;
  showChangePasswordForm: boolean;
  onCloseChangePassword: () => void;
  onTokenRefreshed: (token: string) => void;
  onChangePasswordSuccess: () => void;
  onChangePasswordError: () => void;
}

export const DashboardPage = ({
  accessToken,
  showChangePasswordForm,
  onCloseChangePassword,
  onTokenRefreshed,
  onChangePasswordSuccess,
  onChangePasswordError,
}: DashboardPageProps) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stack spacing={3} sx={{ alignItems: 'center' }}>
        {showChangePasswordForm && (
          <ChangePasswordForm
            accessToken={accessToken}
            onClose={onCloseChangePassword}
            onTokenRefreshed={onTokenRefreshed}
            onSuccess={onChangePasswordSuccess}
            onError={onChangePasswordError}
          />
        )}
        <Button variant="contained" size="large" onClick={() => navigate('/protected')}>
          Go to protected route
        </Button>
      </Stack>
    </Box>
  );
};
