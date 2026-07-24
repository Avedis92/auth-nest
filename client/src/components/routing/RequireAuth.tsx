import { Navigate, Outlet } from 'react-router-dom';

interface RequireAuthProps {
  isAuthenticated: boolean;
}

export const RequireAuth = ({ isAuthenticated }: RequireAuthProps) => {
  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};
