import { ApiRequestError, refreshAccessToken } from './client';
import { JWT_TOKEN_ERROR_STATUS } from '../types/auth';

interface TokenRefreshContext {
  accessToken: string | null;
  onTokenRefreshed: (token: string) => void;
}

// Runs `request` with the current access token. If it fails with a
// Token_Expired code, refreshes once and retries exactly once with the new
// token. Any other failure (including a failed refresh or a failed retry)
// propagates to the caller unchanged, so callers keep their existing
// ApiRequestError-based error handling (onAuthFailure / alert display).
export const callWithTokenRefresh = async <T>(
  { accessToken, onTokenRefreshed }: TokenRefreshContext,
  request: (token: string | null) => Promise<T>,
): Promise<T> => {
  try {
    return await request(accessToken);
  } catch (error) {
    const code = error instanceof ApiRequestError ? error.body.code : undefined;
    if (code !== JWT_TOKEN_ERROR_STATUS.TOKEN_EXPIRED) throw error;

    const refreshed = await refreshAccessToken();
    onTokenRefreshed(refreshed.token);
    return request(refreshed.token);
  }
};
