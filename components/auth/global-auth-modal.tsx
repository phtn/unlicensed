'use client'

import {useAuthCtx} from '@/ctx/auth'
import {AuthModal} from './auth-modal'

/**
 * Renders the auth modal when isAuthModalOpen is true (e.g. opened by
 * EmailLinkHandler for "complete email link" flow on /auth/email-link).
 */
export function GlobalAuthModal() {
  const {isAuthModalOpen, closeAuthModal} = useAuthCtx()
  return (
    <AuthModal
      isOpen={isAuthModalOpen}
      onClose={closeAuthModal}
      mode="login"
    />
  )
}
