import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Snackbar, Alert, Button } from '@mui/material';
import { AuthPage } from './components/auth/AuthPage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { ProtectedPage } from './components/protected/ProtectedPage';
import { RequireAuth } from './components/routing/RequireAuth';
import { AuthenticatedLayout } from './components/layout/AuthenticatedLayout';
import { signOut } from './api/client';

const ACCESS_TOKEN_STORAGE_KEY = 'accessToken';

type AlertState = { severity: 'success' | 'error'; message: string } | null;

const App = () => {
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY),
  );
  const [alert, setAlert] = useState<AlertState>(null);
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);

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

  const handleOpenChangePassword = () => setShowChangePasswordForm(true);

  const handleCloseChangePassword = () => setShowChangePasswordForm(false);

  const handleChangePasswordSuccess = () => {
    setAlert({ severity: 'success', message: 'You have successfully changed your password' });
    setShowChangePasswordForm(false);
  };

  const handleChangePasswordError = () =>
    setAlert({ severity: 'error', message: 'Failed to change password. Please try again' });

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
        <Route element={<RequireAuth isAuthenticated={accessToken !== null} />}>
          <Route
            element={
              <AuthenticatedLayout
                onSignOut={handleSignOut}
                onOpenChangePassword={handleOpenChangePassword}
              />
            }
          >
            <Route
              path="/dashboard"
              element={
                <DashboardPage
                  accessToken={accessToken}
                  showChangePasswordForm={showChangePasswordForm}
                  onCloseChangePassword={handleCloseChangePassword}
                  onTokenRefreshed={handleTokenRefreshed}
                  onChangePasswordSuccess={handleChangePasswordSuccess}
                  onChangePasswordError={handleChangePasswordError}
                />
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
