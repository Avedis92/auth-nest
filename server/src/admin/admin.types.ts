import { USERROLE } from 'src/common/types';

export interface AdminUserListItem {
  id: string;
  email: string;
  role: USERROLE;
  status: 'enabled' | 'disabled';
  signUpDate: Date;
  lastSignInDate: Date | null;
  lastSignOutDate: Date | null;
  activeSessionsCount: number;
}

export interface AdminUserListResponse {
  data: AdminUserListItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    totalPages: number;
  };
}
