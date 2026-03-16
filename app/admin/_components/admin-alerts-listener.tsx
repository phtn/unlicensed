'use client'

import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {
  ADMIN_ALERTS_IDENTIFIER,
  normalizeAdminAlertsConfig,
  playAdminAlert,
  type AdminAlertEventKey,
} from '@/lib/admin-alerts'
import {useQuery} from 'convex/react'
import {useEffect, useMemo, useRef} from 'react'

type AlertActivityType = 'order_created' | 'payment_completed' | 'user_signup'

const ACTIVITY_TO_ALERT_KEY: Record<AlertActivityType, AdminAlertEventKey> = {
  order_created: 'orders',
  payment_completed: 'payments',
  user_signup: 'signups',
}

export function AdminAlertsListener() {
  const {user} = useAuthCtx()
  const alertSetting = useQuery(api.admin.q.getAdminByIdentifier, {
    identifier: ADMIN_ALERTS_IDENTIFIER,
  })
  const activities = useQuery(
    api.activities.q.getRecentActivities,
    user?.uid
      ? {
          limit: 12,
          types: ['order_created', 'payment_completed', 'user_signup'],
          includeUsers: false,
          includeViewers: false,
        }
      : 'skip',
  )
  const conversations = useQuery(
    api.messages.q.getConversations,
    user?.uid ? {fid: user.uid} : 'skip',
  )
  const staff = useQuery(api.staff.q.getStaff)

  const config = useMemo(
    () => normalizeAdminAlertsConfig(alertSetting?.value),
    [alertSetting?.value],
  )
  const activeStaffEmails = useMemo(
    () =>
      new Set(
        (staff ?? [])
          .filter((member) => member.active)
          .map((member) => member.email?.trim().toLowerCase())
          .filter((email): email is string => Boolean(email)),
      ),
    [staff],
  )
  const seenIdsRef = useRef<Set<string>>(new Set())
  const activitiesInitializedRef = useRef(false)
  const unreadCountByConversationRef = useRef<Map<string, number>>(new Map())
  const conversationsInitializedRef = useRef(false)
  const queueRef = useRef(Promise.resolve())

  useEffect(() => {
    if (!activities) return

    const nextIds = new Set(activities.map((activity) => String(activity._id)))

    if (!activitiesInitializedRef.current) {
      seenIdsRef.current = nextIds
      activitiesInitializedRef.current = true
      return
    }

    const freshActivities = [...activities]
      .filter((activity) => !seenIdsRef.current.has(String(activity._id)))
      .sort((a, b) => a.createdAt - b.createdAt)

    seenIdsRef.current = nextIds

    if (!config.enabled || freshActivities.length === 0) return

    freshActivities.forEach((activity) => {
      const alertKey = ACTIVITY_TO_ALERT_KEY[activity.type as AlertActivityType]
      if (!alertKey) return

      const alertConfig = config[alertKey]
      if (!alertConfig.enabled) return

      queueRef.current = queueRef.current
        .catch(() => undefined)
        .then(() => playAdminAlert(alertConfig))
        .catch(() => undefined)
    })
  }, [activities, config])

  useEffect(() => {
    if (!conversations) return

    const nextUnreadCounts = new Map(
      conversations.map((conversation) => [
        conversation.otherUserId,
        conversation.unreadCount,
      ]),
    )

    if (!conversationsInitializedRef.current) {
      unreadCountByConversationRef.current = nextUnreadCounts
      conversationsInitializedRef.current = true
      return
    }

    const freshCustomerMessages = conversations.filter((conversation) => {
      const previousUnreadCount =
        unreadCountByConversationRef.current.get(conversation.otherUserId) ?? 0
      const email = conversation.otherUser?.email?.trim().toLowerCase()
      const isStaffConversation = email ? activeStaffEmails.has(email) : false

      return (
        !isStaffConversation && conversation.unreadCount > previousUnreadCount
      )
    })

    unreadCountByConversationRef.current = nextUnreadCounts

    if (!config.enabled || !config.messages.enabled) return
    if (freshCustomerMessages.length === 0) return

    freshCustomerMessages.forEach(() => {
      queueRef.current = queueRef.current
        .catch(() => undefined)
        .then(() => playAdminAlert(config.messages))
        .catch(() => undefined)
    })
  }, [activeStaffEmails, config, conversations])

  return null
}
