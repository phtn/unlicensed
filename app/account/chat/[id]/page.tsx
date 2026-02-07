'use client'

import {Button} from '@heroui/react'
import {useAuthCtx} from '@/ctx/auth'
import {Icon} from '@/lib/icons'
import {useParams} from 'next/navigation'
import {ChatContent} from '../content'

export default function ConversationPage() {
  const {user} = useAuthCtx()
  const params = useParams()
  const conversationId = params.id as string

  if (!user?.uid) {
    return (
      <div className='flex flex-col h-screen items-center justify-center space-y-1'>
        <div className='whitespace-nowrap flex items-center space-x-2'>
          <span>Reloading Messages</span>
          <Icon name='spinners-ring' className='text-orange-300 size-5' />
        </div>
        <Button className='whitespace-nowrap' color='primary'>
          Re-authenticate to access chat
        </Button>
      </div>
    )
  }

  return <ChatContent initialConversationId={conversationId} />
}
