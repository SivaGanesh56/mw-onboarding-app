# Onboarding flow feature design
_Exported on 5/6/2026 at 18:20:11 GMT+5:30 from Cursor (2.5.20)_

---

**User**

hey, we're building onboarding flow feature which should be extendable, generic and easy to build multiple steps in the flow. data should be presisted between the steps, we shouldn't allow user to move it to next step till current step validation passes. use open source libraries for form elements (like shadcn since we have tailwind) or maybe material ui if wiring is easy. 

inspire logic from react-json-schema-form. propose a plan and ask more questions if there is any in the implementation.

follow strict types, code quality 

---

**Cursor**

I've scanned the repo — it's a fresh CRA + React 19 + TypeScript + Tailwind project with essentially no code yet (`src/App.tsx` is just a hello-world). Before I draft the plan, I need to lock down two architectural choices that significantly change the design.

I have what I need. Drafting the plan now.

---

**User**

uischema seems overkill at this point, we don't need this Create src/examples/accountOnboarding.tsx with a 3-step demo flow (demo not required)

no backend wiring for now but expose final submit

---

**Cursor**

Got it. Updating the plan: drop `uiSchema` (defaults derived from Zod alone), skip the demo file and `App.tsx` wiring, and call out `onComplete` as the public submit hook.

Plan updated. Key changes:

- **Dropped `uiSchema`** entirely from the public API. `FieldDescriptor` is derived purely from the Zod schema: label is humanized from the field key, `helperText` from `z.describe()`, widget kind from the Zod type, `required` from absence of `ZodOptional`/`ZodDefault`. The `WidgetRegistry` remains the extension seam.
- **Removed the demo file and `App.tsx` wiring** todos. `src/onboarding/` is delivered as a self-contained module; `src/App.tsx` is left untouched.
- **Final submit is exposed via `onComplete`** with a strongly-typed aggregated payload:

```ts
export type AggregatedData<TSteps extends ReadonlyArray<OnboardingStep>> = {
  [K in TSteps[number] as K['id']]: z.infer<K['schema']>;
};

onComplete: (data: AggregatedData<TSteps>) => void | Promise<void>;
```

  Returning `void | Promise<void>` means a backend call can be slotted in later (`await fetch(...)`) without a framework change.
- Trimmed widgets to the minimum needed without `uiSchema` overrides: `Text`, `Number`, `Select`, `Checkbox` (Radio/TextArea dropped — they were only useful as `uiSchema` overrides).

Want me to start executing, or any further adjustments to the plan?

---

**User**

prefect, lets start

---

**Cursor**

Dev server is already running on terminal 2. Installing dependencies now.

Now updating tsconfig and creating the framework files.

Now the core types module.

Now the MUI widgets.

Let me check for lint/type errors before running the full build.

Zod 4 uses TypeScript 5.x syntax (`const T` generics). The project has TS 4.9.5 which can't parse the `.d.cts` files. Upgrading TypeScript.

Fixing the React 19 JSX import, MUI v9 `slotProps`, and Stack `sx` issues.

TypeScript compiles cleanly. Verifying linting and the dev server picked up changes.

Framework is in place. `tsc --noEmit` passes cleanly with strict mode + `noUncheckedIndexedAccess`, no lint errors, and the dev server reports "No issues found".

## What was built

The onboarding framework now lives self-contained under `src/onboarding/`. `src/App.tsx` was left untouched as agreed.

**Public API** (`src/onboarding/index.ts`):
- `OnboardingFlow` — the only component a consumer needs to render.
- `useOnboarding` — exposed for consumers who want to build a custom shell.
- `SchemaForm`, `StepRenderer`, `defaultRegistry`, `zodToFields`, `humanizeKey` — composable building blocks for advanced cases.
- All public types: `OnboardingStep`, `OnboardingSteps`, `OnboardingFlowProps`, `AggregatedData`, `WidgetProps`, `WidgetRegistry`, `WidgetKind`, `FieldDescriptor`, `FieldErrors`, `StepData`, `SelectOption`, `AnyZodObject`.

**Files added**:

```1:34:src/onboarding/index.ts
export { OnboardingFlow } from './OnboardingFlow';
export { SchemaForm } from './SchemaForm';
export { StepRenderer } from './StepRenderer';
export { useOnboarding } from './useOnboarding';
export { zodToFields, humanizeKey } from './zodToFields';
export { defaultRegistry } from './widgets/defaultRegistry';
```

## How a consumer wires it up

```tsx
import { z } from 'zod';
import { OnboardingFlow, type OnboardingStep } from './onboarding';

const steps = [
  {
    id: 'account',
    title: 'Account',
    description: 'Tell us how to reach you.',
    schema: z.object({
      email: z.email().describe('We will never share this'),
      password: z.string().min(8, 'At least 8 characters'),
    }),
  },
  {
    id: 'profile',
    title: 'Profile',
    schema: z.object({
      fullName: z.string().min(1),
      age: z.number().min(13).max(120),
      role: z.enum(['admin', 'editor', 'viewer']),
    }),
  },
] as const satisfies ReadonlyArray<OnboardingStep>;

<OnboardingFlow
  steps={steps}
  onComplete={async (data) => {
    // data is fully typed: { account: {...}, profile: {...} }
    await fetch('/api/onboard', { method: 'POST', body: JSON.stringify(data) });
  }}
/>
```

## Notable implementation choices

- **No Zod internals**. `zodToFields` calls Zod 4's official `z.toJSONSchema()` and walks the resulting JSON Schema, so we depend on a public, stable contract instead of `_def`.
- **Strict generics, no `any`**. `AggregatedData<TSteps>` is a mapped type that derives `{ [stepId]: z.infer<schema> }` from the steps tuple, so `onComplete`'s payload is fully inferred.
- **Validation gate**. `useOnboarding.attemptNext` runs `currentStep.schema.safeParse(stepData)`. On failure it stores per-field errors and refuses to advance; on success on the last step it awaits `onComplete` (with `isSubmitting` disabling buttons).
- **Extension seam**. The `WidgetRegistry` (`Record<WidgetKind, ComponentType<WidgetProps>>`) lets consumers override individual widgets via the `registry` prop without forking the framework — that's where uiSchema-style overrides will plug in if needed later.

## Two unplanned upgrades I made along the way

1. **TypeScript 4.9.5 → ^5.6** (saved as a devDependency). Zod 4's `.d.cts` files use TS 5.x generics syntax (`<const T>`), so the older compiler couldn't parse them. CRA 5 has only an optional peer dep on TS, so this works fine — just an `npm warn` about the peer range.
2. **MUI v9 API adjustments**. v9 dropped `inputProps` in favor of `slotProps.htmlInput`, and removed flexbox shorthand props (`justifyContent`) from `Stack` in favor of `sx`. Both adjusted in the widgets/`StepRenderer`.

Ready for you to take it for a spin or add a demo page when you're ready.

---

**User**

@src/App.tsx add an example here

---

**Cursor**

The dev server is still running with the old TS compiler from before the upgrade. Restarting it.

---

**User**

update example for step2, where user can have multi checboxes and choose one of the them

something like this

---

**Cursor**

Got it. I'll add a multi-checkbox widget so step 2 can include "pick one or more interests" like in your reference image.

Now `zodToFields.ts` to detect `array of enum`.

Now updating step 2 in `App.tsx` to include the multi-checkbox interests field.

The `SelectOption` value type was tied to the widget's full value type, which fails for multi-select where the field value is an array. Decoupling option values from the widget value.

Done. Type-check is clean.

## What changed

**New widget kind** `multiCheckbox` end-to-end:

- `types.ts`: added `'multiCheckbox'` to `WidgetKind`. Also extracted `OptionValue = string | number` and decoupled `SelectOption` / `FieldDescriptor` from the widget's value type — needed because the multi-checkbox's value is `OptionValue[]` while each option's value is just `OptionValue`.
- `zodToFields.ts`: detects `type: 'array'` with `items.enum` and emits `kind: 'multiCheckbox'` plus options derived from `items.enum`. Throws if you pass a `z.array(...)` of anything other than an enum (so the v1 contract stays honest).
- `widgets/MultiCheckboxWidget.tsx`: MUI `FormControl` + `FormGroup row` with one `Checkbox` per option. Selection order matches the schema's enum order; an empty selection is emitted as `undefined` so `.min(1, ...)` validation lives entirely in Zod.
- `widgets/defaultRegistry.ts`: wired in the new widget.
- `index.ts`: exports the new `OptionValue` type.

**Example update** — step 2 (`profileStep`) now has the field you mocked:

```47:50:src/App.tsx
    interests: z
      .array(z.enum(['lifestyle', 'beauty', 'food', 'tech', 'travel']))
      .min(1, 'Pick at least one')
      .describe('Choose any that apply'),
```

When the user lands on step 2 they'll see the row of checkboxes (Lifestyle, Beauty, Food, Tech, Travel). If they hit "Next" with nothing selected, Zod's `"Pick at least one"` error renders inline and navigation is blocked — same gate as every other field.

Reload the dev server (it was killed earlier) when you want to see it in the browser.

---

**User**

cool, now we need to add one more widget.

user can choose multiple brands here. any questions to me

---

**Cursor**

Yes, a couple before I build it:

---

**User**

continue

---

**Cursor**

Now updating `zodToFields` to also map `z.array(z.string())` → `tags` (and let uiSchema override anything else later).

Now thread `uiSchema` through `SchemaForm` and `StepRenderer`.

Now export `UiSchema` from the barrel and update the example.

Done. Type-check is clean.

## What changed

**New `tags` widget**:
- `widgets/TagsWidget.tsx` — MUI `TextField` + `Button` + removable `Chip` row. Enter or "Add" commits a trimmed entry; whitespace-only and duplicate entries are silently dropped client-side; everything else (count, length) stays in Zod's hands. Empty list emits `undefined` so `.min(1, ...)` validation triggers cleanly.
- Registered as `tags` in `defaultRegistry`.

**Schema mapping** in `zodToFields.ts`:
- `z.array(z.string())` now maps to `tags` (added alongside the existing `z.array(z.enum(...))` → `multiCheckbox` mapping).
- Error message updated to mention both array shapes.

**Lightweight `uiSchema`** (introduced as you asked, kept minimal):
- New `UiSchemaField = { widget?: WidgetKind }` and `UiSchema = Record<string, UiSchemaField>` in `types.ts`.
- `OnboardingStep` now has an optional `uiSchema?: UiSchema`.
- `SchemaForm` accepts `uiSchema` and merges per-field widget overrides on top of the Zod-derived defaults. Everything else (label, helper text, options, required) still flows from the schema.
- `StepRenderer` passes `step.uiSchema` through.
- `UiSchema` / `UiSchemaField` exported from the barrel.

This gives you two ways to get `tags`:
1. **Default** — just write `z.array(z.string())` and it renders as tags. This is what the example uses.
2. **Override** — for future cases where you want a different widget than the default, e.g. `uiSchema: { someField: { widget: 'tags' } }`.

**Example** (`App.tsx`) — added to the existing preferences step as you requested:

```36:42:src/App.tsx
    brands: z
      .array(z.string().min(1))
      .min(1, 'Add at least one brand')
      .describe('Brands you love'),
```

Below `plan` and `notifications`, step 3 will now show the brands input matching your mockup: text input with `Enter Brand Name` placeholder, "Add" button, and a wrapping row of outlined chips with delete icons. "Add at least one brand" surfaces inline if the user clicks Finish without adding any.

---

**User**

now build a proper demo of this flow
step1
now step2


wait, you don't need to follow exactly the same. just use form fields only for now and update example only

---

**Cursor**

Got it — example-only update. Let me look at the current App.tsx and supporting components first.

Updated. Type-check is clean.

## What changed

`src/App.tsx` — three steps now mirror the screenshots, using only widgets we already have:

1. **Welcome** — `name` text input
   ```ts
   schema: z.object({ name: z.string().min(1, 'Please tell us your name') })
   ```
2. **Your expertise** — multi-checkbox: Lifestyle, Beauty, Food
   ```ts
   schema: z.object({
     expertise: z.array(z.enum(['lifestyle', 'beauty', 'food'])).min(1, 'Pick at least one'),
   })
   ```
3. **One last thing** — brands tag input
   ```ts
   schema: z.object({
     brands: z.array(z.string().min(1)).min(1, 'Add at least one brand'),
   })
   ```

Also cleaned up the leftover dead `accountStep` / `profileStep` / `preferencesStep` / `step1` definitions and removed the redundant dependency on `setSubmitted`/`setFlowKey` in the `handleRestart` callback (they're stable setters).

A couple of intentional deviations from the screenshots, since you said not to follow them exactly and to update the example only:

- **Static step titles** — the screenshot's "Hi Noam!" is dynamic on the previous step's `name`. Our `OnboardingStep.title` is a static string in v1, so I used "Your expertise". Adding dynamic titles would mean changing the framework signature.
- **Stepper UI** — the screenshots show a "1/3 ... Next" footer pattern; we keep MUI's `<Stepper>` at the top with Back/Next at the bottom. Both convey the same information.

Both are framework-level changes and you asked me to leave the framework alone for now, so they're noted but not done.

---

**User**

cool, one last thing we need to build is submission review screen

leverage schema description maybe for this@src/components/SubmissionScreen.tsx 

---

**Cursor**

Got it — a proper review screen that walks each step's schema and renders a friendly summary, using each field's `.describe()` as the prose label. Let me check current state.

Now wire `steps` into `App.tsx` and tune the field descriptions so they read naturally on both the form and the review screen.

Same MUI v9 Stack issue from before — `alignItems` belongs in `sx`. Fixing both occurrences.

Done. Type-check is clean.

## How it works

`SubmissionScreen` now walks the original `steps` and uses the same `zodToFields` introspection as the form, so the review is purely schema-driven — no hand-written field lists, no JSON dump.

For each field it picks rendering based on the `WidgetKind` we already derive:

- `tags` / `multiCheckbox` → prose label from `.describe()` then a centered row of `Chip`s. For `multiCheckbox` the chip label is the humanized enum option (so `lifestyle` → "Lifestyle"), not the raw value.
- `checkbox` → "{prompt}: **Yes/No**".
- `text` / `email` / `number` / `select` → "{prompt}: **{value}**".

`promptFor(descriptor)` returns the field's `.describe()` text and falls back to the humanized label, so any new field reads sensibly even without a description. Empty/undefined values are filtered out via `isFilled`, and a step with no filled fields is skipped entirely.

## Changes summary

`src/components/SubmissionScreen.tsx`:
- New props: `{ steps, submitted, onClick }`.
- Imports `zodToFields` + `FieldDescriptor`/`OnboardingSteps` types from `./onboarding`.
- Removed the JSON `<pre>` dump and the success `Alert`; replaced with a centered, paper-card layout matching the rest of the flow.

`src/App.tsx`:
- Added review-friendly `.describe()` text to each field — they read as form helper text on the way in and as review prose on the way out:
  - `name.describe('You go by')`
  - `expertise.describe('You are an expert in')`
  - `brands.describe('You have worked with the following brands')`
- Passes `steps={steps}` to `SubmissionScreen` so it can introspect the same schemas the flow used.

So with the demo flow, after Finish you'll get:

> **All set!**  
> Here's a quick recap of what you told us.
>
> You go by: **Noam**  
> You are an expert in  
> [Lifestyle] [Beauty]  
> You have worked with the following brands  
> [Zara] [H&M]
>
> [Start over]

Add any new field to a step with a `.describe()` and it shows up in the review automatically.

