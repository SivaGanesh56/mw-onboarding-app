import { TextField } from '@mui/material';
import type { ChangeEvent, JSX } from 'react';

import type { WidgetProps } from '../types';

export function NumberWidget({ descriptor, value, error, onChange, onBlur, disabled }: WidgetProps<number>): JSX.Element {
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const raw = e.target.value;
    if (raw.length === 0) {
      onChange(undefined);
      return;
    }
    const parsed = Number(raw);
    onChange(Number.isFinite(parsed) ? parsed : undefined);
  };

  return (
    <TextField
      fullWidth
      type="number"
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
          min: descriptor.min,
          max: descriptor.max,
        },
      }}
    />
  );
}
