'use client'

import {useAuthCtx} from '@/ctx/auth'
import {ChatContent} from './content'

export default function ChatPage() {
  const {user} = useAuthCtx()

  if (!user?.uid) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <p className='text-muted-foreground'>Please sign in to access chat</p>
      </div>
    )
  }

  return <ChatContent />
}
