'use client'

import {commonInputClassNames} from '@/app/admin/_components/ui/fields'
import {SectionHeader} from '@/components/ui/section-header'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {Button, Switch, Textarea} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {startTransition, useCallback, useState, ViewTransition} from 'react'

const DEFAULT_INSTRUCTIONS = `You are a bubbly and radiant assistant named Fire Girl.
Follow these rules:
- Be helpful, friendly, professional, and direct.
- Keep responses concise (prefer short paragraphs or bullets).
- Answer questions about Rapid Fire's products, categories, order status, and policies.
- Help users understand how to use the platform.
- Provide accurate information about insurance, business cards, and networking features (only if you're confident it's correct).
- For policy, privacy, or purchase questions, use Rapid Fire's legal documents as the source of truth (when provided in context):
  - https://rapidfirenow.com/terms-of-use (Terms of Use)
  - https://rapidfirenow.com/privacy-policy (Privacy Policy)
  - https://rapidfirenow.com/purchase-agreement (Purchase Agreement)
  - src/legal/documents.ts (document slugs/titles)
- If the answer isn't clearly covered by the legal docs or provided context, say so and direct the user to support@rapidfirenow.com (do not guess).
- Do not provide legal advice; provide factual guidance and direct users to support@rapidfirenow.com for legal/account-specific concerns.`

type AssistantConfigValue = {
  instructions?: string
  isActive?: boolean
}

export const AssistantContent = () => {
  const {user} = useAuthCtx()
  const config = useQuery(api.admin.q.getAdminByIdentifier, {
    identifier: 'ai_assistant_config',
  })
  const assistantProfile = useQuery(api.assistant.q.getAssistantProfile)
  const updateAdmin = useMutation(api.admin.m.updateAdminByIdentifier)
  const seedAssistant = useMutation(api.assistant.seed.seedAssistant)

  const configValue =
    config?.value && typeof config.value === 'object'
      ? (config.value as AssistantConfigValue)
      : undefined
  const configKey =
    config !== undefined
      ? `${configValue?.instructions ?? ''}-${configValue?.isActive ?? false}`
      : 'loading'

  return (
    <div className='flex w-full flex-col gap-4'>
      <div className='flex items-center justify-between'>
        <SectionHeader title='AI Assistant Configuration' />
        <SeedAssistantButton
          canSeed={assistantProfile === null}
          isSeeded={assistantProfile != null}
          isLoading={assistantProfile === undefined}
          onSeed={seedAssistant}
        />
      </div>
      <AIAssistantFormInner
        key={configKey}
        configValue={configValue}
        configLoaded={config !== undefined}
        updateAdmin={updateAdmin}
        userUid={user?.uid}
      />
    </div>
  )
}

function SeedAssistantButton({
  canSeed,
  isSeeded,
  isLoading,
  onSeed,
}: {
  canSeed: boolean
  isSeeded: boolean
  isLoading: boolean
  onSeed: () => Promise<unknown>
}) {
  const [isSeeding, setIsSeeding] = useState(false)

  const handleSeed = useCallback(() => {
    if (!canSeed || isSeeding) return
    setIsSeeding(true)
    startTransition(() => {
      onSeed()
        .then(() => setIsSeeding(false))
        .catch(() => setIsSeeding(false))
    })
  }, [canSeed, isSeeding, onSeed])

  return (
    <ViewTransition>
      <div className='flex flex-col gap-2'>
        <Button
          radius='none'
          color='success'
          variant='solid'
          className='rounded-sm'
          isDisabled={!canSeed || isLoading || isSeeding}
          isLoading={isSeeding}
          onPress={handleSeed}>
          Seed assistant
        </Button>
        {isSeeded && (
          <span className='text-muted-foreground text-sm'>
            Assistant is already seeded.
          </span>
        )}
      </div>
    </ViewTransition>
  )
}

function AIAssistantFormInner({
  configValue,
  configLoaded,
  updateAdmin,
  userUid,
}: {
  configValue: AssistantConfigValue | undefined
  configLoaded: boolean
  updateAdmin: (args: {
    identifier: string
    value: Record<string, string | boolean>
    uid: string
  }) => Promise<unknown>
  userUid: string | undefined
}) {
  const [instructions, setInstructions] = useState(
    configValue?.instructions ?? DEFAULT_INSTRUCTIONS,
  )
  const [isActive, setIsActive] = useState(configValue?.isActive ?? false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<null | 'saved' | 'error'>(null)

  const handleSave = useCallback(() => {
    setIsSaving(true)
    setSaveMessage(null)
    startTransition(() => {
      updateAdmin({
        identifier: 'ai_assistant_config',
        value: {instructions, isActive},
        uid: userUid ?? 'anonymous',
      })
        .then(() => {
          setIsSaving(false)
          setSaveMessage('saved')
          setTimeout(() => setSaveMessage(null), 2000)
        })
        .catch(() => {
          setIsSaving(false)
          setSaveMessage('error')
        })
    })
  }, [instructions, isActive, updateAdmin, userUid])

  return (
    <section className='flex w-md flex-col gap-4'>
      <div className='flex flex-col gap-4 w-full'>
        <div className='flex max-w-6xl flex-col gap-2'>
          <Textarea
            label='Instructions'
            type='text'
            value={instructions}
            onValueChange={setInstructions}
            className='w-full'
            classNames={commonInputClassNames}
            isDisabled={!configLoaded}
            minRows={12}
          />
        </div>
        <div className='flex items-center justify-between'>
          <Switch
            isSelected={isActive}
            onValueChange={setIsActive}
            isDisabled={!configLoaded}
            size='sm'>
            Assistant active
          </Switch>
          <Button
            radius='none'
            color='default'
            variant='flat'
            onPress={handleSave}
            isDisabled={isSaving || !configLoaded || !userUid}
            className='rounded-sm'
            isLoading={isSaving}>
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
      <ViewTransition>
        <div className='flex items-center gap-3'>
          <Button
            radius='none'
            color='default'
            variant='flat'
            onPress={handleSave}
            isDisabled={isSaving || !configLoaded || !userUid}
            className='rounded-sm'
            isLoading={isSaving}>
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
          {saveMessage === 'saved' && (
            <span className='text-sm text-emerald-600 dark:text-emerald-400'>
              Saved
            </span>
          )}
          {saveMessage === 'error' && (
            <span className='text-sm text-destructive'>Save failed</span>
          )}
        </div>
      </ViewTransition>
    </section>
  )
}
