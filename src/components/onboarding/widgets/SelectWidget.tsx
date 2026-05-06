import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import type { JSX } from 'react';

import type { WidgetProps } from '../types';

export function SelectWidget({ descriptor, value, error, onChange, onBlur, disabled }: WidgetProps<string | number>): JSX.Element {
  const labelId = `${descriptor.name}-label`;
  const options = descriptor.options ?? [];

  const handleChange = (e: SelectChangeEvent<string | number>): void => {
    const next = e.target.value;
    if (next === '' || next === undefined || next === null) {
      onChange(undefined);
      return;
    }
    onChange(next);
  };

  return (
    <FormControl fullWidth required={descriptor.required} error={Boolean(error)} disabled={disabled}>
      <InputLabel id={labelId}>{descriptor.label}</InputLabel>
      <Select
        labelId={labelId}
        label={descriptor.label}
        value={value ?? ''}
        onChange={handleChange}
        onBlur={onBlur}
      >
        {options.map((opt) => (
          <MenuItem key={String(opt.value)} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
      {error ? (
        <FormHelperText>{error ?? descriptor.helperText}</FormHelperText>
      ) : null}
    </FormControl>
  );
}
