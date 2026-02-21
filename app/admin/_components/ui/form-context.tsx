import {createFormHook, createFormHookContexts} from '@tanstack/react-form'
import {
  NumberField,
  SelectField,
  SelectWithCustomField,
  SwitchField,
  TextAreaField,
  TextField,
} from './fields'

// export useFieldContext for use in your custom components
export const {fieldContext, formContext, useFieldContext} =
  createFormHookContexts()

export const {useAppForm} = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    NumberField,
    TextAreaField,
    SelectField,
    SelectWithCustomField,
    SwitchField,
  },
  formComponents: {},
})

// Export a type helper for form API
// This matches the TanStack Form composition pattern
// Note: This is a simplified type - actual form instances will have more methods
export type AppFormApi<TFormValues> = ReturnType<
  typeof useAppForm
> extends (config: {defaultValues: TFormValues}) => infer R
  ? R
  : never
