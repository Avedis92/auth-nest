import { useState, type FormEvent } from 'react';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import {
  validateTwoFaCode,
  type TwoFaCodeFieldErrors,
} from '../../validation/authSchema';
import { ApiRequestError, verifyTwoFa } from '../../api/client';
import {
  JWT_TOKEN_ERROR_STATUS,
  TWO_FA_ERROR_STATUS,
  type SignInSuccessResponse,
} from '../../types/auth';

interface TwoFaVerifyFormProps {
  tempToken: string;
  onSuccess: (response: SignInSuccessResponse) => void;
  onError: () => void;
  onSessionExpired: () => void;
}

export const TwoFaVerifyForm = ({
  tempToken,
  onSuccess,
  onError,
  onSessionExpired,
}: TwoFaVerifyFormProps) => {
  const [code, setCode] = useState('');
  const [fieldErrors, setFieldErrors] = useState<TwoFaCodeFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors = validateTwoFaCode({ code });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const response = await verifyTwoFa(tempToken, { code });
      onSuccess(response);
    } catch (error) {
      if (error instanceof ApiRequestError && error.body.code === TWO_FA_ERROR_STATUS.INVALID) {
        setFieldErrors({ code: 'Invalid code' });
      } else if (
        error instanceof ApiRequestError &&
        error.body.code === JWT_TOKEN_ERROR_STATUS.TOKEN_EXPIRED
      ) {
        onSessionExpired();
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
        Two-factor authentication
      </Typography>
      <Stack spacing={2}>
        <Typography variant="body2">
          Enter the 6-digit code from your authenticator app.
        </Typography>
        <TextField
          label="Authentication code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          error={Boolean(fieldErrors.code)}
          helperText={fieldErrors.code ?? ' '}
          fullWidth
          autoFocus
        />
        <Button type="submit" variant="contained" disabled={submitting} fullWidth>
          Verify
        </Button>
      </Stack>
    </Box>
  );
};
