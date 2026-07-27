import { useState } from 'react';
import { SignUpForm } from './SignUpForm';
import { SignInForm } from './SignInForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { TwoFaSetupForm } from './TwoFaSetupForm';
import { TwoFaVerifyForm } from './TwoFaVerifyForm';
import {
  isTwoFaChallenge,
  type SignInResponse,
  type SignInSuccessResponse,
} from '../../types/auth';

type AuthView = 'signup' | 'signin' | 'forgot-password' | 'two-fa-setup' | 'two-fa-verify';

interface AuthPageProps {
  onSignUpSuccess: () => void;
  onSignUpError: () => void;
  onSignInSuccess: (token: string) => void;
  onSignInError: () => void;
  onForgotPasswordSuccess: () => void;
  onForgotPasswordError: () => void;
  onTwoFaError: () => void;
  onTwoFaSessionExpired: () => void;
}

export const AuthPage = ({
  onSignUpSuccess,
  onSignUpError,
  onSignInSuccess,
  onSignInError,
  onForgotPasswordSuccess,
  onForgotPasswordError,
  onTwoFaError,
  onTwoFaSessionExpired,
}: AuthPageProps) => {
  const [view, setView] = useState<AuthView>('signup');
  const [tempToken, setTempToken] = useState<string | null>(null);

  const handleSignInResponse = (response: SignInResponse) => {
    if (isTwoFaChallenge(response)) {
      setTempToken(response.tempToken);
      setView(response.twoFactorEnabled ? 'two-fa-verify' : 'two-fa-setup');
      return;
    }
    onSignInSuccess(response.token);
  };

  const handleTwoFaSuccess = (response: SignInSuccessResponse) => {
    setTempToken(null);
    onSignInSuccess(response.token);
  };

  const handleTwoFaSessionExpired = () => {
    setTempToken(null);
    setView('signin');
    onTwoFaSessionExpired();
  };

  if (view === 'signup') {
    return (
      <SignUpForm
        onSwitchToSignIn={() => setView('signin')}
        onSuccess={onSignUpSuccess}
        onError={onSignUpError}
      />
    );
  }

  if (view === 'forgot-password') {
    return (
      <ForgotPasswordForm
        onClose={() => setView('signin')}
        onSuccess={() => {
          onForgotPasswordSuccess();
          setView('signin');
        }}
        onError={onForgotPasswordError}
      />
    );
  }

  if (view === 'two-fa-setup' && tempToken) {
    return (
      <TwoFaSetupForm
        tempToken={tempToken}
        onSuccess={handleTwoFaSuccess}
        onError={onTwoFaError}
        onSessionExpired={handleTwoFaSessionExpired}
      />
    );
  }

  if (view === 'two-fa-verify' && tempToken) {
    return (
      <TwoFaVerifyForm
        tempToken={tempToken}
        onSuccess={handleTwoFaSuccess}
        onError={onTwoFaError}
        onSessionExpired={handleTwoFaSessionExpired}
      />
    );
  }

  return (
    <SignInForm
      onSwitchToSignUp={() => setView('signup')}
      onForgotPassword={() => setView('forgot-password')}
      onSuccess={handleSignInResponse}
      onError={onSignInError}
    />
  );
};
