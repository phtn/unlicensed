import {Icon} from '@/lib/icons'
import Image from '@/components/ui/app-image'

/**
 * Email link callback route.
 * The link sent by sendSignInLinkToEmail points here (e.g. /auth/email-link?oobCode=...&mode=signIn).
 * Root layout’s EmailLinkHandler completes sign-in; this page provides a dedicated callback surface.
 */
export default function AuthEmailLinkPage() {
  return (
    <main className='relative isolate min-h-[calc(100vh-5rem)] overflow-hidden px-4 py-10 sm:px-6 lg:px-8'>
      <div className='absolute inset-0 -z-20 bg-(image:--backdrop-primary)' />
      <div className='absolute inset-0 -z-10 bg-(image:--backdrop-secondary) opacity-90' />
      <div className='absolute left-1/2 top-20 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-brand/20 blur-3xl' />
      <div className='mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center justify-center'>
        <section className='w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/12 bg-white/8 p-8 text-center shadow-(--shadow-card) backdrop-blur-3xl sm:p-10'>
          <div className='mx-auto flex size-20 items-center justify-center rounded-full bg-white/50 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.75)]'>
            <Image
              src='/svg/rf-logo-hot-pink-2.svg'
              alt='Rapid Fire'
              width={52}
              height={52}
              priority
            />
          </div>
          <p className='mt-6 text-xs font-medium uppercase tracking-[0.32em] text-white/56'>
            Email link sign-in
          </p>
          <h1 className='mt-3 font-clash text-4xl tracking-[-0.04em] text-white sm:text-5xl'>
            Finishing your sign-in
          </h1>
          <p className='mx-auto mt-4 max-w-md text-sm leading-6 text-white/72 sm:text-base'>
            This route is only here to complete your magic link. If you opened
            the email on another device, enter the same address in the dialog
            that appears.
          </p>
          <div className='mt-8 flex items-center justify-center gap-3 text-sm text-white/52'>
            <span className='size-2 rounded-full bg-brand animate-pulse' />
            <span>Authenticating your session…</span>
            <Icon name='spinners-ring' className='size-4' />
          </div>
        </section>
      </div>
    </main>
  )
}
