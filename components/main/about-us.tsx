export const AboutUs = () => {
  return (
    <section className='py-16 md:py-24 lg:py-32'>
      <div className='max-w-7xl mx-auto px-4 md:px-6 lg:px-8'>
        {/* Header */}
        <div className='text-center mb-16 md:mb-20'>
          <h2 className='text-4xl md:text-5xl font-polysans lg:text-6xl font-bold mb-4 tracking-tight'>
            ABOUT US
          </h2>
          <p className='text-brand font-polysans font-semibold text-lg md:text-xl'>
            Fire in its purest state.
          </p>
        </div>

        {/* Two Column Content */}
        <div className='grid grid-cols-1 md:grid-cols-11 gap-8 md:gap-12 lg:gap-16'>
          {/* Left Column */}
          <div className='space-y-6 md:space-y-8 md:col-span-5 md:pr-8 text-center md:text-right'>
            <p className='text-base md:text-lg leading-relaxed opacity-80'>
              Rapid Fire is your grandma&apos;s dream dispensary.
            </p>
            <p className='text-base md:text-lg leading-relaxed opacity-80'>
              We&apos;re the reason she started smoking at eighty.
            </p>
            <p className='text-base md:text-lg leading-relaxed opacity-80'>
              We&apos;re all about getting high without getting played.
            </p>
            <p className='text-base md:text-lg leading-relaxed opacity-80'>
              We&apos;re all about fast minds finding high quality highs.
            </p>
          </div>

          <div className='relative flex items-center justify-center h-full'>
            <div className='absolute h-full w-0.75 bg-linear-to-b from-transparent via-fuchsia-200 blur-xs to-transparent rounded-full' />
            <div className='h-full w-0.75 bg-linear-to-b from-transparent via-brand to-transparent rounded-full' />
          </div>

          {/* Right Column */}
          <div className='space-y-6 md:space-y-8 md:col-span-5 text-center md:text-left'>
            <p className='text-base md:text-lg leading-relaxed opacity-80'>
              We&apos;re the reason your ex still texts you.
            </p>
            <p className='text-base md:text-lg leading-relaxed opacity-80'>
              We&apos;re the reason your boss can&apos;t fire you.
            </p>
            <p className='text-base md:text-lg leading-relaxed opacity-80'>
              We&apos;re the reason you&apos;re on top of everything.
            </p>
            <p className='text-base md:text-lg leading-relaxed opacity-80'>
              A refined, high-intensity swoon and pure quality bloom.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
