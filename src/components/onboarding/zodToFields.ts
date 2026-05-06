import { z } from 'zod';

import type { AnyZodObject, FieldDescriptor, SelectOption, WidgetKind } from './types';

/**
 * Convert a `camelCase` / `snake_case` field key into a human readable label.
 * Examples: `fullName` → "Full name", `email_address` → "Email address".
 */
export function humanizeKey(key: string): string {
  if (key.length === 0) return key;
  const spaced = key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

interface JSONSchemaProperty {
  readonly type?: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null';
  readonly format?: string;
  readonly description?: string;
  readonly enum?: ReadonlyArray<string | number | boolean | null>;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly minItems?: number;
  readonly maxItems?: number;
  readonly items?: JSONSchemaProperty;
  readonly anyOf?: ReadonlyArray<JSONSchemaProperty>;
  readonly oneOf?: ReadonlyArray<JSONSchemaProperty>;
  readonly default?: unknown;
}

interface JSONSchemaObject {
  readonly type?: 'object';
  readonly properties?: Readonly<Record<string, JSONSchemaProperty>>;
  readonly required?: ReadonlyArray<string>;
}

/**
 * Walk anyOf/oneOf compositions and return the first non-null branch.
 * `z.string().nullable()` becomes `{ anyOf: [{ type: 'string' }, { type: 'null' }] }`
 * in the generated JSON Schema – we treat nullable like optional for rendering.
 */
function unwrapNullable(prop: JSONSchemaProperty): JSONSchemaProperty {
  const branches = prop.anyOf ?? prop.oneOf;
  if (!branches || branches.length === 0) return prop;
  const nonNull = branches.find((b) => b.type !== 'null');
  return nonNull ?? prop;
}

function resolveWidgetKind(prop: JSONSchemaProperty, fieldKey: string): WidgetKind {
  if (Array.isArray(prop.enum) && prop.enum.length > 0) {
    return 'select';
  }
  switch (prop.type) {
    case 'string':
      return prop.format === 'email' ? 'email' : 'text';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'checkbox';
    case 'array':
      if (prop.items && Array.isArray(prop.items.enum) && prop.items.enum.length > 0) {
        return 'multiCheckbox';
      }
      if (prop.items && prop.items.type === 'string') {
        return 'tags';
      }
      throw new Error(
        `[onboarding] Array field "${fieldKey}" must contain strings or enums. ` +
          `Use z.array(z.enum([...])) for a multi-checkbox group, or z.array(z.string()) for free-form tags.`,
      );
    default:
      throw new Error(
        `[onboarding] Unsupported JSON Schema type "${String(prop.type)}" for field "${fieldKey}". ` +
          `Supported Zod types: string, number, integer, boolean, enum, nativeEnum, array(enum).`,
      );
  }
}

function enumToOptions(values: ReadonlyArray<string | number | boolean | null>): ReadonlyArray<SelectOption> {
  return values
    .filter((v): v is string | number => v !== null && typeof v !== 'boolean')
    .map((value) => ({ value, label: typeof value === 'string' ? humanizeKey(value) : String(value) }));
}

function buildOptions(prop: JSONSchemaProperty): ReadonlyArray<SelectOption> | undefined {
  if (Array.isArray(prop.enum) && prop.enum.length > 0) {
    return enumToOptions(prop.enum);
  }
  if (prop.type === 'array' && prop.items && Array.isArray(prop.items.enum) && prop.items.enum.length > 0) {
    return enumToOptions(prop.items.enum);
  }
  return undefined;
}

/**
 * Derive `FieldDescriptor[]` from a Zod object schema.
 *
 * Internally uses `z.toJSONSchema` (Zod 4 built-in) so we never depend on
 * private internals like `_def`. Iteration order follows the JSON Schema's
 * `properties` object, which preserves the definition order Zod uses.
 *
 * Throws on unsupported Zod types (arrays, nested objects, unions of multiple
 * non-null branches, etc.) so v1 fails loudly instead of silently dropping
 * fields.
 */
export function zodToFields(schema: AnyZodObject): ReadonlyArray<FieldDescriptor> {
  const json = z.toJSONSchema(schema, { unrepresentable: 'any' }) as JSONSchemaObject;

  if (json.type !== 'object' || !json.properties) {
    throw new Error('[onboarding] Step schema must be a z.object({...}) at the top level.');
  }

  const required = new Set<string>(json.required ?? []);
  const descriptors: FieldDescriptor[] = [];

  for (const [name, rawProp] of Object.entries(json.properties)) {
    const prop = unwrapNullable(rawProp);
    const kind = resolveWidgetKind(prop, name);
    const descriptor: FieldDescriptor = {
      name,
      kind,
      label: humanizeKey(name),
      required: required.has(name),
      helperText: prop.description,
      options: buildOptions(prop),
      min: prop.minimum ?? prop.minLength ?? prop.minItems,
      max: prop.maximum ?? prop.maxLength ?? prop.maxItems,
    };
    descriptors.push(descriptor);
  }

  return descriptors;
}
