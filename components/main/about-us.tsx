export const AboutUs = () => {
  return (
    <section className='py-16 md:py-24 lg:py-32'>
      <div className='max-w-7xl mx-auto px-4 md:px-6 lg:px-8'>
        {/* Header */}
        <div className='text-center mb-16 md:mb-20'>
          <h2 className='text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight'>
            ABOUT US
          </h2>
          <p className='text-brand text-lg md:text-xl font-medium'>
            Fire in its purest state.
          </p>
        </div>

        {/* Two Column Content */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16'>
          {/* Left Column */}
          <div className='space-y-6 md:space-y-8 md:pr-8 md:border-r md:border-[#c026d3]'>
            <p className='text-base md:text-lg leading-relaxed text-gray-300'>
              Rapid Fire is a fast-paced online quiz game designed to test how
              quickly you can think under pressure.
            </p>
            <p className='text-base md:text-lg leading-relaxed text-gray-300'>
              Each question gives you only seconds to respond—no overthinking,
              no second chances.
            </p>
            <p className='text-base md:text-lg leading-relaxed text-gray-300'>
              Just pure focus, speed, and instinct. Whether you&apos;re playing
              for fun, training your brain, or challenging friends, Rapid Fire
              pushes your reflexes and decision-making skills to the limit.
            </p>
            <p className='text-base md:text-lg leading-relaxed text-gray-300'>
              The goal is simple: answer fast, stay sharp, and beat the clock.
            </p>
          </div>

          {/* Right Column */}
          <div className='space-y-6 md:space-y-8'>
            <p className='text-base md:text-lg leading-relaxed text-gray-300'>
              A refined, high-intensity quiz experience built for sharp minds
              who thrive under pressure.
            </p>
            <p className='text-base md:text-lg leading-relaxed text-gray-300'>
              Every question is crafted to challenge your speed, precision, and
              focus—because in Rapid Fire, hesitation costs more than a wrong
              answer.
            </p>
            <p className='text-base md:text-lg leading-relaxed text-gray-300'>
              Designed with a clean interface and smooth gameplay, Rapid Fire
              delivers a premium experience where every second matters. No
              clutter. No distractions. Just you, the clock, and your ability to
              think fast with confidence.
            </p>
            <p className='text-base md:text-lg leading-relaxed text-gray-300'>
              This isn&apos;t just a game—it&apos;s a test of mental agility.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
