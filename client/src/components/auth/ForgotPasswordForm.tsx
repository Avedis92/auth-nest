import { useState, type FormEvent } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import {
  validateForgotPassword,
  type ForgotPasswordFieldErrors,
} from '../../validation/forgotPasswordSchema';
import { ApiRequestError, forgotPassword } from '../../api/client';
import { USERS_ERROR_STATUS } from '../../types/auth';

interface ForgotPasswordFormProps {
  onClose: () => void;
  onSuccess: () => void;
  onError: () => void;
}

export const ForgotPasswordForm = ({ onClose, onSuccess, onError }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ForgotPasswordFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors = validateForgotPassword({ email });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await forgotPassword({ email });
      onSuccess();
    } catch (error) {
      if (error instanceof ApiRequestError && error.body.code === USERS_ERROR_STATUS.NOT_FOUND) {
        setFieldErrors({ email: 'Invalid email' });
      } else {
        onError();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Forgot password
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
        <Button type="submit" variant="contained" disabled={submitting} fullWidth>
          Send reset link
        </Button>
        <Button type="button" variant="text" onClick={onClose} fullWidth>
          Back to sign in
        </Button>
      </Stack>
    </Box>
  );
};
