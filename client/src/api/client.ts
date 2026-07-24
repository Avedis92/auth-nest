import type {
  AuthCredentials,
  AuthSuccessResponse,
  ApiErrorResponse,
  SignInSuccessResponse,
  ProtectedResourceResponse,
  ChangePasswordCredentials,
  ForgotPasswordCredentials,
  ResetPasswordCredentials,
} from "../types/auth";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export class ApiRequestError extends Error {
  status: number;
  body: ApiErrorResponse;

  constructor(status: number, body: ApiErrorResponse) {
    super(
      typeof body.message === "string" ? body.message : body.message.message,
    );
    this.status = status;
    this.body = body;
  }
}

export const signUp = async (
  credentials: AuthCredentials,
): Promise<AuthSuccessResponse> => {
  const response = await fetch(`${API_URL}/api/v1/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiRequestError(response.status, data as ApiErrorResponse);
  }

  return data as AuthSuccessResponse;
};

export const signIn = async (
  credentials: AuthCredentials,
): Promise<SignInSuccessResponse> => {
  const response = await fetch(`${API_URL}/api/v1/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiRequestError(response.status, data as ApiErrorResponse);
  }

  return data as SignInSuccessResponse;
};

export const signOut = async (): Promise<AuthSuccessResponse> => {
  const response = await fetch(`${API_URL}/api/v1/auth/signout`, {
    method: "POST",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiRequestError(response.status, data as ApiErrorResponse);
  }

  return data as AuthSuccessResponse;
};

export const getProtectedResource = async (
  accessToken: string | null,
): Promise<ProtectedResourceResponse> => {
  const response = await fetch(`${API_URL}/api/v1/protected`, {
    method: "GET",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiRequestError(response.status, data as ApiErrorResponse);
  }

  return data as ProtectedResourceResponse;
};

export const changePassword = async (
  accessToken: string | null,
  credentials: ChangePasswordCredentials,
): Promise<AuthSuccessResponse> => {
  const response = await fetch(`${API_URL}/api/v1/auth/change-password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiRequestError(response.status, data as ApiErrorResponse);
  }

  return data as AuthSuccessResponse;
};

export const forgotPassword = async (
  credentials: ForgotPasswordCredentials,
): Promise<AuthSuccessResponse> => {
  const response = await fetch(`${API_URL}/api/v1/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiRequestError(response.status, data as ApiErrorResponse);
  }

  return data as AuthSuccessResponse;
};

export const resetPassword = async (
  credentials: ResetPasswordCredentials,
): Promise<AuthSuccessResponse> => {
  const response = await fetch(`${API_URL}/api/v1/auth/reset-password`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiRequestError(response.status, data as ApiErrorResponse);
  }

  return data as AuthSuccessResponse;
};

export const refreshAccessToken = async (): Promise<SignInSuccessResponse> => {
  const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiRequestError(response.status, data as ApiErrorResponse);
  }

  return data as SignInSuccessResponse;
};
