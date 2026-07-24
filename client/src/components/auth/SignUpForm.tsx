import { useState, type FormEvent } from 'react';
import { Box, Button, Stack, TextField, Typography, Link } from '@mui/material';
import { validateAuthCredentials, type FieldErrors } from '../../validation/authSchema';
import { signUp } from '../../api/client';

interface SignUpFormProps {
  onSuccess: () => void;
  onError: () => void;
  onSwitchToSignIn: () => void;
}

export const SignUpForm = ({ onSuccess, onError, onSwitchToSignIn }: SignUpFormProps) => {
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
      await signUp({ email, password });
      onSuccess();
    } catch {
      onError();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Sign up
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
        <Button type="submit" variant="contained" disabled={submitting} fullWidth>
          Sign up
        </Button>
        <Typography variant="body2" align="center">
          Already have an account?{' '}
          <Link component="button" type="button" onClick={onSwitchToSignIn}>
            Sign in
          </Link>
        </Typography>
      </Stack>
    </Box>
  );
};
