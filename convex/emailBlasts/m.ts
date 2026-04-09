import {v} from 'convex/values'
import {internal} from '../_generated/api'
import {internalMutation, mutation} from '../_generated/server'

const BLAST_SEND_INTERVAL_MS = 600

function normalizeEmailList(value: string[] | undefined): string[] | undefined {
  const next = value
    ?.map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)

  return next?.length ? next : undefined
}

function normalizeRecipientList(
  recipients: Array<{
    name: string
    email: string
  }>,
) {
  return recipients
    .map((recipient) => ({
      name: recipient.name.trim(),
      email: recipient.email.trim(),
    }))
    .filter((recipient) => recipient.email.length > 0)
}

export const start = mutation({
  args: {
    emailSettingId: v.id('emailSettings'),
    mailingListId: v.id('mailingLists'),
    initiatedByUid: v.string(),
    initiatedByEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const [emailSetting, mailingList] = await Promise.all([
      ctx.db.get(args.emailSettingId),
      ctx.db.get(args.mailingListId),
    ])

    if (!emailSetting) {
      throw new Error('Email template not found.')
    }

    if (!mailingList) {
      throw new Error('Mailing list not found.')
    }

    const recipients = normalizeRecipientList(mailingList.recipients)
    if (recipients.length === 0) {
      throw new Error('The selected mailing list has no valid recipients.')
    }

    const subject = emailSetting.subject?.trim()
    if (!subject) {
      throw new Error('The selected email template is missing a subject.')
    }

    const activeBlast = (
      await ctx.db
        .query('emailBlasts')
        .withIndex('by_email_setting_and_created_at', (q) =>
          q.eq('emailSettingId', args.emailSettingId),
        )
        .order('desc')
        .take(10)
    ).find((blast) => blast.status === 'queued' || blast.status === 'sending')

    if (activeBlast) {
      return activeBlast._id
    }

    const now = Date.now()
    const blastId = await ctx.db.insert('emailBlasts', {
      emailSettingId: args.emailSettingId,
      mailingListId: args.mailingListId,
      mailingListName: mailingList.name,
      templateTitle: emailSetting.title?.trim() || 'Untitled template',
      subject,
      template: emailSetting.template?.trim() || undefined,
      templateProps: emailSetting.templateProps ?? undefined,
      html: emailSetting.html ?? undefined,
      body: emailSetting.body ?? undefined,
      cc: normalizeEmailList(emailSetting.cc ?? undefined),
      bcc: normalizeEmailList(emailSetting.bcc ?? undefined),
      recipients,
      totalRecipients: recipients.length,
      processedRecipients: 0,
      sentRecipients: 0,
      failedRecipients: 0,
      nextRecipientIndex: 0,
      currentRecipientEmail: undefined,
      processingRecipientIndex: undefined,
      lastProviderMessageId: undefined,
      lastError: undefined,
      stopOnError: true,
      status: 'queued',
      initiatedByUid: args.initiatedByUid,
      initiatedByEmail: args.initiatedByEmail.trim().toLowerCase(),
      createdAt: now,
      updatedAt: now,
      startedAt: now,
      finishedAt: undefined,
    })

    await ctx.scheduler.runAfter(0, internal.emailBlasts.a.processNext, {
      blastId,
    })

    return blastId
  },
})

export const claimNextRecipient = internalMutation({
  args: {
    blastId: v.id('emailBlasts'),
    expectedIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const blast = await ctx.db.get(args.blastId)
    if (!blast) {
      return null
    }

    if (blast.status === 'completed' || blast.status === 'failed') {
      return null
    }

    if (blast.processingRecipientIndex !== undefined) {
      return null
    }

    if (blast.nextRecipientIndex !== args.expectedIndex) {
      return null
    }

    const recipient = blast.recipients[args.expectedIndex]
    const now = Date.now()

    if (!recipient) {
      await ctx.db.patch(args.blastId, {
        status: 'completed',
        currentRecipientEmail: undefined,
        processingRecipientIndex: undefined,
        finishedAt: blast.finishedAt ?? now,
        updatedAt: now,
      })

      return null
    }

    await ctx.db.patch(args.blastId, {
      status: 'sending',
      processingRecipientIndex: args.expectedIndex,
      currentRecipientEmail: recipient.email,
      lastError: undefined,
      updatedAt: now,
    })

    return {
      recipientIndex: args.expectedIndex,
      recipient,
    }
  },
})

export const markRecipientSent = internalMutation({
  args: {
    blastId: v.id('emailBlasts'),
    recipientIndex: v.number(),
    providerMessageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const blast = await ctx.db.get(args.blastId)
    if (!blast) {
      return null
    }

    if (blast.processingRecipientIndex !== args.recipientIndex) {
      return null
    }

    const now = Date.now()
    const nextRecipientIndex = args.recipientIndex + 1
    const isComplete = nextRecipientIndex >= blast.totalRecipients

    await ctx.db.patch(args.blastId, {
      status: isComplete ? 'completed' : 'queued',
      sentRecipients: blast.sentRecipients + 1,
      processedRecipients: blast.processedRecipients + 1,
      nextRecipientIndex,
      processingRecipientIndex: undefined,
      currentRecipientEmail: undefined,
      lastProviderMessageId:
        args.providerMessageId ?? blast.lastProviderMessageId ?? undefined,
      updatedAt: now,
      finishedAt: isComplete ? now : undefined,
    })

    if (!isComplete) {
      await ctx.scheduler.runAfter(
        BLAST_SEND_INTERVAL_MS,
        internal.emailBlasts.a.processNext,
        {
          blastId: args.blastId,
        },
      )
    }

    return {
      status: isComplete ? 'completed' : 'queued',
    }
  },
})

export const markRecipientFailed = internalMutation({
  args: {
    blastId: v.id('emailBlasts'),
    recipientIndex: v.number(),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const blast = await ctx.db.get(args.blastId)
    if (!blast) {
      return null
    }

    if (blast.processingRecipientIndex !== args.recipientIndex) {
      return null
    }

    const now = Date.now()
    const nextRecipientIndex = args.recipientIndex + 1
    const shouldContinue =
      !blast.stopOnError && nextRecipientIndex < blast.totalRecipients
    const isComplete = !shouldContinue && nextRecipientIndex >= blast.totalRecipients
    const nextStatus = shouldContinue
      ? 'queued'
      : isComplete
        ? 'completed'
        : 'failed'

    await ctx.db.patch(args.blastId, {
      status: nextStatus,
      failedRecipients: blast.failedRecipients + 1,
      processedRecipients: blast.processedRecipients + 1,
      nextRecipientIndex,
      processingRecipientIndex: undefined,
      currentRecipientEmail: undefined,
      lastError: args.error,
      updatedAt: now,
      finishedAt: nextStatus === 'queued' ? undefined : now,
    })

    if (shouldContinue) {
      await ctx.scheduler.runAfter(
        BLAST_SEND_INTERVAL_MS,
        internal.emailBlasts.a.processNext,
        {
          blastId: args.blastId,
        },
      )
    }

    return {
      status: nextStatus,
    }
  },
})
