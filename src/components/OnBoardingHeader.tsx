import { Alert, Box, Button, CssBaseline, Stack, Typography } from '@mui/material'; // REVIEW: stale imports, setup husky rule to catch it before commit
// and proper linting in place in the editor (leverage LSP for llm's to not produce non linted code)


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
