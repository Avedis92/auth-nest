import { useState } from 'react';
import { SignUpForm } from './SignUpForm';
import { SignInForm } from './SignInForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';

type AuthView = 'signup' | 'signin' | 'forgot-password';

interface AuthPageProps {
  onSignUpSuccess: () => void;
  onSignUpError: () => void;
  onSignInSuccess: (token: string) => void;
  onSignInError: () => void;
  onForgotPasswordSuccess: () => void;
  onForgotPasswordError: () => void;
}

export const AuthPage = ({
  onSignUpSuccess,
  onSignUpError,
  onSignInSuccess,
  onSignInError,
  onForgotPasswordSuccess,
  onForgotPasswordError,
}: AuthPageProps) => {
  const [view, setView] = useState<AuthView>('signup');

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

  return (
    <SignInForm
      onSwitchToSignUp={() => setView('signup')}
      onForgotPassword={() => setView('forgot-password')}
      onSuccess={onSignInSuccess}
      onError={onSignInError}
    />
  );
};
