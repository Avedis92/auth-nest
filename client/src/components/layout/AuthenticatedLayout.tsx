import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import { Navbar } from '../navbar/Navbar';

interface AuthenticatedLayoutProps {
  onSignOut: () => void;
  onOpenChangePassword: () => void;
}

export const AuthenticatedLayout = ({ onSignOut, onOpenChangePassword }: AuthenticatedLayoutProps) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar onSignOut={onSignOut} onOpenChangePassword={onOpenChangePassword} />
      <Outlet />
    </Box>
  );
};
