import type { ComponentType } from 'react';

import type { WidgetProps, WidgetRegistry } from '../types';
import { CheckboxWidget } from './CheckboxWidget';
import { MultiCheckboxWidget } from './MultiCheckboxWidget';
import { NumberWidget } from './NumberWidget';
import { SelectWidget } from './SelectWidget';
import { TagsWidget } from './TagsWidget';
import { TextWidget } from './TextWidget';

/**
 * Cast helper – every widget is parametrised by its expected value type, but
 * the registry is keyed by `WidgetKind` and operates on `unknown`. The runtime
 * dispatch in `SchemaForm` already guarantees the correct widget receives the
 * correct value type for its `WidgetKind`.
 */
const asWidget = <T,>(component: ComponentType<WidgetProps<T>>): ComponentType<WidgetProps> =>
  component as unknown as ComponentType<WidgetProps>;

export const defaultRegistry: WidgetRegistry = Object.freeze({
  text: asWidget<string>(TextWidget),
  email: asWidget<string>(TextWidget),
  number: asWidget<number>(NumberWidget),
  select: asWidget<string | number>(SelectWidget),
  checkbox: asWidget<boolean>(CheckboxWidget),
  multiCheckbox: asWidget<ReadonlyArray<string | number>>(MultiCheckboxWidget),
  tags: asWidget<ReadonlyArray<string>>(TagsWidget),
});
