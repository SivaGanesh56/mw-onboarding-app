import { Checkbox, FormControl, FormControlLabel, FormGroup, FormHelperText, FormLabel } from '@mui/material';
import type { ChangeEvent, JSX } from 'react';

import type { OptionValue, WidgetProps } from '../types';

/**
 * Renders an enum array (`z.array(z.enum([...]))`) as a row of independent
 * checkboxes. Value is the array of currently selected option values; an
 * empty selection is emitted as `undefined` so optional/required validation
 * stays in Zod's hands rather than depending on widget heuristics.
 */
export function MultiCheckboxWidget({
  descriptor,
  value,
  error,
  onChange,
  onBlur,
  disabled,
}: WidgetProps<ReadonlyArray<OptionValue>>): JSX.Element {
  const options = descriptor.options ?? [];
  const selected = new Set<OptionValue>(Array.isArray(value) ? value : []);

  const toggle =
    (optionValue: OptionValue) =>
    (_e: ChangeEvent<HTMLInputElement>, checked: boolean): void => {
      const next = new Set(selected);
      if (checked) next.add(optionValue);
      else next.delete(optionValue);
      const ordered = options.map((o) => o.value).filter((v) => next.has(v));
      onChange(ordered.length === 0 ? undefined : ordered);
    };

  return (
    <FormControl
      component="fieldset"
      error={Boolean(error)}
      required={descriptor.required}
      disabled={disabled}
      onBlur={onBlur}
    >
      <FormLabel component="legend">{descriptor.label}</FormLabel>
      <FormGroup row>
        {options.map((opt) => (
          <FormControlLabel
            key={String(opt.value)}
            control={
              <Checkbox checked={selected.has(opt.value)} onChange={toggle(opt.value)} />
            }
            label={opt.label}
          />
        ))}
      </FormGroup>
      {error !== undefined ? (
        <FormHelperText>{error ?? descriptor.helperText}</FormHelperText>
      ) : null}
    </FormControl>
  );
}
