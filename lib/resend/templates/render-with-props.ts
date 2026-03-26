import {renderTemplate} from '@/lib/resend'
import {InvitationEmail} from './invitation'
import {
  getInvitationDefaultProps,
  parseInvitationTemplateProps,
  type InvitationTemplateProps,
} from './invitation-defaults'
export {getInvitationDefaultProps, parseInvitationTemplateProps}
export type {InvitationTemplateProps}

export async function renderInvitationTemplate(
  props: InvitationTemplateProps & {recipientName: string},
): Promise<string> {
  return renderTemplate(InvitationEmail, props)
}
