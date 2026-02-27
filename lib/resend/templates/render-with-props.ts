import {renderTemplate} from '@/lib/resend'
import {InvitationEmail} from './invitation'
import type {InvitationEmailProps} from './invitation'
export type InvitationTemplateProps = Omit<InvitationEmailProps, 'recipientName'> & {
  recipientName?: string
}

const INVITATION_DEFAULT_PROPS: InvitationTemplateProps = {
  inviterName: 'We',
  title: 'You are invited.',
  message: 'Enter the code below to access our shop:',
  ctaLabel: 'Shop Now',
  ctaUrl: 'https://rapidfirenow.com',
  accessCode: 'RF2026',
}

export async function renderInvitationTemplate(
  props: InvitationTemplateProps & {recipientName: string},
): Promise<string> {
  return renderTemplate(InvitationEmail, props)
}

export function parseInvitationTemplateProps(
  json: string | undefined,
): InvitationTemplateProps {
  if (!json?.trim()) return INVITATION_DEFAULT_PROPS
  try {
    const parsed = JSON.parse(json) as Partial<InvitationTemplateProps>
    return {
      ...INVITATION_DEFAULT_PROPS,
      ...parsed,
    }
  } catch {
    return INVITATION_DEFAULT_PROPS
  }
}

export function getInvitationDefaultProps(): InvitationTemplateProps {
  return {...INVITATION_DEFAULT_PROPS}
}
