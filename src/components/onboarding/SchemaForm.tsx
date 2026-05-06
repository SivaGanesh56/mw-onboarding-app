import { Stack } from '@mui/material';
import { useMemo } from 'react';
import type { JSX } from 'react';

import type { AnyZodObject, FieldDescriptor, FieldErrors, StepData, UiSchema, WidgetRegistry } from './types';
import { defaultRegistry } from './widgets/defaultRegistry';
import { zodToFields } from './zodToFields';

export interface SchemaFormProps {
  readonly schema: AnyZodObject;
  readonly uiSchema?: UiSchema;
  readonly value: StepData;
  readonly errors?: FieldErrors;
  readonly disabled?: boolean;
  readonly registry?: Partial<WidgetRegistry>;
  readonly onChange: (next: StepData) => void;
  readonly onFieldBlur?: (fieldName: string) => void;
}

/**
 * Pure controlled, schema-driven form. Owns no state – the parent decides what
 * to do with field changes (typically a reducer that also drives navigation).
 *
 * `uiSchema` is the only escape hatch from the Zod-driven defaults: it can
 * override the widget kind on a per-field basis. Anything else (label, helper
 * text, options, required flag) still flows from the schema.
 */
export function SchemaForm({
  schema,
  uiSchema,
  value,
  errors,
  disabled,
  registry,
  onChange,
  onFieldBlur,
}: SchemaFormProps): JSX.Element {
  const fields = useMemo<ReadonlyArray<FieldDescriptor>>(() => {
    const base = zodToFields(schema);
    if (!uiSchema) return base;
    return base.map((field) => {
      const override = uiSchema[field.name];
      if (override?.widget && override.widget !== field.kind) {
        return { ...field, kind: override.widget };
      }
      return field;
    });
  }, [schema, uiSchema]);

  const resolvedRegistry: WidgetRegistry = useMemo(
    () => ({ ...defaultRegistry, ...registry }),
    [registry],
  );

  const setField = (name: string, next: unknown): void => {
    const updated = { ...value, [name]: next };
    if (next === undefined) {
      delete (updated as Record<string, unknown>)[name];
    }
    onChange(updated);
  };

  return (
    <Stack spacing={2.5} component="form" noValidate>
      {fields.map((descriptor) => {
        const Widget = resolvedRegistry[descriptor.kind];
        return (
          <Widget
            key={descriptor.name}
            descriptor={descriptor}
            value={value[descriptor.name]}
            error={errors?.[descriptor.name]}
            onChange={(next) => setField(descriptor.name, next)}
            onBlur={onFieldBlur ? () => onFieldBlur(descriptor.name) : undefined}
            disabled={disabled}
          />
        );
      })}
    </Stack>
  );
}
