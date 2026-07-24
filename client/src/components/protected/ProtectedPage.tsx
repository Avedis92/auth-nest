import { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { ApiRequestError, getProtectedResource, refreshAccessToken } from '../../api/client';
import { JWT_TOKEN_ERROR_STATUS } from '../../types/auth';

interface ProtectedPageProps {
  accessToken: string | null;
  onTokenRefreshed: (token: string) => void;
  onAuthFailure: () => void;
}

export const ProtectedPage = ({ accessToken, onTokenRefreshed, onAuthFailure }: ProtectedPageProps) => {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadProtectedResource = async () => {
      try {
        const data = await getProtectedResource(accessToken);
        if (!cancelled) setText(data.text);
      } catch (error) {
        const code = error instanceof ApiRequestError ? error.body.code : undefined;

        if (code !== JWT_TOKEN_ERROR_STATUS.TOKEN_EXPIRED) {
          if (!cancelled) onAuthFailure();
          return;
        }

        try {
          const refreshed = await refreshAccessToken();
          if (cancelled) return;

          onTokenRefreshed(refreshed.token);
          const retryData = await getProtectedResource(refreshed.token);
          if (!cancelled) setText(retryData.text);
        } catch {
          if (!cancelled) onAuthFailure();
        }
      }
    };

    loadProtectedResource();

    return () => {
      cancelled = true;
    };
    // Intentionally runs once on mount: the refresh-and-retry path below updates
    // accessToken via onTokenRefreshed, which must not re-trigger this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (text === null) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="h5">{text}</Typography>
    </Box>
  );
};
