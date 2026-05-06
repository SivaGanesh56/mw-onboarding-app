import { Box, Paper, Step, StepLabel, Stepper } from '@mui/material';
import type { JSX } from 'react';

import { StepRenderer } from './StepRenderer';
import type { OnboardingFlowProps, OnboardingSteps } from './types';
import { useOnboarding } from './useOnboarding';

/**
 * Top-level orchestrator. Owns the onboarding state machine and renders the
 * stepper progress + the active step. The only public boundary is `steps` and
 * `onComplete` (the final submit hook); everything else is plumbing.
 */
export function OnboardingFlow<TSteps extends OnboardingSteps>({
  steps,
  onComplete,
  initialData,
  registry,
}: OnboardingFlowProps<TSteps>): JSX.Element {
  const flow = useOnboarding({ steps, onComplete, initialData });

  return (
    <Paper elevation={1} sx={{ p: { xs: 3, sm: 4 }, maxWidth: 640, mx: 'auto', mt: 4 }}>
      <Stepper activeStep={flow.stepIndex} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((step) => (
          <Step key={step.id}>
            <StepLabel>{step.title}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box>
        <StepRenderer
          step={flow.currentStep}
          value={flow.currentData}
          errors={flow.currentErrors}
          registry={registry}
          isFirst={flow.isFirst}
          isLast={flow.isLast}
          isSubmitting={flow.isSubmitting}
          onChange={flow.setCurrentStepData}
          onBack={flow.back}
          onNext={() => {
            void flow.attemptNext();
          }}
        />
      </Box>
    </Paper>
  );
}
