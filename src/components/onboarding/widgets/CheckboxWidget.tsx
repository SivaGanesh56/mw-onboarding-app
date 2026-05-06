import { Checkbox, FormControl, FormControlLabel, FormHelperText } from '@mui/material';
import type { ChangeEvent, JSX } from 'react';

import type { WidgetProps } from '../types';

export function CheckboxWidget({ descriptor, value, error, onChange, onBlur, disabled }: WidgetProps<boolean>): JSX.Element {
  const handleChange = (_e: ChangeEvent<HTMLInputElement>, checked: boolean): void => {
    onChange(checked);
  };

  return (
    <FormControl error={Boolean(error)} required={descriptor.required} disabled={disabled}>
      <FormControlLabel
        control={
          <Checkbox checked={value === true} onChange={handleChange} onBlur={onBlur} />
        }
        label={descriptor.label}
      />
      {error !== undefined ? (
        <FormHelperText>{error ?? descriptor.helperText}</FormHelperText>
      ) : null}
    </FormControl>
  );
}
