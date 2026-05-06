import { Box, Button, Chip, FormControl, FormHelperText, FormLabel, Stack, TextField } from '@mui/material';
import { useState } from 'react';
import type { ChangeEvent, JSX, KeyboardEvent } from 'react';

import type { WidgetProps } from '../types';

/**
 * Free-form tag input. User types a value, hits Enter or clicks "Add", and the
 * value joins the chip list below. Each chip is removable via its delete icon.
 *
 * Mapped to from `z.array(z.string())`. Whitespace-only entries and duplicates
 * are silently rejected client-side; everything else (length, count) is left
 * to Zod via the schema.
 */
export function TagsWidget({
  descriptor,
  value,
  error,
  onChange,
  disabled,
}: WidgetProps<ReadonlyArray<string>>): JSX.Element {
  const tags = Array.isArray(value) ? value : [];
  const [draft, setDraft] = useState('');

  const commit = (): void => {
    const trimmed = draft.trim();
    if (trimmed.length === 0) return;
    if (tags.includes(trimmed)) {
      setDraft('');
      return;
    }
    onChange([...tags, trimmed]);
    setDraft('');
  };

  const remove = (tag: string): void => {
    const next = tags.filter((t) => t !== tag);
    onChange(next.length === 0 ? undefined : next);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    }
  };

  const handleDraftChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    setDraft(e.target.value);
  };

  return (
    <FormControl
      component="fieldset"
      error={Boolean(error)}
      required={descriptor.required}
      disabled={disabled}
      fullWidth
    >
      <FormLabel component="legend" sx={{ mb: 1 }}>
        {descriptor.label}
      </FormLabel>

      <Stack direction="row" spacing={1}>
        <TextField
          fullWidth
          size="small"
          placeholder={`Enter ${descriptor.label}`}
          value={draft}
          onChange={handleDraftChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          error={Boolean(error)}
        />
        <Button
          variant="contained"
          onClick={commit}
          disabled={disabled || draft.trim().length === 0}
          sx={{ flexShrink: 0 }}
        >
          Add
        </Button>
      </Stack>

      {tags.length > 0 ? (
        <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              variant="outlined"
              onDelete={disabled ? undefined : () => remove(tag)}
            />
          ))}
        </Box>
      ) : null}

      {(error ?? descriptor.helperText) !== undefined ? (
        <FormHelperText sx={{ mt: 1 }}>{error ?? descriptor.helperText}</FormHelperText>
      ) : null}
    </FormControl>
  );
}
