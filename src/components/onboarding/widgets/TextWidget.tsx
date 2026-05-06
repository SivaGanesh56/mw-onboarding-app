import { TextField } from '@mui/material';
import type { ChangeEvent, JSX } from 'react';

import type { WidgetProps } from '../types';

export function TextWidget({ descriptor, value, error, onChange, onBlur, disabled }: WidgetProps<string>): JSX.Element {
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const next = e.target.value;
    onChange(next.length === 0 ? undefined : next);
  };

  return (
    <TextField
      fullWidth
      type={descriptor.kind === 'email' ? 'email' : 'text'}
      label={descriptor.label}
      required={descriptor.required}
      value={value ?? ''}
      onChange={handleChange}
      onBlur={onBlur}
      error={Boolean(error)}
      helperText={error}
      disabled={disabled}
      slotProps={{
        htmlInput: {
          minLength: descriptor.min,
          maxLength: descriptor.max,
        },
      }}
    />
  );
}
