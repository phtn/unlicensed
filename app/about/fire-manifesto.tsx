const MANIFESTO_PARAGRAPHS = [
  <>
    For over 10 years, we&apos;ve done one thing really well:{' '}
    <strong>finding incredible cannabis.</strong>
  </>,
  <>
    With only organic growth and zero marketing spend to date, our selective
    curation has earned us a <strong>90% customer retention rate</strong> in one
    of the toughest markets in the country.
  </>,
  <>
    Now we&apos;re bringing that same legendary menu{' '}
    <strong>straight to your doorstep.</strong>
  </>,
  <>
    <strong>Rapid Fire</strong> is a members-only club built by growers,
    curators, product testers, and unapologetic quality snobs. We partner with
    elite farms, including <strong>Cannabis Cup and Zalympix winners</strong>,
    but only the best batches make the menu.
  </>,
  <>
    From cultivation to delivery, every process has been dialed in to ensure{' '}
    <strong>true farm-freshness.</strong>
  </>,
  <>
    Our goal is simple:
    <br />
    <strong>Premium cannabis. Fair prices. Zero compromises.</strong>
  </>,
  <>
    <strong>Welcome to Rapid Fire, your plug&apos;s worst nightmare.</strong>
  </>,
] as const

export const FireManifesto = () => {
  return (
    <section className='px-4 pb-10 sm:px-6 md:pb-14'>
      <div className='mx-auto max-w-7xl'>
        <div className='relative overflow-hidden rounded-xs border border-r-0 border-foreground/10 bg-linear-to-r from-dark-table via-brand/30 to-black px-1 py-1 text-white'>
          <div className='rounded-sm bg-black/75 px-6 py-8 backdrop-blur-md md:px-8 md:py-10'>
            <div className='grid gap-8 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] lg:gap-10'>
              <div className='space-y-4'>
                <p className='font-clash text-brand text-sm uppercase tracking-[0.32em]'>
                  Why Rapid Fire
                </p>
                <h2 className='max-w-[10ch] font-bone text-4xl tracking-tight sm:text-5xl md:text-6xl'>
                  The standard behind the menu.
                </h2>
                <p className='max-w-sm text-sm leading-6 text-white/62'>
                  The screenshot copy is here, but translated into the same
                  language as the rest of the page: darker surfaces, clearer
                  hierarchy, and structured reading rhythm.
                </p>
              </div>

              <div className='grid gap-3'>
                {MANIFESTO_PARAGRAPHS.map((paragraph, index) => (
                  <article
                    key={index}
                    className='border border-foreground/10 bg-background/5 p-5 sm:p-6'>
                    <p className='max-w-4xl font-clash text-base leading-7 text-white/82 sm:text-lg sm:leading-8 [&_strong]:font-semibold [&_strong]:text-white'>
                      {paragraph}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
