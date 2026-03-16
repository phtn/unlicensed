interface CtaSectionProps {
  title?: string
  description?: string
}

export const CtaSection = ({title, description}: CtaSectionProps) => {
  return (
    <section
      id='cta'
      className='border-0 border-neutral-200 px-4 py-12 md:py-32 mt-10 sm:px-6 sm:py-28 lg:px-8'
      aria-labelledby='cta-heading'>
      <div className='mx-auto max-w-2xl text-center'>
        <h2
          id='cta-heading'
          className='text-3xl md:text-4xl font-clash font-semibold text-neutral-900 dark:text-white sm:text-3xl'>
          {title ?? 'Ready to explore bundle deals?'}
        </h2>
        <p className='mt-3 text-neutral-500 dark:text-neutral-400'>
          {description ?? 'Try our new bundle deals, mix and match your way.'}
        </p>
      </div>
    </section>
  )
}
