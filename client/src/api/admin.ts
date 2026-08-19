import type { AdminUserListResponse, AdminActionResponse } from '../types/admin';
import type { ApiErrorResponse } from '../types/auth';
import { API_URL, ApiRequestError } from './client';

export interface ListUsersParams {
  limit: number;
  offset: number;
  search?: string;
}

export const listUsers = async (
  accessToken: string | null,
  params: ListUsersParams,
): Promise<AdminUserListResponse> => {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
    ...(params.search ? { search: params.search } : {}),
  });

  const response = await fetch(`${API_URL}/api/v1/admin/users?${query.toString()}`, {
    method: 'GET',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiRequestError(response.status, data as ApiErrorResponse);
  }

  return data as AdminUserListResponse;
};

const patchAdminAction = async (
  path: string,
  accessToken: string | null,
): Promise<AdminActionResponse> => {
  const response = await fetch(`${API_URL}/api/v1/admin/${path}`, {
    method: 'PATCH',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiRequestError(response.status, data as ApiErrorResponse);
  }

  return data as AdminActionResponse;
};

export const disableUser = (accessToken: string | null, id: string) =>
  patchAdminAction(`disable/${id}`, accessToken);

export const enableUser = (accessToken: string | null, id: string) =>
  patchAdminAction(`enable/${id}`, accessToken);

export const promoteToAdmin = (accessToken: string | null, id: string) =>
  patchAdminAction(`promote/${id}`, accessToken);

export const demoteToUser = (accessToken: string | null, id: string) =>
  patchAdminAction(`demote/${id}`, accessToken);
