import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  type SelectChangeEvent,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { ApiRequestError } from '../../api/client';
import { callWithTokenRefresh } from '../../api/withTokenRefresh';
import { listUsers, promoteToAdmin, demoteToUser, enableUser, disableUser } from '../../api/admin';
import { JWT_TOKEN_ERROR_STATUS, type UserRole } from '../../types/auth';
import type { AdminUserListItem } from '../../types/admin';
import { AdminUserActionsCell } from './AdminUserActionsCell';
import type { AdminRowActionKey } from './adminRowPermissions';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const SEARCH_DEBOUNCE_MS = 400;

interface AdminPageProps {
  accessToken: string | null;
  role: UserRole;
  onTokenRefreshed: (token: string) => void;
  onAuthFailure: () => void;
  onActionSuccess: (message: string) => void;
  onActionError: (message: string) => void;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (!(error instanceof ApiRequestError)) return fallback;
  return typeof error.body.message === 'string' ? error.body.message : error.body.message.message;
};

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleString() : '—');

export const AdminPage = ({
  accessToken,
  role,
  onTokenRefreshed,
  onAuthFailure,
  onActionSuccess,
  onActionError,
}: AdminPageProps) => {
  const [rows, setRows] = useState<AdminUserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0); // zero-based
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Debounce the search box, and reset to page 1 whenever the effective
  // search term changes.
  useEffect(() => {
    const handle = setTimeout(() => {
      const trimmed = searchInput.trim();
      setDebouncedSearch((prev) => (prev === trimmed ? prev : trimmed));
      setPage(0);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callWithTokenRefresh({ accessToken, onTokenRefreshed }, (token) =>
        listUsers(token, {
          limit: pageSize,
          offset: page * pageSize,
          search: debouncedSearch || undefined,
        }),
      );
      setRows(data.data);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      const code = error instanceof ApiRequestError ? error.body.code : undefined;
      if (code === JWT_TOKEN_ERROR_STATUS.TOKEN_EXPIRED) {
        onAuthFailure();
        return;
      }
      onActionError(getErrorMessage(error, 'Failed to load users. Please try again.'));
    } finally {
      setLoading(false);
    }
    // accessToken intentionally excluded: callWithTokenRefresh reads it fresh
    // via closure and self-heals on expiry; including it would re-trigger a
    // redundant fetch immediately after every token refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, debouncedSearch, onAuthFailure, onActionError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const runAction = async (
    action: (token: string | null, id: string) => Promise<{ message: string; success: true }>,
    id: string,
    fallbackErrorMessage: string,
  ) => {
    try {
      const result = await callWithTokenRefresh({ accessToken, onTokenRefreshed }, (token) =>
        action(token, id),
      );
      onActionSuccess(result.message);
      await fetchUsers(); // refetch current page/offset/search — no optimistic patching
    } catch (error) {
      const code = error instanceof ApiRequestError ? error.body.code : undefined;
      if (code === JWT_TOKEN_ERROR_STATUS.TOKEN_EXPIRED) {
        onAuthFailure();
        return;
      }
      onActionError(getErrorMessage(error, fallbackErrorMessage));
    }
  };

  const handleRowAction = (action: AdminRowActionKey, id: string) => {
    switch (action) {
      case 'promote':
        return runAction(promoteToAdmin, id, 'Failed to promote user');
      case 'demote':
        return runAction(demoteToUser, id, 'Failed to demote user');
      case 'enable':
        return runAction(enableUser, id, 'Failed to enable user');
      case 'disable':
        return runAction(disableUser, id, 'Failed to disable user');
    }
  };

  const columns: GridColDef<AdminUserListItem>[] = [
    { field: 'id', headerName: 'User ID', flex: 1.4, minWidth: 220 },
    { field: 'email', headerName: 'Email', flex: 1.6, minWidth: 220 },
    { field: 'role', headerName: 'Role', width: 130 },
    { field: 'status', headerName: 'Status', width: 110 },
    {
      field: 'signUpDate',
      headerName: 'Signed up',
      width: 170,
      valueFormatter: (value: string) => formatDate(value),
    },
    {
      field: 'lastSignInDate',
      headerName: 'Last sign-in',
      width: 170,
      valueFormatter: (value: string | null) => formatDate(value),
    },
    {
      field: 'lastSignOutDate',
      headerName: 'Last sign-out',
      width: 170,
      valueFormatter: (value: string | null) => formatDate(value),
    },
    { field: 'activeSessionsCount', headerName: 'Active sessions', width: 140, type: 'number' },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params: GridRenderCellParams<AdminUserListItem>) => (
        <AdminUserActionsCell row={params.row} viewerRole={role} onAction={handleRowAction} />
      ),
    },
  ];

  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    setPageSize(Number(event.target.value));
    setPage(0);
  };

  const displayTotalPages = Math.max(totalPages, 1);

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3, gap: 2 }}>
      <Typography variant="h5">User administration</Typography>

      <TextField
        label="Search by email"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        size="small"
        sx={{ maxWidth: 360 }}
      />

      <Box sx={{ flex: 1, minHeight: 400 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          loading={loading}
          rowCount={total}
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={() => {
            /* navigation handled by the custom footer below */
          }}
          hideFooter
          disableRowSelectionOnClick
        />
      </Box>

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'flex-end' }}>
        <Select size="small" value={pageSize} onChange={handlePageSizeChange}>
          {PAGE_SIZE_OPTIONS.map((size) => (
            <MenuItem key={size} value={size}>
              {size} / page
            </MenuItem>
          ))}
        </Select>
        <IconButton
          size="small"
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(p - 1, 0))}
          aria-label="Previous page"
        >
          <NavigateBeforeIcon />
        </IconButton>
        <Typography variant="body2">
          Page {page + 1} of {displayTotalPages}
        </Typography>
        <IconButton
          size="small"
          disabled={page + 1 >= displayTotalPages}
          onClick={() => setPage((p) => p + 1)}
          aria-label="Next page"
        >
          <NavigateNextIcon />
        </IconButton>
      </Stack>
    </Box>
  );
};
