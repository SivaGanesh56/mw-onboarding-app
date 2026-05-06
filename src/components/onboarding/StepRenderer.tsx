import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import type { FormEvent, JSX } from 'react';

import { SchemaForm } from './SchemaForm';
import type { AnyZodObject, FieldErrors, OnboardingStep, StepData, WidgetRegistry } from './types';

export interface StepRendererProps {
  readonly step: OnboardingStep<AnyZodObject>;
  readonly value: StepData;
  readonly errors: FieldErrors;
  readonly registry?: Partial<WidgetRegistry>;
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly isSubmitting: boolean;
  readonly onChange: (next: StepData) => void;
  readonly onBack: () => void;
  readonly onNext: () => void;
}

/**
 * Pure presentational shell for a single step: title + description + the
 * generic SchemaForm + Back/Next footer. All state lives in the parent.
 */
export function StepRenderer({
  step,
  value,
  errors,
  registry,
  isFirst,
  isLast,
  isSubmitting,
  onChange,
  onBack,
  onNext,
}: StepRendererProps): JSX.Element {
  
  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();
    onNext();
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h5" component="h2">
          {step.title}
        </Typography>
        {step.description ? (
          <Typography variant="body2" color="text.secondary">
            {step.description}
          </Typography>
        ) : null}
      </Stack>

      <SchemaForm
        schema={step.schema}
        uiSchema={step.uiSchema}
        value={value}
        errors={errors}
        registry={registry}
        disabled={isSubmitting}
        onChange={onChange}
      />

      <Stack direction="row" sx={{ mt: 4, justifyContent: 'space-between' }}>
        <Button onClick={onBack} disabled={isFirst || isSubmitting} variant="text">
          Back
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {isLast ? 'Finish' : 'Next'}
        </Button>
      </Stack>
    </Box>
  );
}
