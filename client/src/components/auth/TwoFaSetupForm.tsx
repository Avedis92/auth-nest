import { useEffect, useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  validateTwoFaCode,
  type TwoFaCodeFieldErrors,
} from '../../validation/authSchema';
import { ApiRequestError, enableTwoFa, registerTwoFa } from '../../api/client';
import {
  JWT_TOKEN_ERROR_STATUS,
  TWO_FA_ERROR_STATUS,
  type SignInSuccessResponse,
} from '../../types/auth';

interface TwoFaSetupFormProps {
  tempToken: string;
  onSuccess: (response: SignInSuccessResponse) => void;
  onError: () => void;
  onSessionExpired: () => void;
}

export const TwoFaSetupForm = ({
  tempToken,
  onSuccess,
  onError,
  onSessionExpired,
}: TwoFaSetupFormProps) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loadingQrCode, setLoadingQrCode] = useState(true);
  const [code, setCode] = useState('');
  const [fieldErrors, setFieldErrors] = useState<TwoFaCodeFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    registerTwoFa(tempToken)
      .then((dataUrl) => {
        if (!cancelled) setQrCode(dataUrl);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiRequestError && error.body.code === JWT_TOKEN_ERROR_STATUS.TOKEN_EXPIRED) {
          onSessionExpired();
        } else {
          onError();
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingQrCode(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempToken]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors = validateTwoFaCode({ code });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const response = await enableTwoFa(tempToken, { code });
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
        Set up two-factor authentication
      </Typography>
      <Stack spacing={2} sx={{ alignItems: 'center' }}>
        <Typography variant="body2" align="center">
          Scan this QR code with your authenticator app, then enter the 6-digit code it generates.
        </Typography>
        {loadingQrCode ? (
          <CircularProgress />
        ) : qrCode ? (
          <Box
            component="img"
            src={qrCode}
            alt="Two-factor authentication QR code"
            sx={{ width: 200, height: 200 }}
          />
        ) : (
          <Alert severity="error" sx={{ width: '100%' }}>
            Failed to load QR code
          </Alert>
        )}
        <TextField
          label="Authentication code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          error={Boolean(fieldErrors.code)}
          helperText={fieldErrors.code ?? ' '}
          fullWidth
          autoFocus
        />
        <Button type="submit" variant="contained" disabled={submitting || loadingQrCode} fullWidth>
          Enable and sign in
        </Button>
      </Stack>
    </Box>
  );
};
