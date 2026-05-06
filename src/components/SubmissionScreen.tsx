import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import type { JSX } from 'react';

import { zodToFields } from './onboarding';
import type { FieldDescriptor, OnboardingSteps } from './onboarding';

type StepRecord = Readonly<Record<string, unknown>>;

type Props = {
  readonly steps: OnboardingSteps;
  readonly submitted: Readonly<Record<string, StepRecord>>;
  readonly onClick: () => void;
};

// REVIEW: move below helpers to utils file
const labelFor = (descriptor: FieldDescriptor, value: unknown): string => {
  const match = descriptor.options?.find((opt) => opt.value === value);
  return match?.label ?? String(value);
};

const promptFor = (descriptor: FieldDescriptor): string =>
  descriptor.helperText ?? descriptor.label;

const isFilled = (value: unknown): boolean => {
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
};

// REVIEW: move this to new file and break it down further, use Factory pattern
function FieldReview({ descriptor, value }: { readonly descriptor: FieldDescriptor; readonly value: unknown }): JSX.Element | null {
  if (!isFilled(value)) return null;

  switch (descriptor.kind) {
    case 'multiCheckbox':
    case 'tags': {
      const items = Array.isArray(value) ? value : [];
      return (
        <Stack spacing={1.25} sx={{ alignItems: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            {promptFor(descriptor)}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
            {items.map((item) => (
              <Chip key={String(item)} label={labelFor(descriptor, item)} variant="outlined" />
            ))}
          </Box>
        </Stack>
      );
    }
    case 'checkbox':
      return (
        <Typography variant="body1" color="text.secondary" align="center">
          {promptFor(descriptor)}: <strong>{value === true ? 'Yes' : 'No'}</strong>
        </Typography>
      );
    case 'select':
    case 'number':
    case 'email':
    case 'text':
    default:
      return (
        <Typography variant="body1" color="text.secondary" align="center">
          {promptFor(descriptor)}: <strong>{labelFor(descriptor, value)}</strong>
        </Typography>
      );
  }
}

export default function SubmissionScreen({ steps, submitted, onClick }: Props): JSX.Element {
  // REVIEW: nit, memo styles
  return (
    <Paper elevation={1} sx={{ p: { xs: 3, sm: 4 }, maxWidth: 640, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" component="h2" align="center" sx={{ mb: 1 }}>
        All set!
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
        Here's a quick recap of what you told us.
      </Typography>

      <Stack spacing={3} sx={{ alignItems: 'center' }}>
        {steps.map((step) => {
          // REVIEW: extract out to new component
          const stepData = submitted[step.id] ?? {};
          const fields = zodToFields(step.schema);
          const filled = fields.filter((f) => isFilled(stepData[f.name]));
          if (filled.length === 0) return null;

          return (
            <Stack key={step.id} spacing={1.5} sx={{ width: '100%', alignItems: 'center' }}>
              {filled.map((field) => (
                <FieldReview key={field.name} descriptor={field} value={stepData[field.name]} />
              ))}
            </Stack>
          );
        })}
      </Stack>

      <Stack direction="row" sx={{ mt: 5, justifyContent: 'center' }}>
        <Button variant="outlined" onClick={onClick}>
          Start over
        </Button>
      </Stack>
    </Paper>
  );
}
