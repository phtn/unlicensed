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
        <div className='rounded-sm bg-black/30 px-6 py-8 backdrop-blur-md md:px-8 md:py-10'>
          <div className='grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]'>
            <div className='mt-4'>
              <p className='font-clash text-sm uppercase tracking-[0.32em] text-white/70'>
                What you should expect
              </p>
              <h2 className='mt-3 font-bone text-4xl tracking-tight sm:text-5xl md:text-6xl'>
                Built for fast minds.
              </h2>
            </div>
            <div className='grid gap-3 sm:grid-cols-2'>
              {PRINCIPLES.map((principle) => (
                <article
                  key={principle.title}
                  className='border border-foreground/10 bg-background/5 p-6'>
                  <p className='font-clash text-xs uppercase tracking-[0.28em] text-pink-400'>
                    {principle.eyebrow}
                  </p>
                  <h3 className='mt-4 font-clash text-xl font-semibold '>
                    {principle.title}
                  </h3>
                  <p className='mt-3 text-sm leading-6 text-white/60'>
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
