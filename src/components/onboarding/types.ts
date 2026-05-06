import type { ComponentType } from 'react';
import type { z } from 'zod';

export type WidgetKind =
  | 'text'
  | 'email'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'multiCheckbox'
  | 'tags';

export type OptionValue = string | number;

export interface SelectOption {
  readonly label: string;
  readonly value: OptionValue;
}

export interface FieldDescriptor {
  readonly name: string;
  readonly kind: WidgetKind;
  readonly label: string;
  readonly required: boolean;
  readonly helperText?: string;
  /**
   * Options are always primitive (string|number). A widget composes them into
   * its own value shape (e.g. multiCheckbox emits `OptionValue[]`).
   */
  readonly options?: ReadonlyArray<SelectOption>;
  readonly min?: number;
  readonly max?: number;
}

export interface WidgetProps<TValue = unknown> {
  readonly descriptor: FieldDescriptor;
  readonly value: TValue | undefined;
  readonly error?: string;
  readonly onChange: (next: TValue | undefined) => void;
  readonly onBlur?: () => void;
  readonly disabled?: boolean;
}

export type WidgetRegistry = Readonly<Record<WidgetKind, ComponentType<WidgetProps>>>;

export type StepData = Readonly<Record<string, unknown>>;

/**
 * A Zod object schema is the only way to describe a step. Each property of the
 * object becomes a form field. Field presentation (label, helper text, widget
 * kind) is derived directly from the schema, with optional per-field overrides
 * via `uiSchema`.
 *
 * Conventions consumed by `zodToFields`:
 *  - Field label is derived from the key (e.g. `fullName` → "Full name").
 *  - `z.string().describe('...')` populates helper text.
 *  - `z.string().email()` selects the `email` widget.
 *  - `z.enum([...])` / `z.nativeEnum(...)` selects the `select` widget.
 *  - `z.array(z.enum([...]))` selects the `multiCheckbox` widget.
 *  - `z.optional(...)` / `z.default(...)` mark the field non-required.
 */
export type AnyZodObject = z.ZodObject<z.ZodRawShape>;

/**
 * Per-field UI overrides. Intentionally minimal in v1 – only the widget kind
 * can be overridden, for cases where two schema shapes share a Zod type but
 * need different presentation (e.g. `z.array(z.string())` rendered as `tags`
 * instead of erroring out). New override keys can be added later without
 * breaking existing consumers.
 */
export interface UiSchemaField {
  readonly widget?: WidgetKind;
}

export type UiSchema = Readonly<Record<string, UiSchemaField>>;

export interface OnboardingStep<TSchema extends AnyZodObject = AnyZodObject> {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly schema: TSchema;
  readonly uiSchema?: UiSchema;
}

export type OnboardingSteps = ReadonlyArray<OnboardingStep>;

/**
 * Maps a tuple of steps to `{ [stepId]: z.infer<step.schema> }` so consumers
 * get a fully typed payload at the end of the flow.
 */
export type AggregatedData<TSteps extends OnboardingSteps> = {
  readonly [K in TSteps[number] as K['id']]: z.infer<K['schema']>;
};

export interface OnboardingFlowProps<TSteps extends OnboardingSteps> {
  readonly steps: TSteps;
  readonly onComplete: (data: AggregatedData<TSteps>) => void | Promise<void>;
  readonly initialData?: Partial<AggregatedData<TSteps>>;
  readonly registry?: Partial<WidgetRegistry>;
}

export type FieldErrors = Readonly<Record<string, string>>;
