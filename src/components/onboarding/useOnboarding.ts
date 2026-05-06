import { useCallback, useMemo, useReducer, useState } from 'react';

import type {
  AggregatedData,
  FieldErrors,
  OnboardingFlowProps,
  OnboardingStep,
  OnboardingSteps,
  StepData,
} from './types';

interface OnboardingState {
  readonly stepIndex: number;
  readonly data: Readonly<Record<string, StepData>>;
  readonly errors: Readonly<Record<string, FieldErrors>>;
}

type OnboardingAction =
  | { readonly type: 'SET_STEP_DATA'; readonly stepId: string; readonly data: StepData }
  | { readonly type: 'SET_STEP_ERRORS'; readonly stepId: string; readonly errors: FieldErrors }
  | { readonly type: 'CLEAR_STEP_ERRORS'; readonly stepId: string }
  | { readonly type: 'GO_TO'; readonly stepIndex: number }
  | { readonly type: 'RESET'; readonly initial: OnboardingState };

function reducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case 'SET_STEP_DATA':
      return {
        ...state,
        data: { ...state.data, [action.stepId]: action.data },
      };
    case 'SET_STEP_ERRORS':
      return {
        ...state,
        errors: { ...state.errors, [action.stepId]: action.errors },
      };
    case 'CLEAR_STEP_ERRORS': {
      if (!state.errors[action.stepId]) return state;
      const nextErrors = { ...state.errors };
      delete nextErrors[action.stepId];
      return { ...state, errors: nextErrors };
    }
    case 'GO_TO':
      return { ...state, stepIndex: action.stepIndex };
    case 'RESET':
      return action.initial;
  }
}

function buildInitialState<TSteps extends OnboardingSteps>(
  steps: TSteps,
  initialData: Partial<AggregatedData<TSteps>> | undefined,
): OnboardingState {
  const data: Record<string, StepData> = {};
  if (initialData) {
    for (const step of steps) {
      const seed = (initialData as Record<string, unknown>)[step.id];
      if (seed && typeof seed === 'object') {
        data[step.id] = seed as StepData;
      }
    }
  }
  return { stepIndex: 0, data, errors: {} };
}

export interface UseOnboardingResult<TSteps extends OnboardingSteps> {
  readonly state: OnboardingState;
  readonly steps: TSteps;
  readonly currentStep: TSteps[number];
  readonly currentData: StepData;
  readonly currentErrors: FieldErrors;
  readonly stepIndex: number;
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly isSubmitting: boolean;
  readonly setCurrentStepData: (next: StepData) => void;
  readonly back: () => void;
  readonly attemptNext: () => Promise<void>;
  readonly reset: () => void;
}

/**
 * State machine for the onboarding flow. Holds per-step data + errors,
 * advances only when the current step's Zod schema validates, and surfaces
 * a `Promise`-aware `isSubmitting` flag for the final `onComplete` call.
 */
export function useOnboarding<TSteps extends OnboardingSteps>({
  steps,
  onComplete,
  initialData,
}: Pick<OnboardingFlowProps<TSteps>, 'steps' | 'onComplete' | 'initialData'>): UseOnboardingResult<TSteps> {
  if (steps.length === 0) {
    throw new Error('[onboarding] `steps` must contain at least one step.');
  }

  const initial = useMemo(
    () => buildInitialState(steps, initialData),
    // initialData is only consumed once on mount, by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [steps],
  );
  const [state, dispatch] = useReducer(reducer, initial);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep = steps[state.stepIndex] as TSteps[number];
  const currentData: StepData = state.data[currentStep.id] ?? {};
  const currentErrors: FieldErrors = state.errors[currentStep.id] ?? {};
  const isFirst = state.stepIndex === 0;
  const isLast = state.stepIndex === steps.length - 1;

  const setCurrentStepData = useCallback(
    (next: StepData) => {
      dispatch({ type: 'SET_STEP_DATA', stepId: currentStep.id, data: next });
      if (state.errors[currentStep.id]) {
        dispatch({ type: 'CLEAR_STEP_ERRORS', stepId: currentStep.id });
      }
    },
    [currentStep.id, state.errors],
  );

  const back = useCallback(() => {
    if (isFirst || isSubmitting) return;
    dispatch({ type: 'GO_TO', stepIndex: state.stepIndex - 1 });
  }, [isFirst, isSubmitting, state.stepIndex]);

  const attemptNext = useCallback(async (): Promise<void> => {
    if (isSubmitting) return;
    const stepToValidate = steps[state.stepIndex] as OnboardingStep;
    const stepData = state.data[stepToValidate.id] ?? {};
    const result = stepToValidate.schema.safeParse(stepData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0];
        if (typeof path === 'string' && fieldErrors[path] === undefined) {
          fieldErrors[path] = issue.message;
        }
      }
      dispatch({ type: 'SET_STEP_ERRORS', stepId: stepToValidate.id, errors: fieldErrors });
      return;
    }

    dispatch({ type: 'CLEAR_STEP_ERRORS', stepId: stepToValidate.id });
    dispatch({ type: 'SET_STEP_DATA', stepId: stepToValidate.id, data: result.data as StepData });

    if (state.stepIndex < steps.length - 1) {
      dispatch({ type: 'GO_TO', stepIndex: state.stepIndex + 1 });
      return;
    }

    const aggregated: Record<string, unknown> = { ...state.data, [stepToValidate.id]: result.data };
    setIsSubmitting(true);
    try {
      await onComplete(aggregated as AggregatedData<TSteps>);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, onComplete, state.data, state.stepIndex, steps]);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET', initial });
  }, [initial]);

  return {
    state,
    steps,
    currentStep,
    currentData,
    currentErrors,
    stepIndex: state.stepIndex,
    isFirst,
    isLast,
    isSubmitting,
    setCurrentStepData,
    back,
    attemptNext,
    reset,
  };
}
