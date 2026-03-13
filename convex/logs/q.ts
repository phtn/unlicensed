import {v} from 'convex/values'
import {query} from '../_generated/server'
import {safeGet} from '../utils/id_validation'

const US_STATE_NAME_BY_CODE = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
  DC: 'District of Columbia',
} as const

const US_STATE_LOOKUP = Object.fromEntries(
  Object.entries(US_STATE_NAME_BY_CODE).flatMap(([code, name]) => [
    [normalizeLocationKey(code), name],
    [normalizeLocationKey(name), name],
  ]),
) as Record<string, string>

function normalizeLocationKey(value: string) {
  return value.toLowerCase().replace(/[^a-z]/g, ' ').replace(/\s+/g, ' ').trim()
}

function isUnitedStatesCountry(country?: string | null) {
  if (!country) {
    return false
  }

  const normalizedCountry = normalizeLocationKey(country)
  return (
    normalizedCountry === 'us' ||
    normalizedCountry === 'usa' ||
    normalizedCountry === 'united states' ||
    normalizedCountry === 'united states of america' ||
    normalizedCountry.includes('united states')
  )
}

function normalizeUsState(location?: string | null) {
  if (!location) {
    return null
  }

  const locationParts = location.split(',')
  const lastLocationPart = locationParts[locationParts.length - 1] ?? ''
  const candidates = [location, lastLocationPart]

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeLocationKey(candidate)

    if (!normalizedCandidate) {
      continue
    }

    const stateName = US_STATE_LOOKUP[normalizedCandidate]
    if (stateName) {
      return stateName
    }
  }

  return null
}

/**
 * Get logs with pagination
 */
export const getLogs = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal('page_visit'),
        v.literal('api_request'),
        v.literal('error'),
        v.literal('action'),
      ),
    ),
    userId: v.optional(v.id('users')),
    path: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50

    // Start with base query
    let logs
    if (args.type) {
      // Use index for type filter
      logs = await ctx.db
        .query('logs')
        .withIndex('by_type', (q) => q.eq('type', args.type!))
        .order('desc')
        .collect()
    } else {
      // Use index for created_at when no type filter
      logs = await ctx.db
        .query('logs')
        .withIndex('by_created_at')
        .order('desc')
        .collect()
    }

    // Apply additional filters in memory
    let filteredLogs = logs

    if (args.userId !== undefined) {
      filteredLogs = filteredLogs.filter((log) => log.userId === args.userId)
    }

    if (args.path) {
      filteredLogs = filteredLogs.filter((log) => log.path.includes(args.path!))
    }

    if (args.startDate) {
      filteredLogs = filteredLogs.filter((log) => log.createdAt >= args.startDate!)
    }

    if (args.endDate) {
      filteredLogs = filteredLogs.filter((log) => log.createdAt <= args.endDate!)
    }

    // Apply pagination
    const hasMore = filteredLogs.length > limit
    const results = hasMore ? filteredLogs.slice(0, limit) : filteredLogs

    // Fetch user data for logs that have userId
    // Validate userId from database before using in get()
    const logsWithUsers = await Promise.all(
      results.map(async (log) => {
        if (log.userId) {
          const user = await safeGet(ctx.db, 'users', log.userId)
          return {
            ...log,
            user: user
              ? {
                  name: user.name,
                  email: user.email,
                  photoUrl: user.photoUrl,
                }
              : null,
          }
        }
        return {
          ...log,
          user: null,
        }
      }),
    )

    return {
      logs: logsWithUsers,
      hasMore,
      nextCursor: hasMore ? results[results.length - 1]._id : null,
    }
  },
})

/**
 * Get logs by user ID
 */
export const getLogsByUser = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50
    const logs = await ctx.db
      .query('logs')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(limit)

    return logs
  },
})

/**
 * Get logs by path
 */
export const getLogsByPath = query({
  args: {
    path: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50
    const logs = await ctx.db
      .query('logs')
      .withIndex('by_path', (q) => q.eq('path', args.path))
      .order('desc')
      .take(limit)

    return logs
  },
})

/**
 * Get visit statistics
 */
export const getVisitStats = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    path: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db.query('logs').withIndex('by_type', (q) => q.eq('type', 'page_visit'))

    const logs = await query.collect()

    // Apply date filters
    let filteredLogs = logs
    if (args.startDate) {
      filteredLogs = filteredLogs.filter((log) => log.createdAt >= args.startDate!)
    }
    if (args.endDate) {
      filteredLogs = filteredLogs.filter((log) => log.createdAt <= args.endDate!)
    }
    if (args.path) {
      filteredLogs = filteredLogs.filter((log) => log.path === args.path)
    }

    // Calculate statistics
    const totalVisits = filteredLogs.length
    const uniqueVisitors = new Set(filteredLogs.map((log) => log.ipAddress)).size
    const uniqueUsers = new Set(
      filteredLogs.filter((log) => log.userId).map((log) => log.userId),
    ).size

    // Group by path
    const visitsByPath: Record<string, number> = {}
    filteredLogs.forEach((log) => {
      visitsByPath[log.path] = (visitsByPath[log.path] || 0) + 1
    })

    // Group by device type
    const visitsByDevice: Record<string, number> = {}
    filteredLogs.forEach((log) => {
      const device = log.deviceType || 'unknown'
      visitsByDevice[device] = (visitsByDevice[device] || 0) + 1
    })

    // Group by country
    const visitsByCountry: Record<string, number> = {}
    filteredLogs.forEach((log) => {
      if (log.country) {
        visitsByCountry[log.country] = (visitsByCountry[log.country] || 0) + 1
      }
    })

    const visitsByUsState: Record<string, number> = {}
    let totalUnitedStatesVisits = 0

    filteredLogs.forEach((log) => {
      if (!isUnitedStatesCountry(log.country)) {
        return
      }

      totalUnitedStatesVisits += 1

      const stateName = normalizeUsState(log.region || log.city)
      if (!stateName) {
        return
      }

      visitsByUsState[stateName] = (visitsByUsState[stateName] || 0) + 1
    })

    return {
      totalVisits,
      uniqueVisitors,
      uniqueUsers,
      visitsByPath,
      visitsByDevice,
      visitsByCountry,
      totalUnitedStatesVisits,
      visitsByUsState,
    }
  },
})

/**
 * Get geo information (country, city) for an IP address from existing logs
 * Returns the most recent log entry with geo data for the given IP
 */
export const getGeoByIp = query({
  args: {
    ipAddress: v.string(),
  },
  handler: async (ctx, args) => {
    // Query all logs and filter by IP address
    // Since we don't have an index on ipAddress, we'll scan recent logs
    const logs = await ctx.db
      .query('logs')
      .withIndex('by_created_at')
      .order('desc')
      .take(100) // Check last 100 logs for performance

    // Find the most recent log with this IP that has geo data
    const logWithGeo = logs.find(
      (log) =>
        log.ipAddress === args.ipAddress &&
        (log.country || log.city),
    )

    if (logWithGeo) {
      return {
        country: logWithGeo.country ?? null,
        city: logWithGeo.city ?? null,
      }
    }

    return null
  },
})
