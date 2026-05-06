import { Box, CssBaseline } from '@mui/material';
import { useCallback, useState } from 'react';
import type { JSX } from 'react';
import { z } from 'zod';

import { OnboardingFlow } from './components/onboarding';
import type { AggregatedData, OnboardingStep } from './components/onboarding';
import OnBoardingHeader from './components/OnBoardingHeader';
import SubmissionScreen from './components/SubmissionScreen';

const welcomeStep = {
  id: 'welcome',
  title: 'Welcome!',
  description: 'How should we call you?',
  schema: z.object({
    name: z.string().min(1, 'Please tell us your name'),
  }),
} as const satisfies OnboardingStep;

const expertiseStep = {
  id: 'expertise',
  title: 'Your expertise',
  description: 'What are your areas of expertise?',
  schema: z.object({
    expertise: z
      .array(z.enum(['lifestyle', 'beauty', 'food']))
      .min(1, 'Pick at least one'),
  }),
} as const satisfies OnboardingStep;

const brandsStep = {
  id: 'brands',
  title: 'One last thing',
  description: 'Have you collaborated with brands in the past?',
  schema: z.object({
    brands: z
      .array(z.string().min(1))
      .min(1, 'Add at least one brand'),
  }),
} as const satisfies OnboardingStep;

const steps = [welcomeStep, expertiseStep, brandsStep] as const;

type DemoData = AggregatedData<typeof steps>;

function App(): JSX.Element {
  const [submitted, setSubmitted] = useState<DemoData | null>(null);
  const [flowKey, setFlowKey] = useState(0);

  const handleComplete = useCallback(async (data: DemoData): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    setSubmitted(data);
  }, []);

  const handleRestart = useCallback((): void => {
    setSubmitted(null);
    setFlowKey((k) => k + 1);
  }, []);

  return (
    <>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 6 }}>
        <OnBoardingHeader />

        {submitted ? (
          <SubmissionScreen submitted={submitted} onClick={handleRestart} />
        ) : (
          <OnboardingFlow key={flowKey} steps={steps} onComplete={handleComplete} />
        )}
      </Box>
    </>
  );
}

export default App;
