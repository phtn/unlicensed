import type {InvitationEmailProps} from './invitation'

export type InvitationTemplateProps = Omit<
  InvitationEmailProps,
  'recipientName'
> & {
  recipientName?: string
}

export const INVITATION_DEFAULT_PROPS: InvitationTemplateProps = {
  inviterName: 'We',
  title: 'You are invited.',
  message: 'Enter the code below to access our shop:',
  ctaLabel: 'Shop Now',
  ctaUrl: 'https://rapidfirenow.com',
  accessCode: 'RF2026',
}

export function parseInvitationTemplateProps(
  json: string | undefined,
): InvitationTemplateProps {
  if (!json?.trim()) {
    return {...INVITATION_DEFAULT_PROPS}
  }

  try {
    const parsed = JSON.parse(json) as Partial<InvitationTemplateProps>
    return {
      ...INVITATION_DEFAULT_PROPS,
      ...parsed,
    }
  } catch {
    return {...INVITATION_DEFAULT_PROPS}
  }
}

export function getInvitationDefaultProps(): InvitationTemplateProps {
  return {...INVITATION_DEFAULT_PROPS}
}
