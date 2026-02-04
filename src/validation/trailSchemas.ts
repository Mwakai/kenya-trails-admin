import { z } from 'zod'

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

// Step 0: Basic Info
export const basicInfoSchema = z.object({
  name: z
    .string()
    .min(1, 'Trail name is required')
    .max(255, 'Trail name must be 255 characters or less'),
  short_description: z
    .string()
    .max(200, 'Short description must be 200 characters or less')
    .optional()
    .or(z.literal('')),
  description: z.string().check(
    z.refine((val) => {
      const stripped = stripHtml(val)
      return stripped.length >= 50
    }, 'Description must be at least 50 characters'),
  ),
})

// Step 1: Trail Stats
export const trailStatsSchema = z.object({
  difficulty: z.enum(['easy', 'moderate', 'difficult', 'expert'], {
    error: 'Difficulty is required',
  }),
  distance_km: z
    .number({ error: 'Distance must be a number' })
    .positive('Distance must be greater than 0'),
  duration_hours: z
    .number()
    .positive('Duration must be greater than 0')
    .nullable()
    .optional(),
  elevation_gain_m: z
    .number()
    .nonnegative('Elevation gain cannot be negative')
    .nullable()
    .optional(),
  max_altitude_m: z
    .number()
    .nonnegative('Max altitude cannot be negative')
    .nullable()
    .optional(),
})

// Step 2: Location
export const mapLocationSchema = z.object({
  latitude: z
    .number({ error: 'Latitude is required' })
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z
    .number({ error: 'Longitude is required' })
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  location_name: z.string().min(1, 'Location name is required'),
  county_id: z.number().positive().nullable().optional(),
  county_slug: z.string().min(1, 'County is required'),
})

// Step 3: Routes
const routeSchema = z.object({
  name: z.string().min(1, 'Route name is required'),
  directions: z.string().optional().or(z.literal('')),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  image_ids: z.array(z.number()).optional(),
})

export const routesSchema = z
  .object({
    route_a: routeSchema,
    route_b_enabled: z.boolean(),
    route_b: routeSchema.optional(),
  })
  .check(
    z.refine(
      (data) => {
        if (data.route_b_enabled && data.route_b) {
          return data.route_b.name.length > 0
        }
        return true
      },
      {
        message: 'Route B name is required when enabled',
        path: ['route_b', 'name'],
      },
    ),
  )

// Step 4: Media (only featured_image_id is required for publish)
export const mediaSchema = z.object({
  featured_image_id: z
    .number({ error: 'Featured image is required' })
    .positive('Featured image is required'),
})

// Draft schema - minimal validation for saving drafts
export const draftSchema = z.object({
  name: z.string().min(1, 'Trail name is required to save a draft'),
})

export const stepSchemas = [
  basicInfoSchema,
  trailStatsSchema,
  mapLocationSchema,
  routesSchema,
  mediaSchema,
  null, // Review step has no schema
] as const
