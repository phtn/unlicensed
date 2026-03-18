'use client'

import {commonInputClassNames} from '@/app/admin/_components/ui/fields'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {Button, Switch, Textarea} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {Activity, startTransition, useCallback, useState} from 'react'
import {ContentHeader, PrimaryButton} from './components'

const DEFAULT_INSTRUCTIONS = `You are a bubbly and radiant assistant named Rapid Assistant.
Follow these rules:
- No emojis.
- Be helpful, friendly, professional, and direct.
- Keep responses concise (prefer short paragraphs or bullets).
- Answer questions about Rapid Fire's products, categories, order status, and policies.
- Help users understand how to use the platform.
- For any product related questions, use the product catalog as the source of truth and provide a link like this: /lobby/category/flower?tier=aaaa&subcategory=regular&brand=jungle-boys.
- For any product specifics, provide a link and use /lobby/products/[slug] catalog as the source of truth.
- For policy, privacy, or purchase questions, use Rapid Fire's legal documents as the source of truth (when provided in context):
  - /terms-of-use (Terms of Service)
  - /privacy-policy (Privacy Policy)
  - /purchase-agreement (Purchase Agreement)
- If the answer isn't clearly covered by the legal docs or provided context, say so and direct the user to hello@rapidfirenow.com (do not guess).
- Do not provide legal advice; provide factual guidance and direct users to hello@rapidfirenow.com for legal/account-specific concerns.`

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
      <AIAssistantFormInner
        key={configKey}
        configValue={configValue}
        configLoaded={config !== undefined}
        canSeedAssistant={assistantProfile === null}
        isAssistantSeeded={assistantProfile != null}
        isAssistantLoading={assistantProfile === undefined}
        onSeedAssistant={seedAssistant}
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
    <Activity mode={isSeeded ? 'hidden' : 'visible'}>
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
      </div>
    </Activity>
  )
}

function AIAssistantFormInner({
  configValue,
  configLoaded,
  canSeedAssistant,
  isAssistantSeeded,
  isAssistantLoading,
  onSeedAssistant,
  updateAdmin,
  userUid,
}: {
  configValue: AssistantConfigValue | undefined
  configLoaded: boolean
  canSeedAssistant: boolean
  isAssistantSeeded: boolean
  isAssistantLoading: boolean
  onSeedAssistant: () => Promise<unknown>
  updateAdmin: (args: {
    identifier: string
    value: Record<string, string | boolean>
    uid: string
  }) => Promise<unknown>
  userUid: string | undefined
}) {
  const [instructions, setInstructions] = useState(
    configValue?.instructions
      ? `${configValue.instructions} \n\n**Primary Instructions**\n\n${DEFAULT_INSTRUCTIONS}`
      : DEFAULT_INSTRUCTIONS,
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
    <section className='flex md:w-md flex-col gap-4'>
      <ContentHeader
        title='AI Assistant Configuration'
        description='Configure your AI assistant settings here.'>
        <div className='flex items-center gap-3'>
          <SeedAssistantButton
            canSeed={canSeedAssistant}
            isSeeded={isAssistantSeeded}
            isLoading={isAssistantLoading}
            onSeed={onSeedAssistant}
          />
          <PrimaryButton
            onPress={handleSave}
            icon={isSaving ? 'spinners-ring' : 'save'}
            label='Save Changes'
            disabled={isSaving || !configLoaded || !userUid}
          />
          {saveMessage === 'saved' && (
            <span className='text-sm text-emerald-600 dark:text-emerald-400'>
              Saved
            </span>
          )}
          {saveMessage === 'error' && (
            <span className='text-sm text-destructive'>Save failed</span>
          )}
        </div>
      </ContentHeader>

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
            Active
          </Switch>
        </div>
      </div>

      {/*<ViewTransition>
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
      </ViewTransition>*/}
    </section>
  )
}
