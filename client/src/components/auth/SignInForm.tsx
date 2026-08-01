import { useState, type FormEvent } from 'react';
import { Box, Button, Stack, TextField, Typography, Link } from '@mui/material';
import { validateAuthCredentials, type FieldErrors } from '../../validation/authSchema';
import { API_URL, signIn } from '../../api/client';
import type { SignInResponse } from '../../types/auth';

interface SignInFormProps {
  onSuccess: (response: SignInResponse) => void;
  onError: () => void;
  onSwitchToSignUp: () => void;
  onForgotPassword: () => void;
}

export const SignInForm = ({
  onSuccess,
  onError,
  onSwitchToSignUp,
  onForgotPassword,
}: SignInFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors = validateAuthCredentials({ email, password });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const response = await signIn({ email, password });
      onSuccess(response);
    } catch {
      onError();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Sign in
      </Typography>
      <Stack spacing={2}>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={Boolean(fieldErrors.email)}
          helperText={fieldErrors.email ?? ' '}
          fullWidth
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={Boolean(fieldErrors.password)}
          helperText={fieldErrors.password ?? ' '}
          fullWidth
        />
        <Typography variant="body2" align="right">
          <Link component="button" type="button" onClick={onForgotPassword}>
            Forgot password?
          </Link>
        </Typography>
        <Button type="submit" variant="contained" disabled={submitting} fullWidth>
          Sign in
        </Button>
        <Button href={`${API_URL}/api/v1/auth/google`} variant="outlined" fullWidth>
          Sign in with Google
        </Button>
        <Typography variant="body2" align="center">
          Don&apos;t have an account?{' '}
          <Link component="button" type="button" onClick={onSwitchToSignUp}>
            Sign up
          </Link>
        </Typography>
      </Stack>
    </Box>
  );
};
