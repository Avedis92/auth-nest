export interface AuthCredentials {
  email: string;
  password: string;
}

export interface ChangePasswordCredentials {
  oldPassword: string;
  password: string;
}

export interface ForgotPasswordCredentials {
  email: string;
}

export interface ResetPasswordCredentials {
  password: string;
  resetToken: string;
}

export interface AuthSuccessResponse {
  message: string;
  success: true;
  token?: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  error?: string;
  message: string | { message: string; errors: unknown };
  code?: string;
}

export interface SignInSuccessResponse extends Omit<AuthSuccessResponse, 'token'> {
  token: string;
}

export interface ProtectedResourceResponse {
  text: string;
}

export const JWT_TOKEN_ERROR_STATUS = {
  TOKEN_MISSING: 'Token_Missing',
  TOKEN_EXPIRED: 'Token_Expired',
  TOKEN_INVALID: 'Token_Invalid',
  TOKEN_REUSE_DETECTED: 'Token_reuse_detected',
} as const;

export const USERS_ERROR_STATUS = {
  NOT_FOUND: 'Not_Found',
} as const;

export interface SignUpCredentials extends AuthCredentials {
  isUserRegisteredFor2FA: boolean;
}

export interface TwoFaChallengeResponse {
  twoFactorEnabled: boolean;
  userRegisteredForTwoFactor: boolean;
  tempToken: string;
}

export type SignInResponse = SignInSuccessResponse | TwoFaChallengeResponse;

export const isTwoFaChallenge = (
  response: SignInResponse,
): response is TwoFaChallengeResponse => 'userRegisteredForTwoFactor' in response;

export interface TwoFaCodeCredentials {
  code: string;
}

export const TWO_FA_ERROR_STATUS = {
  INVALID: 'Invalid_code',
} as const;
