import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { Snackbar, Alert, Button } from '@mui/material';
import { AuthPage } from './components/auth/AuthPage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';
import { OAuthCallbackPage } from './components/auth/OAuthCallbackPage';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { ProtectedPage } from './components/protected/ProtectedPage';
import { RequireAuth } from './components/routing/RequireAuth';
import { RequireRole } from './components/routing/RequireRole';
import { AuthenticatedLayout } from './components/layout/AuthenticatedLayout';
import { AdminPage } from './components/admin/AdminPage';
import { signOut, getSignInMethod } from './api/client';
import { callWithTokenRefresh } from './api/withTokenRefresh';
import { USER_ROLE, type SignInMethod, type UserRole } from './types/auth';

const ACCESS_TOKEN_STORAGE_KEY = 'accessToken';

type AlertState = { severity: 'success' | 'error'; message: string } | null;

const App = () => {
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY),
  );
  const [alert, setAlert] = useState<AlertState>(null);
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
  const [signInMethod, setSignInMethod] = useState<SignInMethod | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const closeAlert = () => setAlert(null);

  const handleSignUpSuccess = () =>
    setAlert({ severity: 'success', message: 'You have successfully signed up' });

  const handleSignUpError = () =>
    setAlert({ severity: 'error', message: 'Something went wrong when attempt to signing up' });

  const handleSignInSuccess = (token: string) => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
    setAccessToken(token);
    setAlert({ severity: 'success', message: 'You have successfully signed in' });
  };

  const handleSignInError = () =>
    setAlert({ severity: 'error', message: 'Failed to sign in. Please try again' });

  const handleTwoFaError = () =>
    setAlert({
      severity: 'error',
      message: 'Failed to complete two-factor authentication. Please try again',
    });

  const handleTwoFaSessionExpired = () =>
    setAlert({
      severity: 'error',
      message: 'Your two-factor authentication session has expired. Please sign in again',
    });

  const handleForgotPasswordSuccess = () =>
    setAlert({ severity: 'success', message: 'Success!Check out your email' });

  const handleForgotPasswordError = () =>
    setAlert({ severity: 'error', message: 'Failed to send reset email. Try again later' });

  const handleResetPasswordSuccess = () =>
    setAlert({ severity: 'success', message: 'Your password was successfully reset' });

  const handleResetPasswordError = () =>
    setAlert({ severity: 'error', message: 'Failed to reset password. Try again later' });

  const handleSignOut = async () => {
    try {
      await signOut();
      localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
      setAccessToken(null);
      setAlert({ severity: 'success', message: 'You have successfully signed out' });
    } catch {
      setAlert({ severity: 'error', message: 'Failed to sign out. Try again later' });
    }
  };

  const handleTokenRefreshed = (newToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, newToken);
    setAccessToken(newToken);
  };

  const handleAuthFailure = () => {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    setAccessToken(null);
    setAlert({ severity: 'error', message: 'Your session has expired. Please sign in again' });
  };

  const handleOAuthError = () =>
    setAlert({ severity: 'error', message: 'Failed to sign in with Google. Please try again' });

  useEffect(() => {
    if (searchParams.get('oauthError')) {
      handleOAuthError();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  useEffect(() => {
    if (!accessToken) {
      setSignInMethod(null);
      setRole(null);
      return;
    }
    let cancelled = false;
    const loadSignInMethod = async () => {
      try {
        const result = await callWithTokenRefresh(
          { accessToken, onTokenRefreshed: handleTokenRefreshed },
          (token) => getSignInMethod(token),
        );
        if (cancelled) return;
        setSignInMethod(result.signInMethod);
        setRole(result.role);
      } catch {
        // leave state as-is; nav item / admin route guard stay in their
        // previous state until the next successful fetch
      }
    };
    loadSignInMethod();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const handleOpenChangePassword = () => setShowChangePasswordForm(true);

  const handleCloseChangePassword = () => setShowChangePasswordForm(false);

  const handleChangePasswordSuccess = () => {
    setAlert({ severity: 'success', message: 'You have successfully changed your password' });
    setShowChangePasswordForm(false);
  };

  const handleChangePasswordError = () =>
    setAlert({ severity: 'error', message: 'Failed to change password. Please try again' });

  const handleAdminActionSuccess = (message: string) =>
    setAlert({ severity: 'success', message });

  const handleAdminActionError = (message: string) => setAlert({ severity: 'error', message });

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            accessToken ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthPage
                onSignUpSuccess={handleSignUpSuccess}
                onSignUpError={handleSignUpError}
                onSignInSuccess={handleSignInSuccess}
                onSignInError={handleSignInError}
                onForgotPasswordSuccess={handleForgotPasswordSuccess}
                onForgotPasswordError={handleForgotPasswordError}
                onTwoFaError={handleTwoFaError}
                onTwoFaSessionExpired={handleTwoFaSessionExpired}
              />
            )
          }
        />
        <Route
          path="/reset-password"
          element={
            <ResetPasswordPage
              onSuccess={handleResetPasswordSuccess}
              onError={handleResetPasswordError}
            />
          }
        />
        <Route
          path="/oauth/callback"
          element={<OAuthCallbackPage onSuccess={handleSignInSuccess} onError={handleOAuthError} />}
        />
        <Route element={<RequireAuth isAuthenticated={accessToken !== null} />}>
          <Route
            element={
              <AuthenticatedLayout
                onSignOut={handleSignOut}
                onOpenChangePassword={handleOpenChangePassword}
                signInMethod={signInMethod}
                role={role}
                accessToken={accessToken}
                showChangePasswordForm={showChangePasswordForm}
                onCloseChangePassword={handleCloseChangePassword}
                onTokenRefreshed={handleTokenRefreshed}
                onChangePasswordSuccess={handleChangePasswordSuccess}
                onChangePasswordError={handleChangePasswordError}
              />
            }
          >
            <Route
              path="/dashboard"
              element={
                <DashboardPage />
              }
            />
            <Route
              path="/protected"
              element={
                <ProtectedPage
                  accessToken={accessToken}
                  onTokenRefreshed={handleTokenRefreshed}
                  onAuthFailure={handleAuthFailure}
                />
              }
            />
            <Route
              element={
                <RequireRole role={role} allowedRoles={[USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN]} />
              }
            >
              <Route
                path="/admin"
                element={
                  role ? (
                    <AdminPage
                      accessToken={accessToken}
                      role={role}
                      onTokenRefreshed={handleTokenRefreshed}
                      onAuthFailure={handleAuthFailure}
                      onActionSuccess={handleAdminActionSuccess}
                      onActionError={handleAdminActionError}
                    />
                  ) : null
                }
              />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Snackbar
        open={alert !== null}
        autoHideDuration={5000}
        onClose={closeAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        {alert ? (
          <Alert
            severity={alert.severity}
            action={
              <Button color="inherit" size="small" onClick={closeAlert}>
                Close
              </Button>
            }
          >
            {alert.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </>
  );
};

export default App;
