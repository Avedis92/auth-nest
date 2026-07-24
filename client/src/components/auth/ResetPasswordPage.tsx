import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import {
  validateResetPassword,
  type ResetPasswordFieldErrors,
} from '../../validation/resetPasswordSchema';
import { resetPassword } from '../../api/client';

interface ResetPasswordPageProps {
  onSuccess: () => void;
  onError: () => void;
}

export const ResetPasswordPage = ({ onSuccess, onError }: ResetPasswordPageProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ResetPasswordFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    const errors = validateResetPassword({ password });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await resetPassword({ password, resetToken: token });
      onSuccess();
      navigate('/');
    } catch {
      onError();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Reset password
      </Typography>
      <Stack spacing={2}>
        {!token && (
          <Alert severity="error">
            This reset link is invalid or missing. Please request a new one.
          </Alert>
        )}
        <TextField
          label="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={Boolean(fieldErrors.password)}
          helperText={fieldErrors.password ?? ' '}
          fullWidth
          disabled={!token}
        />
        <Button type="submit" variant="contained" disabled={submitting || !token} fullWidth>
          Reset password
        </Button>
        <Button type="button" variant="text" onClick={() => navigate('/')} fullWidth>
          Back
        </Button>
      </Stack>
    </Box>
  );
};
