import { Request } from 'express';

export enum USERROLE {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
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
  disabled: boolean;
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
  SESSION_REVOKED = 'Session_Revoked',
}

export enum USERS_ERROR_STATUS {
  NOT_FOUND = 'Not_Found',
  DISABLED = 'User_Disabled',
}

export enum TWO_FA_ERROR_STATUS {
  INVALID = 'Invalid_code',
}

// Used when a promote/demote request loses the race: by the time this
// transaction acquired the row lock, another admin action had already
// moved the user out of the role this request expected as its starting point.
export enum ROLE_TRANSITION_ERROR_STATUS {
  UNEXPECTED_ROLE = 'Unexpected_Role_State',
}

// Returned by admin mutation endpoints when the action targets the caller's
// own account, or when the caller's role is insufficient for the target's role.
export enum ADMIN_ACTION_ERROR_STATUS {
  SELF_ACTION_FORBIDDEN = 'Self_Action_Forbidden',
  TARGET_ROLE_FORBIDDEN = 'Target_Role_Forbidden',
}

export interface JWTPayloadType {
  sid: string;
  uid: string;
  temporary?: boolean;
}

export type ValidUserRequestType = Request & {
  userId: string;
  userRole: USERROLE;
};

export interface ResetTokenType {
  id: string;
  token: string;
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

export interface IdentityResult {
  id: string;
  user_id: string;
  provider: string;
  provider_id: string;
}
export type IdentityInput = Omit<IdentityResult, 'id'>;

export enum SIGN_IN_METHOD {
  EMAIL_AND_PASSWORD = 'email_and_password',
  OAUTH = 'oauth',
}

export enum Tables {
  USERS = 'users',
  SESSIONS = 'sessions',
  RESET_TOKENS = 'reset_tokens',
  IDENTITIES = 'identities',
}

export enum DATA_FORMAT {
  BASE64 = 'base64',
  BASE64URL = 'base64url',
  UTF8 = 'utf8',
  HEX = 'hex',
}
