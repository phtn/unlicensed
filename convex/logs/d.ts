import {Infer, v} from 'convex/values'

// Log type enum
export const logTypeSchema = v.union(
  v.literal('page_visit'),
  v.literal('api_request'),
  v.literal('error'),
  v.literal('action'),
)

// Device type enum
export const deviceTypeSchema = v.union(
  v.literal('desktop'),
  v.literal('mobile'),
  v.literal('tablet'),
  v.literal('unknown'),
)

// Log schema
export const logSchema = v.object({
  // Log identification
  type: logTypeSchema,
  
  // Request information
  method: v.string(), // HTTP method (GET, POST, etc.)
  path: v.string(), // Request path
  fullUrl: v.optional(v.string()), // Full URL with query params
  queryParams: v.optional(v.record(v.string(), v.any())), // Query parameters as object
  
  // User information
  userId: v.optional(v.union(v.id('users'), v.null())), // User ID if authenticated
  sessionId: v.optional(v.string()), // Session identifier
  
  // Network information
  ipAddress: v.string(), // Client IP address
  userAgent: v.string(), // User agent string
  referrer: v.optional(v.string()), // Referrer URL
  origin: v.optional(v.string()), // Origin header
  
  // Device and browser information
  deviceType: v.optional(deviceTypeSchema),
  browser: v.optional(v.string()), // Browser name
  browserVersion: v.optional(v.string()), // Browser version
  os: v.optional(v.string()), // Operating system
  osVersion: v.optional(v.string()), // OS version
  screenWidth: v.optional(v.number()), // Screen width in pixels
  screenHeight: v.optional(v.number()), // Screen height in pixels
  
  // Geographic information (if available)
  country: v.optional(v.string()), // Country code
  region: v.optional(v.string()), // Region/state
  city: v.optional(v.string()), // City
  
  // Response information
  statusCode: v.optional(v.number()), // HTTP status code
  responseTime: v.optional(v.number()), // Response time in milliseconds
  
  // Additional metadata
  metadata: v.optional(v.record(v.string(), v.any())), // Flexible metadata object
  
  // Timestamps
  createdAt: v.number(), // Timestamp when log was created
})

export type LogType = Infer<typeof logTypeSchema>
export type DeviceType = Infer<typeof deviceTypeSchema>
export type Log = Infer<typeof logSchema>

