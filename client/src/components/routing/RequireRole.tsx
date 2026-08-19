import { Box, CircularProgress } from '@mui/material';
import { Navigate, Outlet } from 'react-router-dom';
import type { UserRole } from '../../types/auth';

interface RequireRoleProps {
  role: UserRole | null;
  allowedRoles: UserRole[];
}

// Nested inside RequireAuth, so a valid access token is already guaranteed.
// role is null immediately after mount until App's sign-in-method effect
// resolves — show a spinner instead of redirecting, to avoid a redirect
// flash for legitimate admins who deep-link to /admin.
export const RequireRole = ({ role, allowedRoles }: RequireRoleProps) => {
  if (role === null) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return allowedRoles.includes(role) ? <Outlet /> : <Navigate to="/dashboard" replace />;
};
