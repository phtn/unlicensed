export function CtaSection() {
  return (
    <section
      id='cta'
      className='border-0 border-neutral-200 px-4 py-32 mt-10 sm:px-6 sm:py-28 lg:px-8'
      aria-labelledby='cta-heading'>
      <div className='mx-auto max-w-2xl text-center'>
        <h2
          id='cta-heading'
          className='text-xl md:text-4xl font-clash font-semibold text-neutral-900 dark:text-white sm:text-3xl'>
          Ready to explore bundle deals?
        </h2>
        <p className='mt-3 text-neutral-500 dark:text-neutral-400'>
          Try our new bundle deals, mix and match your way.
        </p>
        {/*<div className='mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row'>
          <LinkButton href='#cta'>Get started for free</LinkButton>
          <Link
            href='#'
            className='text-sm font-medium text-neutral-500 underline underline-offset-4 hover:text-neutral-900 dark:hover:text-white'>
            Contact sales
          </Link>
        </div>*/}
      </div>
    </section>
  )
}
