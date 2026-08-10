import { Box, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export const DashboardPage = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stack spacing={3} sx={{ alignItems: 'center' }}>
        <Button variant="contained" size="large" onClick={() => navigate('/protected')}>
          Go to protected route
        </Button>
      </Stack>
    </Box>
  );
};
