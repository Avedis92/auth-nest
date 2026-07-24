import { Request } from 'express';

enum USERROLE {
  USER = 'user',
  ADMIN = 'admin',
}

export interface CreateUserType {
  id: string;
  email: string;
  password: string;
  role: USERROLE;
  created_at: Date;
  updated_at: Date;
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
