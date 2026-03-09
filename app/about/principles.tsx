export const Principles = () => {
  const PRINCIPLES = [
    {
      eyebrow: 'Browse',
      title: 'Category',
      body: 'Curated flowers, extracts, vapes, pre-rolls, and edibles.',
    },
    {
      eyebrow: 'Deals',
      title: 'Mix-and-Match Bundles',
      body: 'Mix-and-match your way to straightforward savings.',
    },
    {
      eyebrow: 'Rewards',
      title: 'Cash back and shipping perks',
      body: 'Shipping, rewards, pricing, and availability should be obvious before you place an order.',
    },
    {
      eyebrow: 'Payments',
      title: 'Secure and Easy Checkout',
      body: 'Select from multiple payment methods, including Credit card, Crypto, and CashApp.',
    },
  ]
  return (
    <section className='px-4 pb-14 sm:px-6 md:pb-20'>
      <div className='mx-auto max-w-7xl overflow-hidden rounded-xs border border-r-0 border-foreground/10 bg-linear-to-r from-dark-table via-brand/90 to-black py-1 px-1 text-white'>
        <div className='rounded-sm bg-black/30 px-4 py-6 backdrop-blur-md sm:px-6 sm:py-8 md:px-8 md:py-10'>
          <div className='grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]'>
            <div className='mt-1 sm:mt-4'>
              <p className='font-clash text-xs uppercase tracking-[0.26em] text-white/70 sm:text-sm sm:tracking-[0.32em]'>
                What you should expect
              </p>
              <h2 className='mt-3 max-w-[12ch] font-bone text-3xl tracking-tight sm:text-5xl md:text-6xl'>
                Built for fast minds.
              </h2>
            </div>
            <div className='grid gap-3 sm:grid-cols-2'>
              {PRINCIPLES.map((principle) => (
                <article
                  key={principle.title}
                  className='border border-foreground/10 bg-background/5 p-4 sm:p-6'>
                  <p className='font-clash text-[11px] uppercase tracking-[0.22em] text-pink-400 sm:text-xs sm:tracking-[0.28em]'>
                    {principle.eyebrow}
                  </p>
                  <h3 className='mt-3 font-clash text-lg font-semibold sm:mt-4 sm:text-xl'>
                    {principle.title}
                  </h3>
                  <p className='mt-2 text-sm leading-6 text-white/60 sm:mt-3'>
                    {principle.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
