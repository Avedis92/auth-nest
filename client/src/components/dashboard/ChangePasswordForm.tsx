import { useState, type FormEvent } from 'react';
import { Box, Button, IconButton, Stack, TextField, Typography } from '@mui/material';
import {
  validateChangePassword,
  type ChangePasswordFieldErrors,
} from '../../validation/changePasswordSchema';
import { ApiRequestError, changePassword, refreshAccessToken } from '../../api/client';
import { JWT_TOKEN_ERROR_STATUS } from '../../types/auth';

interface ChangePasswordFormProps {
  accessToken: string | null;
  onClose: () => void;
  onTokenRefreshed: (token: string) => void;
  onSuccess: () => void;
  onError: () => void;
}

export const ChangePasswordForm = ({
  accessToken,
  onClose,
  onTokenRefreshed,
  onSuccess,
  onError,
}: ChangePasswordFormProps) => {
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ChangePasswordFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors = validateChangePassword({ oldPassword, password });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await changePassword(accessToken, { oldPassword, password });
      onSuccess();
    } catch (error) {
      const code = error instanceof ApiRequestError ? error.body.code : undefined;

      if (code !== JWT_TOKEN_ERROR_STATUS.TOKEN_EXPIRED) {
        onError();
        return;
      }

      try {
        const refreshed = await refreshAccessToken();
        onTokenRefreshed(refreshed.token);
        await changePassword(refreshed.token, { oldPassword, password });
        onSuccess();
      } catch {
        onError();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      noValidate
      sx={{ width: 320, p: 3, border: 1, borderColor: 'divider', borderRadius: 1 }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="h2">
          Change password
        </Typography>
        <IconButton aria-label="Close change password form" size="small" onClick={onClose}>
          ×
        </IconButton>
      </Stack>
      <Stack spacing={2} sx={{ mt: 2 }}>
        <TextField
          label="Old password"
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          error={Boolean(fieldErrors.oldPassword)}
          helperText={fieldErrors.oldPassword ?? ' '}
          fullWidth
        />
        <TextField
          label="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={Boolean(fieldErrors.password)}
          helperText={fieldErrors.password ?? ' '}
          fullWidth
        />
        <Button type="submit" variant="contained" disabled={submitting} fullWidth>
          Change password
        </Button>
      </Stack>
    </Box>
  );
};
