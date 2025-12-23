import {v} from 'convex/values'
import {mutation} from '../_generated/server'
import {logSchema} from './d'

/**
 * Create a log entry for site visits or other events
 */
export const createLog = mutation({
  args: logSchema,
  handler: async (ctx, args) => {
    const logId = await ctx.db.insert('logs', {
      type: args.type,
      method: args.method,
      path: args.path,
      fullUrl: args.fullUrl,
      queryParams: args.queryParams,
      userId: args.userId ?? null,
      sessionId: args.sessionId,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      referrer: args.referrer,
      origin: args.origin,
      deviceType: args.deviceType,
      browser: args.browser,
      browserVersion: args.browserVersion,
      os: args.os,
      osVersion: args.osVersion,
      screenWidth: args.screenWidth,
      screenHeight: args.screenHeight,
      country: args.country,
      region: args.region,
      city: args.city,
      statusCode: args.statusCode,
      responseTime: args.responseTime,
      metadata: args.metadata,
      createdAt: args.createdAt,
    })

    return logId
  },
})

/**
 * Batch create multiple log entries (useful for bulk operations)
 */
export const createLogsBatch = mutation({
  args: {
    logs: v.array(logSchema),
  },
  handler: async (ctx, args) => {
    const logIds: string[] = []
    
    for (const log of args.logs) {
      const logId = await ctx.db.insert('logs', {
        type: log.type,
        method: log.method,
        path: log.path,
        fullUrl: log.fullUrl,
        queryParams: log.queryParams,
        userId: log.userId ?? null,
        sessionId: log.sessionId,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        referrer: log.referrer,
        origin: log.origin,
        deviceType: log.deviceType,
        browser: log.browser,
        browserVersion: log.browserVersion,
        os: log.os,
        osVersion: log.osVersion,
        screenWidth: log.screenWidth,
        screenHeight: log.screenHeight,
        country: log.country,
        region: log.region,
        city: log.city,
        statusCode: log.statusCode,
        responseTime: log.responseTime,
        metadata: log.metadata,
        createdAt: log.createdAt,
      })
      logIds.push(logId)
    }
    
    return logIds
  },
})

