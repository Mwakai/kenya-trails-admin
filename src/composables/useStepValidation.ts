import type { z } from 'zod'

type Schema = z.ZodType

export function useStepValidation() {
  function validate(
    schema: Schema | null,
    data: Record<string, unknown>,
  ): Record<string, string> {
    if (!schema) return {}

    const result = schema.safeParse(data)
    if (result.success) return {}

    const errors: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const path = issue.path.join('.')
      if (!errors[path]) {
        errors[path] = issue.message
      }
    }
    return errors
  }

  return { validate }
}
