import { z } from 'zod'

const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i

export const groupHikeSchema = z
  .object({
    title: z
      .string()
      .min(3, 'Title must be at least 3 characters')
      .max(255, 'Title must be 255 characters or less'),
    slug: z
      .string()
      .max(255, 'Slug must be 255 characters or less')
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens only')
      .optional()
      .or(z.literal('')),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters'),
    short_description: z
      .string()
      .max(500, 'Short description must be 500 characters or less')
      .optional()
      .or(z.literal('')),
    location_type: z.enum(['trail', 'custom']),
    trail_id: z.number().nullable(),
    custom_location_name: z.string().max(255).optional().or(z.literal('')),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    region_id: z.number().nullable(),
    difficulty: z.enum(['easy', 'moderate', 'difficult', 'expert']).nullable(),
    meeting_point: z.string().optional().or(z.literal('')),
    start_date: z.string().min(1, 'Start date is required'),
    start_time: z.string().min(1, 'Start time is required'),
    is_multi_day: z.boolean(),
    end_date: z.string().optional().or(z.literal('')),
    end_time: z.string().optional().or(z.literal('')),
    max_participants: z.number().min(1, 'Must be at least 1').nullable().optional(),
    registration_url: z
      .string()
      .refine((v) => !v || urlRegex.test(v), 'Must be a valid URL')
      .optional()
      .or(z.literal('')),
    registration_deadline: z.string().optional().or(z.literal('')),
    registration_notes: z.string().optional().or(z.literal('')),
    is_free: z.boolean(),
    price: z.number().min(0, 'Price cannot be negative').nullable(),
    price_currency: z.string().length(3, 'Currency must be 3 characters'),
    price_notes: z.string().max(500).optional().or(z.literal('')),
    contact_name: z.string().max(255).optional().or(z.literal('')),
    contact_email: z
      .string()
      .email('Must be a valid email')
      .optional()
      .or(z.literal('')),
    contact_phone: z.string().max(50).optional().or(z.literal('')),
    contact_whatsapp: z.string().max(50).optional().or(z.literal('')),
    featured_image_id: z.number().nullable().optional(),
    is_featured: z.boolean(),
    is_recurring: z.boolean(),
    recurring_notes: z.string().max(255).optional().or(z.literal('')),
  })
  .check(
    z.refine(
      (data) => {
        if (data.location_type === 'trail') return data.trail_id !== null
        return true
      },
      { message: 'Trail is required for trail locations', path: ['trail_id'] },
    ),
  )
  .check(
    z.refine(
      (data) => {
        if (data.location_type === 'custom') {
          return data.custom_location_name && data.custom_location_name.length > 0
        }
        return true
      },
      { message: 'Location name is required for custom locations', path: ['custom_location_name'] },
    ),
  )
  .check(
    z.refine(
      (data) => {
        if (data.location_type === 'custom') return data.region_id !== null
        return true
      },
      { message: 'Region is required for custom locations', path: ['region_id'] },
    ),
  )
  .check(
    z.refine(
      (data) => {
        if (data.location_type === 'custom') return data.difficulty !== null
        return true
      },
      { message: 'Difficulty is required for custom locations', path: ['difficulty'] },
    ),
  )
  .check(
    z.refine(
      (data) => {
        if (data.is_multi_day) return data.end_date && data.end_date.length > 0
        return true
      },
      { message: 'End date is required for multi-day hikes', path: ['end_date'] },
    ),
  )
  .check(
    z.refine(
      (data) => {
        if (!data.is_free) return data.price !== null && data.price >= 0
        return true
      },
      { message: 'Price is required for paid hikes', path: ['price'] },
    ),
  )
  .check(
    z.refine(
      (data) => {
        if (data.is_recurring) {
          return data.recurring_notes && data.recurring_notes.length > 0
        }
        return true
      },
      { message: 'Recurring notes are required when recurring is enabled', path: ['recurring_notes'] },
    ),
  )

export const draftGroupHikeSchema = z.object({
  title: z.string().min(1, 'Title is required to save a draft'),
})

export function validateGroupHike(data: unknown): Record<string, string> {
  const result = groupHikeSchema.safeParse(data)
  if (result.success) return {}
  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const path = issue.path.join('.')
    if (path && !errors[path]) {
      errors[path] = issue.message
    }
  }
  return errors
}

export function validateDraftGroupHike(data: unknown): Record<string, string> {
  const result = draftGroupHikeSchema.safeParse(data)
  if (result.success) return {}
  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const path = issue.path.join('.')
    if (path && !errors[path]) {
      errors[path] = issue.message
    }
  }
  return errors
}
