import {
  Alert,
  Box,
  Button,
  Stack,
} from "@mui/material";

type Props = {
  submitted: object;
  onClick: () => void;
};

export default function SubmissionScreen(props: Props) {
  const { submitted, onClick } = props;

  return (
    <Box sx={{ maxWidth: 640, mx: "auto", px: { xs: 2, sm: 0 } }}>
      <Alert severity="success" sx={{ mb: 2 }}>
        You're all set. Here's what we received:
      </Alert>
      <Box
        component="pre"
        sx={{
          p: 2,
          bgcolor: "grey.100",
          borderRadius: 1,
          overflow: "auto",
          fontSize: 13,
        }}
      >
        {JSON.stringify(submitted, null, 2)}
      </Box>
      <Stack direction="row" sx={{ mt: 2, justifyContent: "flex-end" }}>
        <Button variant="outlined" onClick={onClick}>
          Start over
        </Button>
      </Stack>
    </Box>
  );
}
