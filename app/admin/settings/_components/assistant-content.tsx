'use client'

import {commonInputClassNames} from '@/app/admin/_components/ui/fields'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {parseAssistantConfig} from '@/lib/assistant/config'
import {Button, Switch, TextArea} from '@/lib/heroui'
import {useMutation, useQuery} from 'convex/react'
import {Activity, startTransition, useCallback, useState} from 'react'
import {ContentHeader, PrimaryButton} from './components'

export const AssistantContent = () => {
  const {user} = useAuthCtx()
  const config = useQuery(api.admin.q.getAdminByIdentifier, {
    identifier: 'ai_assistant_config',
  })
  const assistantProfile = useQuery(api.assistant.q.getAssistantProfile)
  const updateAdmin = useMutation(api.admin.m.updateAdminByIdentifier)
  const seedAssistant = useMutation(api.assistant.seed.seedAssistant)

  const configValue = parseAssistantConfig(config?.value)
  const configKey =
    config !== undefined
      ? `${configValue.instructions}-${configValue.isActive}-${configValue.catalogSupportEnabled}`
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
          variant='primary'
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
  configValue: ReturnType<typeof parseAssistantConfig>
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
  const [instructions, setInstructions] = useState(configValue.instructions)
  const [isActive, setIsActive] = useState(configValue.isActive)
  const [catalogSupportEnabled, setCatalogSupportEnabled] = useState(
    configValue.catalogSupportEnabled,
  )
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<null | 'saved' | 'error'>(null)

  const handleSave = useCallback(() => {
    setIsSaving(true)
    setSaveMessage(null)
    startTransition(() => {
      updateAdmin({
        identifier: 'ai_assistant_config',
        value: {instructions, isActive, catalogSupportEnabled},
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
  }, [catalogSupportEnabled, instructions, isActive, updateAdmin, userUid])

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
          <TextArea
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
        <div className='flex flex-col gap-4'>
          <div className='flex items-center justify-between gap-4'>
            <div className='flex flex-col gap-1'>
              <span className='text-sm font-medium'>Active</span>
              <span className='text-xs text-muted-foreground'>
                Allow customers to chat with the assistant.
              </span>
            </div>
            <Switch
              isSelected={isActive}
              onValueChange={setIsActive}
              isDisabled={!configLoaded}
              size='sm'
            />
          </div>
          <div className='hidden _flex items-center justify-between gap-4'>
            <div className='flex flex-col gap-1'>
              <span className='text-sm font-medium'>
                Catalog links and knowledge
              </span>
              <span className='text-xs text-muted-foreground'>
                Let the assistant use the live store catalog for product-aware
                answers and auto-linked product/category mentions.
              </span>
            </div>
            <Switch
              isSelected={catalogSupportEnabled}
              onValueChange={setCatalogSupportEnabled}
              isDisabled={!configLoaded}
              size='sm'
            />
          </div>
        </div>
      </div>

      {/*<ViewTransition>
        <div className='flex items-center gap-3'>
          <Button
            radius='none'
            color='default'
            variant='tertiary'
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
