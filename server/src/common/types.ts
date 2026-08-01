import { Request } from 'express';

enum USERROLE {
  USER = 'user',
  ADMIN = 'admin',
}

export interface CreateUserType {
  id: string;
  email: string;
  password: string | null;
  role: USERROLE;
  created_at: Date;
  updated_at: Date;
  is_user_registered_for_two_factor: boolean;
  two_factor_secret: string;
  is_two_factor_enabled: boolean;
}

export interface CreateUserInput {
  email: string;
  password: string | null;
  isUserRegisteredFor2FA?: boolean;
}

export enum USERSTATUS {
  ACTIVE = 'active',
  LOGGED_OUT = 'logged_out',
  COMPROMISED = 'compromised',
}
export interface SessionType {
  id: string;
  user_id: string;
  status: USERSTATUS;
  refresh_token: string;
  expires_at: Date;
  sign_in_method: SIGN_IN_METHOD;
}

export enum JWT_TOKEN_ERROR_STATUS {
  TOKEN_MISSING = 'Token_Missing',
  TOKEN_EXPIRED = 'Token_Expired',
  TOKEN_INVALID = 'Token_Invalid',
  TOKEN_REUSE_DETECTED = 'Token_reuse_detected',
}

export enum USERS_ERROR_STATUS {
  NOT_FOUND = 'Not_Found',
}

export enum TWO_FA_ERROR_STATUS {
  INVALID = 'Invalid_code',
}

export interface JWTPayloadType {
  sid: string;
  uid: string;
}

export type ValidUserRequestType = Request & { userId: string };

export interface ResetTokenType {
  token: string;
  user_id: string;
  expires_at: Date;
}

export interface GoogleTokenApiResults {
  id_token: string;
  access_token: string;
  refresh_token: string;
}

export interface GoogleAuthProfile {
  sub: string;
  email: string;
  email_verified: string;
}

export interface GoogleIdentityResult {
  id: string;
  user_id: string;
  provider: string;
  provider_id: string;
}

export type GoogleIdentityInput = Omit<GoogleIdentityResult, 'id'>;

export enum SIGN_IN_METHOD {
  EMAIL_AND_PASSWORD = 'email_and_password',
  OAUTH = 'oauth',
}
