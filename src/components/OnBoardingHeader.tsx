import { Alert, Box, Button, CssBaseline, Stack, Typography } from '@mui/material';


export default function OnBoardingHeader() {
  return (
    <Stack spacing={1} sx={{ textAlign: 'center', mb: 4 }}>
    <Typography variant="h4" component="h1">
      Welcome
    </Typography>
    <Typography variant="body1" color="text.secondary">
      A short onboarding to get you set up.
    </Typography>
  </Stack>
  )
}
