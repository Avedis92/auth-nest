import type { UserRole } from './auth';

export interface AdminUserListItem {
  id: string;
  email: string;
  role: UserRole;
  status: 'enabled' | 'disabled';
  signUpDate: string;
  lastSignInDate: string | null;
  lastSignOutDate: string | null;
  activeSessionsCount: number;
}

export interface AdminUserListPagination {
  total: number;
  limit: number;
  offset: number;
  totalPages: number;
}

export interface AdminUserListResponse {
  data: AdminUserListItem[];
  pagination: AdminUserListPagination;
}

export interface AdminActionResponse {
  message: string;
  success: true;
}
