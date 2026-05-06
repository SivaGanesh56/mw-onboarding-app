import { Box, CssBaseline } from '@mui/material';
import { useCallback, useState } from 'react';
import type { JSX } from 'react';
import { z } from 'zod';

import { OnboardingFlow } from './components/onboarding';
import type { AggregatedData, OnboardingStep } from './components/onboarding';
import OnBoardingHeader from './components/OnBoardingHeader';
import SubmissionScreen from './components/SubmissionScreen';

// REVIEW: schema can be moved out to separate file
const welcomeStep = {
  id: 'welcome',
  title: 'Welcome!', // REVIEW: i18n missing (if product supports multi languages) applicable for all label fields in the schema
  description: 'How should we call you?',
  schema: z.object({
    name: z.string().min(1, 'Please tell us your name').describe('You go by'),
  }),
} as const satisfies OnboardingStep; // REVIEW: poor typing, avoid type alias, same for below steps as well

const expertiseStep = {
  id: 'expertise',
  title: 'Your expertise',
  description: 'What are your areas of expertise?',
  schema: z.object({
    expertise: z
      .array(z.enum(['lifestyle', 'beauty', 'food']))
      .min(1, 'Pick at least one')
      .describe('You are an expert in'),
  }),
} as const satisfies OnboardingStep;

const brandsStep = {
  id: 'brands',
  title: 'One last thing',
  description: 'Have you collaborated with brands in the past?',
  schema: z.object({
    brands: z
      .array(z.string().min(1))
      .min(1, 'Add at least one brand')
      .describe('You have worked with the following brands'),
  }),
} as const satisfies OnboardingStep;

// REVIEW: should steps: OnboardingStep[]
const steps = [welcomeStep, expertiseStep, brandsStep] as const;

type DemoData = AggregatedData<typeof steps>;

// REVIEW: i18n missing overall

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
          <SubmissionScreen steps={steps} submitted={submitted} onClick={handleRestart} />
        ) : (
          <OnboardingFlow key={flowKey} steps={steps} onComplete={handleComplete} />
        )}
      </Box>
    </>
  );
}

export default App;
