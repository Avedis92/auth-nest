import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { refreshAccessToken } from '../../api/client';

interface OAuthCallbackPageProps {
  onSuccess: (token: string) => void;
  onError: () => void;
}

export const OAuthCallbackPage = ({ onSuccess, onError }: OAuthCallbackPageProps) => {
  const navigate = useNavigate();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const completeSignIn = async () => {
      try {
        const { token } = await refreshAccessToken();
        onSuccess(token);
        navigate('/dashboard', { replace: true });
      } catch {
        onError();
        navigate('/', { replace: true });
      }
    };

    completeSignIn();
  }, [navigate, onSuccess, onError]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
      <CircularProgress />
    </Box>
  );
};
